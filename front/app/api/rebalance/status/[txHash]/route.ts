import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/lib/contracts';
import database from '@/lib/database';
import { TransactionStatus, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = params;
    const { searchParams } = new URL(request.url);
    const rpcUrl = searchParams.get('rpcUrl');
    const waitForConfirmation = searchParams.get('wait') === 'true';
    
    // Get rebalance event from database
    const rebalanceEvent = database.getRebalanceEvent(txHash);
    if (!rebalanceEvent) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Transaction not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined);
    
    try {
      // Check transaction confirmation
      const [tx, receipt] = await Promise.all([
        contractService.getTransaction(txHash),
        contractService.getTransactionReceipt(txHash)
      ]);
      
      if (!tx) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Transaction not found on blockchain',
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 404 });
      }
      
      let status: TransactionStatus['status'] = 'pending';
      let events: any[] = [];
      
      if (receipt) {
        status = receipt.status === 1 ? 'confirmed' : 'failed';
        
        // Parse event logs if confirmed
        if (receipt.status === 1) {
          events = receipt.logs.map(log => ({
            address: log.address,
            topics: log.topics,
            data: log.data,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index
          }));
          
          // Update rebalance event in database if newly confirmed
          if (rebalanceEvent.status === 'pending') {
            database.updateRebalanceEvent(txHash, {
              status: 'confirmed',
              gasUsed: receipt.gasUsed.toString()
            });
            
            // Update pool state after successful rebalance
            await updatePoolStateAfterRebalance(
              rebalanceEvent.poolAddress, 
              contractService
            );
          }
        } else if (rebalanceEvent.status === 'pending') {
          // Transaction failed
          database.updateRebalanceEvent(txHash, {
            status: 'failed'
          });
        }
      } else if (waitForConfirmation) {
        // Wait for confirmation if requested
        try {
          const confirmedReceipt = await contractService.getProvider().waitForTransaction(
            txHash, 
            1, // 1 confirmation
            30000 // 30 second timeout
          );
          
          if (confirmedReceipt) {
            status = confirmedReceipt.status === 1 ? 'confirmed' : 'failed';
            
            if (confirmedReceipt.status === 1) {
              events = confirmedReceipt.logs.map(log => ({
                address: log.address,
                topics: log.topics,
                data: log.data,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.index
              }));
              
              // Update database
              database.updateRebalanceEvent(txHash, {
                status: 'confirmed',
                gasUsed: confirmedReceipt.gasUsed.toString()
              });
              
              await updatePoolStateAfterRebalance(
                rebalanceEvent.poolAddress, 
                contractService
              );
            } else {
              database.updateRebalanceEvent(txHash, {
                status: 'failed'
              });
            }
          }
        } catch (waitError) {
          console.warn('Wait for confirmation timeout:', waitError);
          // Continue with pending status
        }
      }
      
      const transactionStatus: TransactionStatus = {
        hash: txHash,
        status,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString(),
        events: events.length > 0 ? events : undefined
      };
      
      const response: ApiResponse<{
        transaction: TransactionStatus;
        rebalanceEvent: typeof rebalanceEvent;
        poolUpdated: boolean;
      }> = {
        success: true,
        data: {
          transaction: transactionStatus,
          rebalanceEvent: database.getRebalanceEvent(txHash) || rebalanceEvent,
          poolUpdated: status === 'confirmed'
        },
        timestamp: Date.now()
      };
      
      return NextResponse.json(response);
      
    } catch (blockchainError) {
      console.error('Blockchain query error:', blockchainError);
      
      // Return database information even if blockchain query fails
      const response: ApiResponse<{
        transaction: TransactionStatus;
        rebalanceEvent: typeof rebalanceEvent;
        poolUpdated: boolean;
      }> = {
        success: true,
        data: {
          transaction: {
            hash: txHash,
            status: rebalanceEvent.status,
            error: 'Unable to query blockchain'
          },
          rebalanceEvent,
          poolUpdated: false
        },
        timestamp: Date.now()
      };
      
      return NextResponse.json(response);
    }
    
  } catch (error) {
    console.error('Transaction status error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

async function updatePoolStateAfterRebalance(
  poolAddress: string, 
  contractService: ContractService
) {
  try {
    const pairContract = await contractService.getPairContract(poolAddress);
    
    // Get updated reserves
    const [reserve0, reserve1] = await Promise.all([
      pairContract.reserve0(),
      pairContract.reserve1()
    ]);
    
    const newRatio = parseFloat(contractService.formatUnits(reserve0)) / 
                    parseFloat(contractService.formatUnits(reserve1));
    
    const pool = database.getPool(poolAddress);
    const isImbalanced = pool ? Math.abs(newRatio - pool.targetRatio) > 0.1 : false;
    
    // Update pool in database
    database.updatePool(poolAddress, {
      reserveA: reserve0.toString(),
      reserveB: reserve1.toString(),
      currentRatio: newRatio,
      needsRebalancing: isImbalanced
    });
    
    // Add historical data point
    database.addHistoricalData(poolAddress, {
      timestamp: Date.now(),
      ratio: newRatio,
      tvl: pool?.tvl || 0,
      volume: pool?.volume24h || 0,
      fees: pool?.fees24h || 0
    });
    
    console.log(`Pool ${poolAddress} state updated after rebalance`);
    
  } catch (error) {
    console.error('Error updating pool state after rebalance:', error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = params;
    const { action } = await request.json();
    
    const rebalanceEvent = database.getRebalanceEvent(txHash);
    if (!rebalanceEvent) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Transaction not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    switch (action) {
      case 'cancel':
        // Mark as cancelled (only if still pending)
        if (rebalanceEvent.status === 'pending') {
          database.updateRebalanceEvent(txHash, {
            status: 'failed'
          });
          
          const response: ApiResponse<{ cancelled: boolean }> = {
            success: true,
            data: { cancelled: true },
            timestamp: Date.now()
          };
          
          return NextResponse.json(response);
        } else {
          throw new Error('Cannot cancel confirmed or failed transaction');
        }
        
      case 'retry':
        // This would typically create a new transaction
        // For now, just return the current status
        const response: ApiResponse<{ retryAvailable: boolean }> = {
          success: true,
          data: { retryAvailable: rebalanceEvent.status === 'failed' },
          timestamp: Date.now()
        };
        
        return NextResponse.json(response);
        
      default:
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    console.error('Transaction action error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 400 });
  }
}
