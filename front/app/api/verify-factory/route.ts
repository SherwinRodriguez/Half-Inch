import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { FACTORY_ABI } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const factoryAddress = process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c';
    
    console.log('\n🔍 VERIFYING FACTORY CONTRACT');
    console.log('='.repeat(50));
    console.log('Factory Address:', factoryAddress);
    
    // Test different RPC endpoints
    const rpcEndpoints = [
      'https://public-node.testnet.rsk.co',
      'https://mycrypto.testnet.rsk.co'
    ];
    
    let workingProvider = null;
    let workingRpcUrl = '';
    
    // Find a working RPC endpoint
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`\n🔄 Testing RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test basic connectivity
        const network = await Promise.race([
          provider.getNetwork(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
        workingProvider = provider;
        workingRpcUrl = rpcUrl;
        break;
        
      } catch (error) {
        console.log(`❌ RPC ${rpcUrl} failed: ${error.message}`);
        continue;
      }
    }
    
    if (!workingProvider) {
      throw new Error('No working RPC endpoint found');
    }
    
    console.log(`\n✅ Using RPC: ${workingRpcUrl}`);
    
    // Check if contract exists
    console.log('\n🔍 Checking if contract exists...');
    const code = await workingProvider.getCode(factoryAddress);
    
    if (code === '0x') {
      console.log('❌ NO CONTRACT FOUND at this address!');
      console.log('   The address has no bytecode deployed.');
      console.log('   This means either:');
      console.log('   1. The contract was never deployed');
      console.log('   2. The address is incorrect');
      console.log('   3. The contract was deployed on a different network');
      
      return NextResponse.json({
        success: false,
        error: 'No contract found at the specified address',
        data: {
          factoryAddress,
          hasCode: false,
          codeLength: 0,
          suggestions: [
            'Check if the Factory contract has been deployed',
            'Verify the correct contract address',
            'Ensure you are on the correct network (Rootstock Testnet)',
            'Deploy the Factory contract if it hasn\'t been deployed yet'
          ]
        },
        timestamp: Date.now()
      });
    }
    
    console.log(`✅ Contract exists! Code length: ${code.length} characters`);
    
    // Try to interact with the contract using the actual Factory ABI
    console.log('\n🔍 Testing contract methods...');
    
    const factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, workingProvider);
    
    const testResults = [];
    
    // Test basic getter functions that should exist
    const testMethods = [
      { name: 'feeTo', args: [] },
      { name: 'feeToSetter', args: [] },
      { name: 'allPairs', args: [0] }, // Try to get first pair
    ];
    
    for (const testMethod of testMethods) {
      try {
        console.log(`🔄 Testing ${testMethod.name}(${testMethod.args.join(', ')})...`);
        
        const result = await Promise.race([
          factoryContract[testMethod.name](...testMethod.args),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        console.log(`✅ ${testMethod.name}() = ${result}`);
        testResults.push({
          method: `${testMethod.name}(${testMethod.args.join(', ')})`,
          success: true,
          result: result.toString()
        });
        
      } catch (methodError) {
        console.log(`❌ ${testMethod.name}() failed: ${methodError.message}`);
        testResults.push({
          method: `${testMethod.name}(${testMethod.args.join(', ')})`,
          success: false,
          error: methodError.message
        });
      }
    }
    
    // Test getPair with zero addresses (should return zero address)
    try {
      console.log('🔄 Testing getPair(0x0, 0x0)...');
      const pairResult = await Promise.race([
        factoryContract.getPair('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      console.log(`✅ getPair(0x0, 0x0) = ${pairResult}`);
      testResults.push({
        method: 'getPair(0x0, 0x0)',
        success: true,
        result: pairResult
      });
      
    } catch (getPairError) {
      console.log(`❌ getPair() failed: ${getPairError.message}`);
      testResults.push({
        method: 'getPair(0x0, 0x0)',
        success: false,
        error: getPairError.message
      });
    }
    
    // Test with a different method signature in case ABI is different
    console.log('\n🔄 Testing alternative method signatures...');
    
    const alternativeABIs = [
      ["function totalPairs() external view returns (uint256)"],
      ["function pairsLength() external view returns (uint256)"],
      ["function numPairs() external view returns (uint256)"]
    ];
    
    for (const abi of alternativeABIs) {
      try {
        const altContract = new ethers.Contract(factoryAddress, abi, workingProvider);
        const methodName = abi[0].split(' ')[1].split('(')[0];
        
        console.log(`🔄 Testing ${methodName}()...`);
        const result = await Promise.race([
          altContract[methodName](),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        console.log(`✅ ${methodName}() = ${result}`);
        testResults.push({
          method: methodName,
          success: true,
          result: result.toString()
        });
        
      } catch (altError) {
        console.log(`❌ ${abi[0].split(' ')[1].split('(')[0]}() failed: ${altError.message}`);
      }
    }
    
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log(`   Contract exists: ✅`);
    console.log(`   Code length: ${code.length} chars`);
    console.log(`   Working methods: ${testResults.filter(r => r.success).length}`);
    console.log(`   Failed methods: ${testResults.filter(r => !r.success).length}`);
    
    const successfulMethods = testResults.filter(r => r.success);
    if (successfulMethods.length > 0) {
      console.log('\n✅ Working methods:');
      successfulMethods.forEach(method => {
        console.log(`   - ${method.method}: ${method.result}`);
      });
    }
    
    const failedMethods = testResults.filter(r => !r.success);
    if (failedMethods.length > 0) {
      console.log('\n❌ Failed methods:');
      failedMethods.forEach(method => {
        console.log(`   - ${method.method}: ${method.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 FACTORY VERIFICATION COMPLETE!');
    
    return NextResponse.json({
      success: true,
      data: {
        factoryAddress,
        hasCode: true,
        codeLength: code.length,
        workingRpcUrl,
        testResults,
        summary: {
          contractExists: true,
          workingMethods: successfulMethods.length,
          failedMethods: failedMethods.length,
          totalPairs: successfulMethods.find(m => m.method === 'allPairsLength')?.result || 'unknown'
        }
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Factory verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
