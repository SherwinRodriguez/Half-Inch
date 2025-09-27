import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import database from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const factoryAddress = process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c';
    
    console.log('🔍 Checking Factory contract for all token pairs...');
    console.log('Factory Address:', factoryAddress);
    
    // Use multiple RPC endpoints for better reliability
    const rpcEndpoints = [
      'https://public-node.testnet.rsk.co',
      'https://rootstock-testnet.drpc.org',
      'https://mycrypto.testnet.rsk.co'
     
    ];
    
    let contractService: ContractService | null = null;
    let workingRpcUrl = '';
    
    // Try each RPC endpoint until one works
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`🔄 Trying RPC: ${rpcUrl}`);
        contractService = new ContractService(rpcUrl);
        
        // Test basic network connectivity first
        const provider = contractService.getProvider();
        await provider.getNetwork();
        
        workingRpcUrl = rpcUrl;
        console.log(`✅ Successfully connected to: ${rpcUrl}`);
        break;
      } catch (rpcError) {
        console.log(`❌ RPC ${rpcUrl} failed: ${rpcError.message}`);
        continue;
      }
    }
    
    if (!contractService) {
      console.log('❌ All RPC endpoints failed!');
      return NextResponse.json({
        success: false,
        error: 'All RPC endpoints failed. Please check your network connection or try again later.',
        data: {
          factoryAddress,
          rpcEndpoints,
          suggestion: 'Try again later or check if the Rootstock testnet is accessible'
        },
        timestamp: Date.now()
      }, { status: 500 });
    }
    
    console.log('Using RPC URL:', workingRpcUrl);
    
    // First, check if the contract actually exists
    console.log('\n🔍 Checking if Factory contract exists...');
    try {
      const provider = contractService.getProvider();
      const code = await provider.getCode(factoryAddress);
      
      if (code === '0x') {
        console.log('❌ NO CONTRACT FOUND at Factory address!');
        console.log('   This means the Factory contract has not been deployed yet.');
        
        return NextResponse.json({
          success: false,
          error: 'Factory contract not deployed',
          data: {
            factoryAddress,
            hasContract: false,
            message: 'No contract found at the specified Factory address',
            suggestions: [
              'Deploy the Factory contract using: cd d:\\Hues-full\\block && npx hardhat run scripts/deploy.js --network rskTestnet',
              'Update your .env file with the correct Factory address after deployment',
              'Verify you are on the correct network (Rootstock Testnet)'
            ]
          },
          timestamp: Date.now()
        });
      }
      
      console.log(`✅ Contract exists! Code length: ${code.length} characters`);
      
    } catch (codeError) {
      console.log(`❌ Error checking contract code: ${codeError.message}`);
      return NextResponse.json({
        success: false,
        error: `Failed to check contract: ${codeError.message}`,
        timestamp: Date.now()
      }, { status: 500 });
    }
    
    // Now try to interact with the Factory contract
    console.log('\n🔍 Getting Factory contract instance...');
    let factoryContract;
    let allPairsLength = 0;
    
    try {
      factoryContract = await contractService.getFactoryContract(factoryAddress);
      
      // Since there's no allPairsLength() function, find the length by trying indices
      console.log('🔍 Finding total number of pairs...');
      let pairCount = 0;
      
      try {
        // Try to get pairs starting from index 0 until we get an error
        for (let i = 0; i < 1000; i++) { // Reasonable limit to prevent infinite loop
          try {
            const pairAddress = await factoryContract.allPairs(i);
            if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
              pairCount++;
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
      
      allPairsLength = pairCount;
      console.log(`📊 Total pairs in Factory: ${allPairsLength}`);
      
    } catch (contractError) {
      console.log(`❌ Error calling Factory contract: ${contractError.message}`);
      
      if (contractError.message.includes('execution reverted')) {
        return NextResponse.json({
          success: false,
          error: 'Factory contract call failed - contract may have different ABI or be corrupted',
          data: {
            factoryAddress,
            hasContract: true,
            contractError: contractError.message,
            suggestions: [
              'Verify the Factory contract ABI matches the deployed contract',
              'Check if the contract was deployed correctly',
              'Try redeploying the Factory contract'
            ]
          },
          timestamp: Date.now()
        });
      }
      
      throw contractError;
    }
    
    const pairs: any[] = [];
    
    // Get all pairs from Factory.allPairs[]
    for (let i = 0; i < allPairsLength; i++) {
      try {
        const pairAddress = await factoryContract.allPairs(i);
        console.log(`\n📍 Pair ${i + 1}:`);
        console.log(`   Address: ${pairAddress}`);
        
        // Get pair contract details
        const pairContract = await contractService.getPairContract(pairAddress);
        
        const [token0Address, token1Address] = await Promise.all([
          pairContract.token0(),
          pairContract.token1()
        ]);
        
        console.log(`   Token0: ${token0Address}`);
        console.log(`   Token1: ${token1Address}`);
        
        // Get token symbols
        try {
          const token0Contract = await contractService.getERC20Contract(token0Address);
          const token1Contract = await contractService.getERC20Contract(token1Address);
          
          const [token0Symbol, token1Symbol] = await Promise.all([
            token0Contract.symbol().catch(() => 'UNKNOWN'),
            token1Contract.symbol().catch(() => 'UNKNOWN')
          ]);
          
          console.log(`   Pair: ${token0Symbol} / ${token1Symbol}`);
          
          // Get reserves
          const [reserve0, reserve1] = await Promise.all([
            pairContract.reserve0().catch(() => '0'),
            pairContract.reserve1().catch(() => '0')
          ]);
          
          console.log(`   Reserves: ${reserve0} ${token0Symbol} + ${reserve1} ${token1Symbol}`);
          
          pairs.push({
            index: i,
            address: pairAddress,
            token0: {
              address: token0Address,
              symbol: token0Symbol,
              reserve: reserve0.toString()
            },
            token1: {
              address: token1Address,
              symbol: token1Symbol,
              reserve: reserve1.toString()
            },
            pairName: `${token0Symbol} / ${token1Symbol}`
          });
          
        } catch (tokenError) {
          console.log(`   ❌ Error getting token info: ${tokenError.message}`);
          pairs.push({
            index: i,
            address: pairAddress,
            token0: {
              address: token0Address,
              symbol: 'UNKNOWN',
              reserve: '0'
            },
            token1: {
              address: token1Address,
              symbol: 'UNKNOWN',
              reserve: '0'
            },
            pairName: 'UNKNOWN / UNKNOWN',
            error: tokenError.message
          });
        }
        
      } catch (pairError) {
        console.log(`❌ Error processing pair ${i}: ${pairError.message}`);
        pairs.push({
          index: i,
          address: 'ERROR',
          error: pairError.message
        });
      }
    }
    
    // Check what's in the database
    const dbPools = database.getAllPools();
    console.log(`\n💾 Pools in Database: ${dbPools.length}`);
    
    if (dbPools.length > 0) {
      console.log('\n📋 Database Pools:');
      dbPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.tokenA.symbol} / ${pool.tokenB.symbol} (${pool.address})`);
      });
    } else {
      console.log('   ⚠️  No pools found in database!');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Factory Pairs: ${pairs.length}`);
    console.log(`   Database Pools: ${dbPools.length}`);
    console.log(`   Difference: ${pairs.length - dbPools.length}`);
    
    if (pairs.length > dbPools.length) {
      console.log('   ⚠️  Some pairs from Factory are missing in database!');
      console.log('   💡 Run /api/pools/discover to sync them.');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        factoryAddress,
        totalPairs: allPairsLength,
        pairs,
        databasePools: dbPools.length,
        summary: {
          factoryPairs: pairs.length,
          databasePools: dbPools.length,
          needsSync: pairs.length > dbPools.length
        }
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Factory pairs debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
