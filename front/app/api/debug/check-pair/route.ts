import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenA = searchParams.get('tokenA') || '0x0000000000000000000000000000000000000001';
    const tokenB = searchParams.get('tokenB') || '0x0000000000000000000000000000000000000002';
    const factoryAddress = process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
    
    console.log('\n🔍 CHECKING PAIR EXISTENCE');
    console.log('='.repeat(40));
    console.log('Factory Address:', factoryAddress);
    console.log('Token A:', tokenA);
    console.log('Token B:', tokenB);
    
    // Try to connect to RPC
    const rpcUrl = 'https://public-node.testnet.rsk.co';
    const contractService = new ContractService(rpcUrl);
    
    // Check if Factory contract exists
    console.log('\n🔄 Checking Factory contract...');
    const provider = contractService.getProvider();
    const code = await provider.getCode(factoryAddress);
    
    if (code === '0x') {
      console.log('❌ Factory contract does not exist!');
      return NextResponse.json({
        success: false,
        error: 'Factory contract not deployed',
        data: {
          factoryAddress,
          hasContract: false,
          tokenA,
          tokenB,
          pairAddress: null
        },
        timestamp: Date.now()
      });
    }
    
    console.log(`✅ Factory contract exists (${code.length} chars)`);
    
    // Try to get the Factory contract and call getPair
    console.log('\n🔄 Calling getPair()...');
    try {
      const factoryContract = await contractService.getFactoryContract();
      const pairAddress = await factoryContract.getPair(tokenA, tokenB);
      
      console.log(`📍 getPair(${tokenA}, ${tokenB}) = ${pairAddress}`);
      
      const pairExists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
      console.log(`🎯 Pair exists: ${pairExists ? 'YES' : 'NO'}`);
      
      if (pairExists) {
        // Check if the pair contract actually exists
        const pairCode = await provider.getCode(pairAddress);
        const pairContractExists = pairCode !== '0x';
        console.log(`📋 Pair contract deployed: ${pairContractExists ? 'YES' : 'NO'}`);
        
        return NextResponse.json({
          success: true,
          data: {
            factoryAddress,
            hasContract: true,
            tokenA,
            tokenB,
            pairAddress,
            pairExists: true,
            pairContractExists,
            message: 'Pair already exists'
          },
          timestamp: Date.now()
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            factoryAddress,
            hasContract: true,
            tokenA,
            tokenB,
            pairAddress,
            pairExists: false,
            pairContractExists: false,
            message: 'Pair does not exist - safe to create'
          },
          timestamp: Date.now()
        });
      }
      
    } catch (getPairError) {
      console.log(`❌ getPair() failed: ${getPairError.message}`);
      
      return NextResponse.json({
        success: false,
        error: `getPair() call failed: ${getPairError.message}`,
        data: {
          factoryAddress,
          hasContract: true,
          tokenA,
          tokenB,
          pairAddress: null,
          getPairError: getPairError.message
        },
        timestamp: Date.now()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Check pair error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
