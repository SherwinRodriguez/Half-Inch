import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rpcUrl = searchParams.get('rpcUrl') || 'https://public-node.testnet.rsk.co';
    
    console.log('\n🔍 ROUTER & FACTORY DIAGNOSTIC');
    console.log('='.repeat(50));
    
    const contractService = new ContractService(rpcUrl);
    const provider = contractService.getProvider();
    
    // Check contract addresses
    const factoryAddress = process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
    const routerAddress = process.env.ROUTER_ADDRESS || DEFAULT_ADDRESSES.router;
    
    console.log('Factory Address:', factoryAddress);
    console.log('Router Address:', routerAddress);
    
    // Check if contracts exist
    const [factoryCode, routerCode] = await Promise.all([
      provider.getCode(factoryAddress),
      provider.getCode(routerAddress)
    ]);
    
    const factoryExists = factoryCode !== '0x';
    const routerExists = routerCode !== '0x';
    
    console.log('Factory Contract Exists:', factoryExists);
    console.log('Router Contract Exists:', routerExists);
    
    let factoryInfo = null;
    let routerInfo = null;
    
    // If Router exists, check its configuration
    if (routerExists) {
      try {
        const routerContract = await contractService.getRouterContract();
        const [routerFactory, routerWTRBTC] = await Promise.all([
          routerContract.factory(),
          routerContract.wtrbtc()
        ]);
        
        routerInfo = {
          address: routerAddress,
          factory: routerFactory,
          wtrbtc: routerWTRBTC,
          factoryMatches: routerFactory.toLowerCase() === factoryAddress.toLowerCase()
        };
        
        console.log('Router Factory Address:', routerFactory);
        console.log('Router WTRBTC Address:', routerWTRBTC);
        console.log('Factory Addresses Match:', routerInfo.factoryMatches);
        
      } catch (routerError) {
        console.log('❌ Router contract call failed:', routerError.message);
        routerInfo = { error: routerError.message };
      }
    }
    
    // If Factory exists, check if it can create pairs
    if (factoryExists) {
      try {
        const factoryContract = await contractService.getFactoryContract();
        
        // Try to get a test pair (should return 0x0 if doesn't exist)
        const testPair = await factoryContract.getPair(
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222'
        );
        
        factoryInfo = {
          address: factoryAddress,
          canCallGetPair: true,
          testPairResult: testPair
        };
        
        console.log('Factory getPair test result:', testPair);
        
      } catch (factoryError) {
        console.log('❌ Factory contract call failed:', factoryError.message);
        factoryInfo = { error: factoryError.message };
      }
    }
    
    // Overall diagnosis
    let diagnosis = [];
    let canAddLiquidity = false;
    
    if (!factoryExists) {
      diagnosis.push('❌ Factory contract not deployed');
    }
    
    if (!routerExists) {
      diagnosis.push('❌ Router contract not deployed');
    }
    
    if (routerExists && factoryExists) {
      if (routerInfo && !routerInfo.factoryMatches) {
        diagnosis.push('⚠️ Router points to wrong Factory address');
      }
      
      if (routerInfo && !routerInfo.error && factoryInfo && !factoryInfo.error) {
        diagnosis.push('✅ Both contracts exist and appear functional');
        canAddLiquidity = true;
      }
    }
    
    if (diagnosis.length === 0) {
      diagnosis.push('🔍 Contracts exist but may have configuration issues');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rpcUrl,
        contracts: {
          factory: {
            address: factoryAddress,
            exists: factoryExists,
            codeLength: factoryCode.length,
            info: factoryInfo
          },
          router: {
            address: routerAddress,
            exists: routerExists,
            codeLength: routerCode.length,
            info: routerInfo
          }
        },
        diagnosis,
        canAddLiquidity,
        recommendations: canAddLiquidity 
          ? ['✅ Ready to add liquidity']
          : [
              '1. Deploy missing contracts first',
              '2. Ensure Router points to correct Factory',
              '3. Verify contract addresses in environment variables'
            ]
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Router diagnostic error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
