import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: NextRequest) {
  try {
    const factoryAddress = process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c';
    
    console.log('\n🧪 QUICK FACTORY TEST');
    console.log('='.repeat(30));
    console.log('Factory Address:', factoryAddress);
    
    // Try to connect to RPC
    const rpcUrl = 'https://public-node.testnet.rsk.co';
    console.log('RPC URL:', rpcUrl);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test network connection
    console.log('🔄 Testing network connection...');
    const network = await Promise.race([
      provider.getNetwork(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 15000))
    ]) as any;
    
    console.log(`✅ Connected to: ${network.name} (chainId: ${network.chainId})`);
    
    // Check if contract exists
    console.log('🔄 Checking contract existence...');
    const code = await Promise.race([
      provider.getCode(factoryAddress),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Code check timeout')), 10000))
    ]) as any;
    
    const hasContract = code !== '0x';
    console.log(`Contract exists: ${hasContract ? '✅ YES' : '❌ NO'}`);
    
    if (hasContract) {
      console.log(`Code length: ${code.length} characters`);
    } else {
      console.log('No bytecode found at this address');
    }
    
    // Summary
    console.log('\n📊 QUICK TEST RESULTS:');
    console.log(`   Network: ${hasContract ? '✅' : '⚠️'} Connected`);
    console.log(`   Contract: ${hasContract ? '✅' : '❌'} ${hasContract ? 'Deployed' : 'Missing'}`);
    
    if (!hasContract) {
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Deploy Factory contract: cd d:\\Hues-full\\block && npx hardhat run scripts/deploy.js --network rskTestnet');
      console.log('   2. Update .env with deployed address');
      console.log('   3. Test again');
    }
    
    console.log('\n' + '='.repeat(30));
    
    return NextResponse.json({
      success: true,
      data: {
        factoryAddress,
        rpcUrl,
        network: {
          name: network.name,
          chainId: network.chainId.toString()
        },
        contract: {
          exists: hasContract,
          codeLength: code.length,
          address: factoryAddress
        },
        status: hasContract ? 'ready' : 'needs_deployment',
        nextSteps: hasContract ? 
          ['Factory contract is deployed and ready to use'] :
          [
            'Deploy Factory contract using Hardhat',
            'Update .env file with deployed address',
            'Test pool discovery functionality'
          ]
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        factoryAddress: process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c',
        issue: 'Network connection or RPC failure',
        suggestions: [
          'Check internet connection',
          'Try again in a few minutes',
          'Rootstock testnet may be experiencing issues'
        ]
      },
      timestamp: Date.now()
    }, { status: 500 });
  }
}
