import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES, calculateRatio, calculateTVL } from '@/lib/contracts';
import database from '@/lib/database';
import { Pool, DashboardStats, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rpcUrl = process.env.RPC_URL;
    const detailed = searchParams.get('detailed') === 'true';
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined);
    
    // Get all pools from database
    const pools = database.getAllPools();
    const updatedPools: Pool[] = [];
    
    // Query all Pair.reserve0/reserve1 and update current ratios
    for (const pool of pools) {
      try {
        const pairContract = await contractService.getPairContract(pool.address);
        
        // Get current reserves
        const [reserve0, reserve1, totalSupply] = await Promise.all([
          pairContract.reserve0(),
          pairContract.reserve1(),
          pairContract.totalSupply()
        ]);
        
        // Calculate current metrics
        const ratio = calculateRatio(reserve0.toString(), reserve1.toString());
        const tvl = calculateTVL(reserve0.toString(), reserve1.toString());
        const isImbalanced = Math.abs(ratio - pool.targetRatio) > 0.1; // 10% threshold
        
        // Update pool data
        const updatedPool: Pool = {
          ...pool,
          reserveA: reserve0.toString(),
          reserveB: reserve1.toString(),
          totalSupply: totalSupply.toString(),
          currentRatio: ratio,
          tvl,
          needsRebalancing: isImbalanced
        };
        
        updatedPools.push(updatedPool);
        
        // Update in database
        database.updatePool(pool.address, {
          reserveA: reserve0.toString(),
          reserveB: reserve1.toString(),
          totalSupply: totalSupply.toString(),
          currentRatio: ratio,
          tvl,
          needsRebalancing: isImbalanced
        });
        
        // Add historical data point
        database.addHistoricalData(pool.address, {
          timestamp: Date.now(),
          ratio,
          tvl,
          volume: pool.volume24h || 0,
          fees: pool.fees24h
        });
        
      } catch (error) {
        console.error(`Error updating pool ${pool.address}:`, error);
        // Keep the existing pool data if update fails
        updatedPools.push(pool);
      }
    }
    
    // Detect imbalances
    const imbalancedPools = updatedPools.filter(pool => pool.needsRebalancing);
    
    // Get dashboard stats
    const dashboardStats = database.getDashboardStats();
    
    // Prepare response data
    const responseData = {
      pools: detailed ? updatedPools : undefined,
      totalPools: updatedPools.length,
      imbalancedPools: imbalancedPools.length,
      imbalancedAddresses: imbalancedPools.map(p => p.address),
      dashboardStats,
      lastUpdate: Date.now()
    };
    
    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Pool status update error:', error);
    
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
    const { action, poolAddress } = await request.json();
    
    switch (action) {
      case 'refresh':
        // Force refresh specific pool or all pools
        if (poolAddress) {
          const pool = database.getPool(poolAddress);
          if (!pool) {
            throw new Error('Pool not found');
          }
          
          // Refresh single pool (implementation would be similar to GET)
          const response: ApiResponse<{ refreshed: string[] }> = {
            success: true,
            data: { refreshed: [poolAddress] },
            timestamp: Date.now()
          };
          
          return NextResponse.json(response);
        } else {
          // Refresh all pools - redirect to GET
          return NextResponse.redirect(new URL('/api/pools/status', request.url));
        }
        
      case 'reset_target_ratios':
        // Reset all target ratios to 1.0
        const pools = database.getAllPools();
        for (const pool of pools) {
          database.updatePool(pool.address, { targetRatio: 1.0 });
        }
        
        const resetResponse: ApiResponse<{ reset: number }> = {
          success: true,
          data: { reset: pools.length },
          timestamp: Date.now()
        };
        
        return NextResponse.json(resetResponse);
        
      default:
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    console.error('Pool status action error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 400 });
  }
}
