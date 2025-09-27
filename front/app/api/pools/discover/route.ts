import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES, calculateRatio, calculateTVL } from '@/lib/contracts';
import database from '@/lib/database';
import { Pool, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const factoryAddress = searchParams.get('factoryAddress') || process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
    
    console.log('🔍 Starting pool discovery...');
    console.log('Factory Address:', factoryAddress);
    
    // Use multiple RPC endpoints for better reliability
    const rpcEndpoints = [
      'https://public-node.testnet.rsk.co',
      'https://rpc.testnet.rootstock.io',
      'https://mycrypto.testnet.rsk.co'
    ];
    
    let contractService: ContractService | null = null;
    let workingRpcUrl = '';
    
    // Try each RPC endpoint until one works
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`🔄 Trying RPC: ${rpcUrl}`);
        contractService = new ContractService(rpcUrl);
        
        // Test the connection with a simple call
        const testFactory = await contractService.getFactoryContract(factoryAddress);
        const testLength = await Promise.race([
          testFactory.allPairsLength(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        workingRpcUrl = rpcUrl;
        console.log(`✅ Successfully connected to: ${rpcUrl}`);
        break;
      } catch (rpcError) {
        console.log(`❌ RPC ${rpcUrl} failed: ${rpcError.message}`);
        continue;
      }
    }
    
    if (!contractService) {
      throw new Error('All RPC endpoints failed. Please check your network connection or try again later.');
    }
    
    console.log('Using RPC URL:', workingRpcUrl);
    const factoryContract = await contractService.getFactoryContract(factoryAddress);
    
    // Query Factory.allPairs[] - find length by trying indices since no allPairsLength() function
    console.log('🔍 Finding total number of pairs...');
    let allPairsLength = 0;
    
    try {
      // Try to get pairs starting from index 0 until we get an error
      for (let i = 0; i < 1000; i++) { // Reasonable limit
        try {
          const pairAddress = await factoryContract.allPairs(i);
          if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
            allPairsLength++;
          } else {
            break; // Empty address means we've reached the end
          }
        } catch (indexError) {
          // If we get an error, we've reached the end of the array
          break;
        }
      }
    } catch (lengthError) {
      console.log(`⚠️  Could not determine array length: ${lengthError.message}`);
    }
    
    console.log(`Discovering ${allPairsLength} pairs from factory`);
    
    const discoveredPools: Pool[] = [];
    
    // Process all pairs
    for (let i = 0; i < allPairsLength; i++) {
      try {
        const pairAddress = await factoryContract.allPairs(i);
        const pairContract = await contractService.getPairContract(pairAddress);
        
        // Get pair details
        const [token0Address, token1Address, reserve0, reserve1, totalSupply] = await Promise.all([
          pairContract.token0(),
          pairContract.token1(),
          pairContract.reserve0(),
          pairContract.reserve1(),
          pairContract.totalSupply()
        ]);
        
        // Get token symbols
        const token0Contract = await contractService.getERC20Contract(token0Address);
        const token1Contract = await contractService.getERC20Contract(token1Address);
        
        const [token0Symbol, token1Symbol] = await Promise.all([
          token0Contract.symbol(),
          token1Contract.symbol()
        ]);
        
        // Calculate metrics
        const ratio = calculateRatio(reserve0.toString(), reserve1.toString());
        const tvl = calculateTVL(reserve0.toString(), reserve1.toString());
        const targetRatio = 1.0; // Default target ratio
        const isImbalanced = Math.abs(ratio - targetRatio) > 0.1; // 10% threshold
        
        const pool: Pool = {
          address: pairAddress,
          tokenA: {
            address: token0Address,
            symbol: token0Symbol
          },
          tokenB: {
            address: token1Address,
            symbol: token1Symbol
          },
          reserveA: reserve0.toString(),
          reserveB: reserve1.toString(),
          totalSupply: totalSupply.toString(),
          currentRatio: ratio,
          targetRatio,
          needsRebalancing: isImbalanced,
          isActive: true,
          lastRebalance: null,
          rebalanceCount: 0,
          createdAt: Date.now(),
          tvl,
          volume24h: null, // Would need historical data
          fees24h: 0,      // Would need historical data
          apy: null        // Would need historical data
        };
        
        discoveredPools.push(pool);
        
        // Register pool in database
        database.addPool(pool);
        
        // Initialize pool metrics if not exists
        if (!database.getPoolMetrics(pairAddress)) {
          database.addPoolMetrics({
            address: pairAddress,
            historicalData: [{
              timestamp: Date.now(),
              ratio,
              tvl,
              volume: 0,
              fees: 0
            }],
            rebalanceHistory: [],
            performance: {
              totalRebalances: 0,
              avgTimeBetweenRebalances: 0,
              totalVolume: 0,
              totalFees: 0,
              impermanentLoss: 0
            }
          });
        }
        
      } catch (error) {
        console.error(`Error processing pair ${i}:`, error);
        continue;
      }
    }
    
    console.log(`Successfully discovered ${discoveredPools.length} pools`);
    
    const response: ApiResponse<{
      pools: Pool[];
      totalDiscovered: number;
      imbalancedCount: number;
    }> = {
      success: true,
      data: {
        pools: discoveredPools,
        totalDiscovered: discoveredPools.length,
        imbalancedCount: discoveredPools.filter(p => p.needsRebalancing).length
      },
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Pool discovery error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pools, targetRatios } = await request.json();
    
    // Set default target ratios for discovered pools
    if (pools && Array.isArray(pools)) {
      for (const poolAddress of pools) {
        const targetRatio = targetRatios?.[poolAddress] || 1.0;
        database.updatePool(poolAddress, { targetRatio });
      }
    }
    
    // Set default target ratios for all pools if none specified
    if (!pools) {
      const allPools = database.getAllPools();
      for (const pool of allPools) {
        const targetRatio = targetRatios?.[pool.address] || 1.0;
        database.updatePool(pool.address, { targetRatio });
      }
    }
    
    const response: ApiResponse<{ updated: number }> = {
      success: true,
      data: { updated: pools?.length || database.getAllPools().length },
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Set target ratios error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
