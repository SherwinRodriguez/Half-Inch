import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import database from '@/lib/database';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenA, tokenB, amountA, amountB, targetRatio, privateKey, rpcUrl, useWalletSigning, walletAddress } = body;
    
    console.log('\n📝 REQUEST BODY DEBUG');
    console.log('='.repeat(40));
    console.log('Body keys:', Object.keys(body));
    console.log('Private Key provided:', !!privateKey);
    console.log('Use Wallet Signing:', useWalletSigning);
    console.log('Wallet Address:', walletAddress);
    
    // Check authentication method
    if (!privateKey && !walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Either private key or wallet address is required for pool creation',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    if (useWalletSigning && !walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Wallet address required when using wallet signing',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    if (!useWalletSigning && !privateKey) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Private key required when not using wallet signing',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }

    console.log('\n🏊‍♂️ CREATING NEW POOL');
    console.log('='.repeat(40));
    console.log('Token A:', tokenA);
    console.log('Token B:', tokenB);
    console.log('Amount A:', amountA);
    console.log('Amount B:', amountB);
    console.log('Target Ratio:', targetRatio);
    
    // For now, we only support private key signing
    if (useWalletSigning) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Wallet signing not yet implemented. Please use private key for now.',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined, privateKey);
    
    // First, verify the Factory contract exists
    try {
      const provider = contractService.getProvider();
      const factoryAddress = process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
      const code = await provider.getCode(factoryAddress);
      
      if (code === '0x') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Factory contract not deployed. Please deploy the Factory contract first.',
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 400 });
      }
    } catch (codeError) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to verify Factory contract: ${codeError.message}`,
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 500 });
    }
    
    const factoryContract = await contractService.getFactoryContract();
    
    // Check if pair already exists (only if Factory contract exists)
    let existingPair;
    try {
      // Normalize addresses for contract calls to avoid checksum errors
      const normalizedTokenA = tokenA.toLowerCase();
      const normalizedTokenB = tokenB.toLowerCase();
      
      existingPair = await factoryContract.getPair(normalizedTokenA, normalizedTokenB);
      console.log(`Checking existing pair for ${tokenA}/${tokenB}: ${existingPair}`);
      
      if (existingPair && existingPair !== '0x0000000000000000000000000000000000000000') {
        const response: ApiResponse<null> = {
          success: false,
          error: `Pool already exists for this token pair at address: ${existingPair}`,
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 400 });
      }
    } catch (getPairError) {
      console.log(`Warning: Could not check existing pair: ${getPairError.message}`);
      // Continue anyway - the createPair call will fail if pair exists
    }
    
    try {
      // Create the pair with retry logic
      // Normalize addresses for contract calls to avoid checksum errors
      const normalizedTokenA = tokenA.toLowerCase();
      const normalizedTokenB = tokenB.toLowerCase();
      
      const tx = await contractService.retryWithDifferentRpc(async () => {
        return await factoryContract.createPair(normalizedTokenA, normalizedTokenB);
      });
      console.log(`Pool creation transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation with retry
      const receipt = await contractService.retryWithDifferentRpc(async () => {
        return await tx.wait();
      });
      
      if (receipt.status === 1) {
        // Get the new pair address from the event
        const pairCreatedEvent = receipt.logs.find((log: any) => {
          try {
            const decoded = factoryContract.interface.parseLog(log);
            return decoded?.name === 'PairCreated';
          } catch {
            return false;
          }
        });
        
        let poolAddress = '';
        if (pairCreatedEvent) {
          const decoded = factoryContract.interface.parseLog(pairCreatedEvent);
          poolAddress = decoded?.args?.pair || '';
        }
        
        if (!poolAddress) {
          // Fallback: get pair address directly
          poolAddress = await factoryContract.getPair(tokenA, tokenB);
        }
        
        // Get token information
        const token0Contract = await contractService.getERC20Contract(tokenA);
        const token1Contract = await contractService.getERC20Contract(tokenB);
        
        const [token0Symbol, token1Symbol] = await Promise.all([
          token0Contract.symbol().catch(() => 'Unknown'),
          token1Contract.symbol().catch(() => 'Unknown')
        ]);
        
        // Add pool to database
        const pool = {
          address: poolAddress,
          tokenA: {
            address: tokenA,
            symbol: token0Symbol
          },
          tokenB: {
            address: tokenB,
            symbol: token1Symbol
          },
          reserveA: '0',
          reserveB: '0',
          totalSupply: '0',
          currentRatio: 0,
          targetRatio: targetRatio || 1.0,
          needsRebalancing: false,
          isActive: true,
          lastRebalance: null,
          rebalanceCount: 0,
          createdAt: Date.now(),
          tvl: 0,
          volume24h: null,
          fees24h: 0,
          apy: null
        };
        
        database.addPool(pool);
        
        // Initialize pool metrics
        database.addPoolMetrics({
          address: poolAddress,
          historicalData: [],
          rebalanceHistory: [],
          performance: {
            totalRebalances: 0,
            avgTimeBetweenRebalances: 0,
            totalVolume: 0,
            totalFees: 0,
            impermanentLoss: 0
          }
        });
        
        const response: ApiResponse<{
          poolAddress: string;
          txHash: string;
          tokenA: string;
          tokenB: string;
          token0Symbol: string;
          token1Symbol: string;
        }> = {
          success: true,
          data: {
            poolAddress,
            txHash: tx.hash,
            tokenA: tokenA,
            tokenB: tokenB,
            token0Symbol,
            token1Symbol
          },
          timestamp: Date.now()
        };
        
        return NextResponse.json(response);
        
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (contractError: any) {
      console.error('Contract execution error:', contractError);
      
      let errorMessage = 'Pool creation failed';
      let statusCode = 400;
      
      // Handle specific error types
      if (contractError.code === 'CALL_EXCEPTION') {
        if (contractError.message?.includes('timeout') || contractError.message?.includes('Request timeout')) {
          errorMessage = 'Network timeout - please try again. The RPC provider may be overloaded.';
          statusCode = 503; // Service Unavailable
        } else if (contractError.reason) {
          errorMessage = `Contract error: ${contractError.reason}`;
        } else {
          errorMessage = 'Contract call failed. Please check your token addresses and try again.';
        }
      } else if (contractError.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds to pay for gas fees';
      } else if (contractError.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
        statusCode = 503;
      } else if (contractError.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again with a different RPC endpoint.';
        statusCode = 503;
      } else if (contractError.message) {
        errorMessage = contractError.message;
      }
      
      const response: ApiResponse<null> = {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
      
      return NextResponse.json(response, { status: statusCode });
    }
    
  } catch (error) {
    console.error('Pool creation error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
