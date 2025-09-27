import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rpcUrl = searchParams.get('rpcUrl') || 'https://public-node.testnet.rsk.co';
    
    console.log('\n🔍 COMPREHENSIVE CONTRACT STATUS CHECK');
    console.log('='.repeat(50));
    
    const contractService = new ContractService(rpcUrl);
    const provider = contractService.getProvider();
    
    // Get all contract addresses
    const addresses = {
      factory: process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory,
      router: process.env.ROUTER_ADDRESS || DEFAULT_ADDRESSES.router,
      rebalancer: process.env.REBALANCER_ADDRESS || DEFAULT_ADDRESSES.rebalancerController,
      wtrbtc: process.env.WTRBTC_ADDRESS || DEFAULT_ADDRESSES.wtrbtc
    };
    
    console.log('📍 Contract Addresses:');
    Object.entries(addresses).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    
    // Check if contracts exist
    const contractChecks = await Promise.all([
      provider.getCode(addresses.factory),
      provider.getCode(addresses.router),
      provider.getCode(addresses.rebalancer),
      provider.getCode(addresses.wtrbtc)
    ]);
    
    const status = {
      factory: { 
        address: addresses.factory, 
        exists: contractChecks[0] !== '0x',
        codeLength: contractChecks[0].length
      },
      router: { 
        address: addresses.router, 
        exists: contractChecks[1] !== '0x',
        codeLength: contractChecks[1].length
      },
      rebalancer: { 
        address: addresses.rebalancer, 
        exists: contractChecks[2] !== '0x',
        codeLength: contractChecks[2].length
      },
      wtrbtc: { 
        address: addresses.wtrbtc, 
        exists: contractChecks[3] !== '0x',
        codeLength: contractChecks[3].length
      }
    };
    
    console.log('📋 Contract Status:');
    Object.entries(status).forEach(([name, info]) => {
      console.log(`${name}: ${info.exists ? '✅ EXISTS' : '❌ NOT FOUND'} (${info.codeLength} bytes)`);
    });
    
    // Check Router configuration if it exists
    let routerConfig = null;
    if (status.router.exists) {
      try {
        const routerContract = await contractService.getRouterContract();
        const [routerFactory, routerWTRBTC] = await Promise.all([
          routerContract.factory(),
          routerContract.wtrbtc()
        ]);
        
        routerConfig = {
          factory: routerFactory,
          wtrbtc: routerWTRBTC,
          factoryMatches: routerFactory.toLowerCase() === addresses.factory.toLowerCase(),
          wtrbtcMatches: routerWTRBTC.toLowerCase() === addresses.wtrbtc.toLowerCase()
        };
        
        console.log('🔧 Router Configuration:');
        console.log(`Factory: ${routerFactory} ${routerConfig.factoryMatches ? '✅' : '❌'}`);
        console.log(`WTRBTC: ${routerWTRBTC} ${routerConfig.wtrbtcMatches ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log('❌ Failed to read Router config:', error.message);
        routerConfig = { error: error.message };
      }
    }
    
    // Overall system status
    const deployedCount = Object.values(status).filter(s => s.exists).length;
    const totalCount = Object.keys(status).length;
    const isFullyDeployed = deployedCount === totalCount;
    const canCreatePools = status.factory.exists;
    const canAddLiquidity = status.factory.exists && status.router.exists && 
                           routerConfig && !routerConfig.error && routerConfig.factoryMatches;
    
    console.log('🎯 System Status:');
    console.log(`Deployed: ${deployedCount}/${totalCount} contracts`);
    console.log(`Can create pools: ${canCreatePools ? '✅' : '❌'}`);
    console.log(`Can add liquidity: ${canAddLiquidity ? '✅' : '❌'}`);
    
    // Recommendations
    const recommendations = [];
    if (!status.factory.exists) {
      recommendations.push('Deploy Factory contract');
    }
    if (!status.router.exists) {
      recommendations.push('Deploy Router contract');
    }
    if (status.router.exists && routerConfig && !routerConfig.factoryMatches) {
      recommendations.push('Router points to wrong Factory - redeploy Router with correct Factory address');
    }
    if (!status.rebalancer.exists) {
      recommendations.push('Deploy RebalancerController contract (optional for basic functionality)');
    }
    if (!status.wtrbtc.exists) {
      recommendations.push('Deploy WTRBTC contract (optional for native token wrapping)');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rpcUrl,
        addresses,
        contracts: status,
        routerConfig,
        systemStatus: {
          deployedCount,
          totalCount,
          isFullyDeployed,
          canCreatePools,
          canAddLiquidity
        },
        recommendations: recommendations.length > 0 ? recommendations : ['✅ System ready for operation']
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Contract status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
