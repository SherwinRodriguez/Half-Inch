import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import database from '@/lib/database';
import { RebalanceEvent, ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { 
      targetRatio, 
      privateKey, 
      rpcUrl, 
      maxGasPrice,
      slippageTolerance = 0.5,
      forceExecute = false 
    } = await request.json();
    
    if (!privateKey) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Private key required for transaction execution',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Get pool data
    const pool = database.getPool(address);
    if (!pool) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    // Initialize contract service with signer
    const contractService = new ContractService(rpcUrl || undefined, privateKey);
    const rebalancerContract = await contractService.getRebalancerContract();
    const pairContract = await contractService.getPairContract(address);
    
    // Validate pre-conditions
    const [currentGasPrice, lastRebalanceTime, cooldown] = await Promise.all([
      contractService.getGasPrice(),
      rebalancerContract.lastRebalance(address),
      rebalancerContract.cooldown()
    ]);
    
    // Check gas price limit
    if (maxGasPrice && currentGasPrice > BigInt(maxGasPrice)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Gas price ${contractService.formatUnits(currentGasPrice, 9)} Gwei exceeds limit ${contractService.formatUnits(maxGasPrice, 9)} Gwei`,
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Check cooldown period
    const now = Math.floor(Date.now() / 1000);
    const canRebalance = now > Number(lastRebalanceTime) + Number(cooldown);
    
    if (!canRebalance && !forceExecute) {
      const timeRemaining = (Number(lastRebalanceTime) + Number(cooldown)) - now;
      const response: ApiResponse<null> = {
        success: false,
        error: `Cooldown period active. ${timeRemaining} seconds remaining`,
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Get current reserves for ratio calculation
    const [reserve0, reserve1] = await Promise.all([
      pairContract.reserve0(),
      pairContract.reserve1()
    ]);
    
    const currentRatio = parseFloat(contractService.formatUnits(reserve0)) / 
                        parseFloat(contractService.formatUnits(reserve1));
    
    const finalTargetRatio = targetRatio || pool.targetRatio;
    const targetRatioBps = Math.floor(finalTargetRatio * 10000); // Convert to basis points
    
    // Check if rebalance is actually needed
    if (Math.abs(currentRatio - finalTargetRatio) < 0.01 && !forceExecute) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool is already balanced within tolerance',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    try {
      // Call RebalancerController.rebalance()
      const tx = await rebalancerContract.rebalance(address, targetRatioBps);
      
      console.log(`Rebalance transaction submitted: ${tx.hash}`);
      
      // Create rebalance event record
      const rebalanceEvent: RebalanceEvent = {
        txHash: tx.hash,
        timestamp: Date.now(),
        poolAddress: address,
        fromRatio: currentRatio,
        toRatio: finalTargetRatio, // Will be updated when confirmed
        targetRatio: finalTargetRatio,
        gasUsed: '0', // Will be updated when confirmed
        gasPrice: currentGasPrice.toString(),
        status: 'pending',
        swapAmount0: '0', // Will be calculated from events
        swapAmount1: '0', // Will be calculated from events
        slippage: slippageTolerance
      };
      
      // Add to database
      database.addRebalanceEvent(rebalanceEvent);
      
      // Update pool status
      database.updatePool(address, {
        lastRebalance: Date.now()
      });
      
      // Start monitoring transaction in background
      monitorTransaction(tx.hash, address, contractService).catch(error => {
        console.error('Transaction monitoring error:', error);
      });
      
      const response: ApiResponse<{
        txHash: string;
        status: string;
        estimatedConfirmation: number;
      }> = {
        success: true,
        data: {
          txHash: tx.hash,
          status: 'pending',
          estimatedConfirmation: Date.now() + (30 * 1000) // Estimate 30 seconds
        },
        timestamp: Date.now()
      };
      
      return NextResponse.json(response);
      
    } catch (contractError: any) {
      console.error('Contract execution error:', contractError);
      
      let errorMessage = 'Transaction execution failed';
      if (contractError.reason) {
        errorMessage = contractError.reason;
      } else if (contractError.message) {
        errorMessage = contractError.message;
      }
      
      const response: ApiResponse<null> = {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
      
      return NextResponse.json(response, { status: 400 });
    }
    
  } catch (error) {
    console.error('Rebalance execution error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

// Background function to monitor transaction
async function monitorTransaction(
  txHash: string, 
  poolAddress: string, 
  contractService: ContractService
) {
  try {
    console.log(`Monitoring transaction: ${txHash}`);
    
    // Wait for transaction confirmation
    const receipt = await contractService.getProvider().waitForTransaction(txHash);
    
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }
    
    // Update rebalance event with confirmation details
    const updates: Partial<RebalanceEvent> = {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed.toString()
    };
    
    if (receipt.status === 1) {
      // Parse events to get actual swap amounts
      // This would require parsing the transaction logs
      // For now, we'll update with basic confirmation
      console.log(`Transaction ${txHash} confirmed in block ${receipt.blockNumber}`);
      
      // Update pool status after successful rebalance
      const pairContract = await contractService.getPairContract(poolAddress);
      const [reserve0, reserve1] = await Promise.all([
        pairContract.reserve0(),
        pairContract.reserve1()
      ]);
      
      const newRatio = parseFloat(contractService.formatUnits(reserve0)) / 
                      parseFloat(contractService.formatUnits(reserve1));
      
      database.updatePool(poolAddress, {
        reserveA: reserve0.toString(),
        reserveB: reserve1.toString(),
        currentRatio: newRatio,
        needsRebalancing: false // Assume rebalance was successful
      });
      
      updates.toRatio = newRatio;
    } else {
      console.error(`Transaction ${txHash} failed`);
    }
    
    database.updateRebalanceEvent(txHash, updates);
    
  } catch (error) {
    console.error(`Error monitoring transaction ${txHash}:`, error);
    
    // Update event as failed
    database.updateRebalanceEvent(txHash, {
      status: 'failed'
    });
  }
}
