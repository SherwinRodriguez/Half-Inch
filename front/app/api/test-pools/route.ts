import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🧪 TESTING POOL DISCOVERY AND DATABASE SYNC');
    console.log('='.repeat(50));
    
    // Step 1: Check current database state
    const currentPools = database.getAllPools();
    console.log(`\n📊 Current Database State:`);
    console.log(`   Pools in database: ${currentPools.length}`);
    
    if (currentPools.length > 0) {
      console.log('\n📋 Current Database Pools:');
      currentPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.tokenA.symbol} / ${pool.tokenB.symbol}`);
        console.log(`      Address: ${pool.address}`);
        console.log(`      Active: ${pool.isActive}`);
        console.log(`      TVL: ${pool.tvl}`);
        console.log(`      Needs Rebalancing: ${pool.needsRebalancing}`);
      });
    }
    
    // Step 2: Call the factory debug endpoint
    console.log('\n🔍 Calling Factory Debug Endpoint...');
    
    try {
      const debugResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/debug/factory-pairs`, {
        method: 'GET',
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('\n✅ Factory Debug Response:');
        console.log(`   Success: ${debugData.success}`);
        console.log(`   Total Factory Pairs: ${debugData.data?.totalPairs || 0}`);
        console.log(`   Database Pools: ${debugData.data?.databasePools || 0}`);
        console.log(`   Needs Sync: ${debugData.data?.summary?.needsSync || false}`);
        
        if (debugData.data?.pairs && debugData.data.pairs.length > 0) {
          console.log('\n📋 Factory Pairs:');
          debugData.data.pairs.forEach((pair: any, index: number) => {
            console.log(`   ${index + 1}. ${pair.pairName || 'Unknown'}`);
            console.log(`      Address: ${pair.address}`);
            if (pair.token0 && pair.token1) {
              console.log(`      Token0: ${pair.token0.symbol} (${pair.token0.address})`);
              console.log(`      Token1: ${pair.token1.symbol} (${pair.token1.address})`);
              console.log(`      Reserves: ${pair.token0.reserve} + ${pair.token1.reserve}`);
            }
          });
        }
      } else {
        console.log(`❌ Factory debug failed: ${debugResponse.status}`);
      }
    } catch (debugError) {
      console.log(`❌ Factory debug error: ${debugError}`);
    }
    
    // Step 3: Try to discover and sync pools
    console.log('\n🔄 Attempting Pool Discovery...');
    
    try {
      const discoverResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/pools/discover`, {
        method: 'GET',
      });
      
      if (discoverResponse.ok) {
        const discoverData = await discoverResponse.json();
        console.log('\n✅ Pool Discovery Response:');
        console.log(`   Success: ${discoverData.success}`);
        console.log(`   Discovered: ${discoverData.data?.totalDiscovered || 0} pools`);
        console.log(`   Imbalanced: ${discoverData.data?.imbalancedCount || 0} pools`);
        
        if (discoverData.data?.pools && discoverData.data.pools.length > 0) {
          console.log('\n📋 Discovered Pools:');
          discoverData.data.pools.forEach((pool: any, index: number) => {
            console.log(`   ${index + 1}. ${pool.tokenA.symbol} / ${pool.tokenB.symbol}`);
            console.log(`      Address: ${pool.address}`);
            console.log(`      TVL: ${pool.tvl}`);
            console.log(`      Active: ${pool.isActive}`);
            console.log(`      Needs Rebalancing: ${pool.needsRebalancing}`);
          });
        }
      } else {
        console.log(`❌ Pool discovery failed: ${discoverResponse.status}`);
        const errorText = await discoverResponse.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (discoverError) {
      console.log(`❌ Pool discovery error: ${discoverError}`);
    }
    
    // Step 4: Check final database state
    const finalPools = database.getAllPools();
    console.log(`\n📊 Final Database State:`);
    console.log(`   Pools in database: ${finalPools.length}`);
    console.log(`   Change: +${finalPools.length - currentPools.length} pools`);
    
    if (finalPools.length > 0) {
      console.log('\n📋 Final Database Pools:');
      finalPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.tokenA.symbol} / ${pool.tokenB.symbol}`);
        console.log(`      Address: ${pool.address}`);
        console.log(`      TVL: ${pool.tvl}`);
        console.log(`      Active: ${pool.isActive}`);
        console.log(`      Needs Rebalancing: ${pool.needsRebalancing}`);
      });
    }
    
    // Step 5: Get dashboard stats
    const stats = database.getDashboardStats();
    console.log(`\n📈 Dashboard Stats:`);
    console.log(`   Total Pools: ${stats.totalPools}`);
    console.log(`   Total TVL: ${stats.totalTVL}`);
    console.log(`   Active Pools: ${stats.activePools}`);
    console.log(`   Imbalanced Pools: ${stats.imbalancedPools}`);
    console.log(`   Average APY: ${stats.averageAPY}`);
    console.log(`   Total Volume 24h: ${stats.totalVolume24h}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 POOL TESTING COMPLETE!');
    
    return NextResponse.json({
      success: true,
      data: {
        initialPools: currentPools.length,
        finalPools: finalPools.length,
        poolsAdded: finalPools.length - currentPools.length,
        stats: stats,
        pools: finalPools.map(pool => ({
          address: pool.address,
          tokenA: pool.tokenA.symbol,
          tokenB: pool.tokenB.symbol,
          tvl: pool.tvl,
          isActive: pool.isActive,
          needsRebalancing: pool.needsRebalancing
        }))
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Pool testing error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
