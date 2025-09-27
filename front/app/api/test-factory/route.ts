import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const factoryAddress = process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c';
    
    console.log('\n🧪 TESTING FACTORY CONTRACT CONNECTION');
    console.log('='.repeat(50));
    console.log('Factory Address:', factoryAddress);
    
    // Test different RPC endpoints
    const rpcEndpoints = [
      { name: 'Public Node', url: 'https://public-node.testnet.rsk.co' },
      { name: 'Rootstock RPC', url: 'https://rpc.testnet.rootstock.io' },
      { name: 'MyCrypto', url: 'https://mycrypto.testnet.rsk.co' }
    ];
    
    const results = [];
    
    for (const endpoint of rpcEndpoints) {
      console.log(`\n🔄 Testing ${endpoint.name}: ${endpoint.url}`);
      
      try {
        // Create contract service with timeout
        const contractService = new ContractService(endpoint.url);
        
        // Test with timeout
        const startTime = Date.now();
        
        const factoryContract = await contractService.getFactoryContract(factoryAddress);
        
        // Simple test call with timeout
        const allPairsLength = await Promise.race([
          factoryContract.allPairsLength(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
          )
        ]);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`✅ ${endpoint.name} SUCCESS:`);
        console.log(`   Response time: ${responseTime}ms`);
        console.log(`   Total pairs: ${allPairsLength}`);
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          success: true,
          responseTime,
          totalPairs: allPairsLength.toString(),
          error: null
        });
        
        // If we get a successful connection, try to get first pair details
        if (allPairsLength > 0) {
          try {
            console.log(`   🔍 Getting first pair details...`);
            const firstPairAddress = await Promise.race([
              factoryContract.allPairs(0),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout getting pair')), 10000)
              )
            ]);
            
            console.log(`   First pair address: ${firstPairAddress}`);
            
            results[results.length - 1].firstPairAddress = firstPairAddress;
            
            // Try to get pair contract details
            const pairContract = await contractService.getPairContract(firstPairAddress);
            const [token0, token1] = await Promise.all([
              Promise.race([
                pairContract.token0(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ]),
              Promise.race([
                pairContract.token1(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ])
            ]);
            
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            
            results[results.length - 1].token0 = token0;
            results[results.length - 1].token1 = token1;
            
          } catch (pairError) {
            console.log(`   ⚠️  Could not get pair details: ${pairError.message}`);
            results[results.length - 1].pairError = pairError.message;
          }
        }
        
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`❌ ${endpoint.name} FAILED:`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Time: ${responseTime}ms`);
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          success: false,
          responseTime,
          totalPairs: null,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    const successfulEndpoints = results.filter(r => r.success);
    const failedEndpoints = results.filter(r => !r.success);
    
    console.log(`   Successful: ${successfulEndpoints.length}/${results.length}`);
    console.log(`   Failed: ${failedEndpoints.length}/${results.length}`);
    
    if (successfulEndpoints.length > 0) {
      console.log('\n✅ Working endpoints:');
      successfulEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.name}: ${endpoint.totalPairs} pairs (${endpoint.responseTime}ms)`);
      });
    }
    
    if (failedEndpoints.length > 0) {
      console.log('\n❌ Failed endpoints:');
      failedEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.name}: ${endpoint.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 FACTORY TEST COMPLETE!');
    
    return NextResponse.json({
      success: true,
      data: {
        factoryAddress,
        results,
        summary: {
          total: results.length,
          successful: successfulEndpoints.length,
          failed: failedEndpoints.length,
          bestEndpoint: successfulEndpoints.length > 0 ? 
            successfulEndpoints.sort((a, b) => a.responseTime - b.responseTime)[0] : null
        }
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Factory test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
