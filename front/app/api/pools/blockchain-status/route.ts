import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import { Pool, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching pools directly from blockchain for status...');
    
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const timeframe = searchParams.get('timeframe') || '24h';
    
    const factoryAddress = process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
    
    // Get RPC URL from environment or use default
    const rpcUrl = 'https://public-node.testnet.rsk.co';
    const contractService = new ContractService(rpcUrl);
    
    // Get factory contract
    const factoryContract = await contractService.getFactoryContract(factoryAddress);
    
    // Fetch pools by iterating through allPairs indices
    const discoveredPools: Pool[] = [];
    const maxPairsToCheck = 20; // Limit to prevent infinite loops
    
    console.log('🔍 Finding total number of pairs...');
    
    for (let i = 0; i < maxPairsToCheck; i++) {
      try {
        console.log(`Checking pair index ${i}...`);
        const pairAddress = await factoryContract.allPairs(i);
        
        if (pairAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`No more pairs found at index ${i}`);
          break;
        }
        
        console.log(`Found pair ${i}: ${pairAddress}`);
        
        // Get pair contract
        const pairContract = await contractService.getPairContract(pairAddress);
        
        // Get pair details
        const [token0Address, token1Address, reserve0, reserve1, totalSupply] = await Promise.all([
          pairContract.token0(),
          pairContract.token1(),
          pairContract.reserve0(),
          pairContract.reserve1(),
          pairContract.totalSupply()
        ]);
        
        // Get token symbols with error handling
        const token0Contract = await contractService.getERC20Contract(token0Address);
        const token1Contract = await contractService.getERC20Contract(token1Address);
        
        let token0Symbol, token1Symbol;
        try {
          token0Symbol = await token0Contract.symbol().catch(() => `Token0_${token0Address.slice(0, 8)}`);
        } catch (error) {
          token0Symbol = `Token0_${token0Address.slice(0, 8)}`;
        }
        
        try {
          token1Symbol = await token1Contract.symbol().catch(() => `Token1_${token1Address.slice(0, 8)}`);
        } catch (error) {
          token1Symbol = `Token1_${token1Address.slice(0, 8)}`;
        }
        
        // Calculate metrics
        const reserve0Float = parseFloat(contractService.formatUnits(reserve0));
        const reserve1Float = parseFloat(contractService.formatUnits(reserve1));
        const ratio = reserve1Float > 0 ? reserve0Float / reserve1Float : 0;
        const tvl = reserve0Float + reserve1Float;
        const targetRatio = 1.0;
        const isImbalanced = Math.abs(ratio - targetRatio) > 0.1;
        
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
          volume24h: null,
          fees24h: 0,
          apy: null
        };
        
        discoveredPools.push(pool);
        console.log(`✅ Added pool: ${token0Symbol}/${token1Symbol} (${pairAddress})`);
        
      } catch (error) {
        console.error(`❌ Error processing pair ${i}:`, error);
        continue;
      }
    }
    
    console.log(`🎉 Successfully fetched ${discoveredPools.length} pools from blockchain`);
    
    // Calculate summary stats
    const imbalancedCount = discoveredPools.filter(pool => pool.needsRebalancing).length;
    const activePools = discoveredPools.filter(pool => pool.isActive).length;
    const totalTVL = discoveredPools.reduce((sum, pool) => sum + pool.tvl, 0);
    const averageAPY = 0; // Would need historical data to calculate
    
    const responseData = {
      totalPools: discoveredPools.length,
      activePools,
      imbalancedPools: imbalancedCount,
      totalTVL,
      averageAPY,
      pools: detailed ? discoveredPools : []
    };
    
    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Blockchain pool status error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
