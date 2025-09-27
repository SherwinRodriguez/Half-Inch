import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔍 CHECKING DEPLOYMENT STATUS');
    console.log('='.repeat(50));
    
    // Get contract addresses from environment
    const contracts = {
      factory: process.env.FACTORY_ADDRESS || '0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c',
      router: process.env.ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
      wtrbtc: process.env.WTRBTC_ADDRESS || '0x0000000000000000000000000000000000000000',
      tokenA: process.env.TOKEN_A_ADDRESS || '0x0000000000000000000000000000000000000000',
      tokenB: process.env.TOKEN_B_ADDRESS || '0x0000000000000000000000000000000000000000',
      rebalancer: process.env.REBALANCER_ADDRESS || '0x0000000000000000000000000000000000000000'
    };
    
    console.log('📋 Contract addresses to check:');
    Object.entries(contracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });
    
    // Find working RPC
    const rpcEndpoints = [
      'https://public-node.testnet.rsk.co',
      'https://mycrypto.testnet.rsk.co'
    ];
    
    let workingProvider: any = null;
    let workingRpcUrl = '';
    
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`\n🔄 Testing RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        const network = await Promise.race([
          provider.getNetwork(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]) as any;
        
        console.log(`✅ Connected to ${network.name} (chainId: ${network.chainId})`);
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
    
    // Check each contract
    console.log('\n🔍 Checking contract deployments...');
    const deploymentStatus = {};
    
    for (const [name, address] of Object.entries(contracts)) {
      if (address === '0x0000000000000000000000000000000000000000') {
        console.log(`⚠️  ${name.toUpperCase()}: Not configured (zero address)`);
        deploymentStatus[name] = {
          address,
          deployed: false,
          configured: false,
          codeLength: 0,
          error: 'Not configured - zero address'
        };
        continue;
      }
      
      try {
        console.log(`🔄 Checking ${name.toUpperCase()}: ${address}`);
        
        const code = await Promise.race([
          workingProvider.getCode(address),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        if (code === '0x') {
          console.log(`❌ ${name.toUpperCase()}: No contract deployed`);
          deploymentStatus[name] = {
            address,
            deployed: false,
            configured: true,
            codeLength: 0,
            error: 'No contract found at address'
          };
        } else {
          console.log(`✅ ${name.toUpperCase()}: Contract deployed (${code.length} chars)`);
          deploymentStatus[name] = {
            address,
            deployed: true,
            configured: true,
            codeLength: code.length,
            error: null
          };
        }
        
      } catch (error) {
        console.log(`❌ ${name.toUpperCase()}: Error checking - ${error.message}`);
        deploymentStatus[name] = {
          address,
          deployed: false,
          configured: true,
          codeLength: 0,
          error: error.message
        };
      }
    }
    
    // Summary
    console.log('\n📊 DEPLOYMENT SUMMARY:');
    const deployed = Object.values(deploymentStatus).filter((s: any) => s.deployed).length;
    const configured = Object.values(deploymentStatus).filter((s: any) => s.configured).length;
    const total = Object.keys(contracts).length;
    
    console.log(`   Deployed: ${deployed}/${total}`);
    console.log(`   Configured: ${configured}/${total}`);
    console.log(`   Missing: ${total - deployed}`);
    
    const deployedContracts = Object.entries(deploymentStatus).filter(([_, status]: any) => status.deployed);
    const missingContracts = Object.entries(deploymentStatus).filter(([_, status]: any) => !status.deployed);
    
    if (deployedContracts.length > 0) {
      console.log('\n✅ Deployed contracts:');
      deployedContracts.forEach(([name, status]: any) => {
        console.log(`   - ${name.toUpperCase()}: ${status.address}`);
      });
    }
    
    if (missingContracts.length > 0) {
      console.log('\n❌ Missing contracts:');
      missingContracts.forEach(([name, status]: any) => {
        console.log(`   - ${name.toUpperCase()}: ${status.error}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (deployed === 0) {
      console.log('   🚀 No contracts deployed! You need to:');
      console.log('   1. Deploy the Factory contract first');
      console.log('   2. Deploy supporting contracts (Router, WTRBTC, etc.)');
      console.log('   3. Update your .env file with the deployed addresses');
      console.log('   4. Run the deployment script from /block directory');
    } else if (deployed < total) {
      console.log('   ⚠️  Some contracts are missing:');
      missingContracts.forEach(([name]) => {
        console.log(`   - Deploy ${name.toUpperCase()} contract`);
      });
    } else {
      console.log('   🎉 All contracts are deployed and ready!');
    }
    
    console.log('\n🛠️  TO DEPLOY CONTRACTS:');
    console.log('   1. cd d:\\Hues-full\\block');
    console.log('   2. npx hardhat run scripts/deploy.js --network rskTestnet');
    console.log('   3. Update .env file with deployed addresses');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DEPLOYMENT CHECK COMPLETE!');
    
    return NextResponse.json({
      success: true,
      data: {
        workingRpcUrl,
        contracts: deploymentStatus,
        summary: {
          total,
          deployed,
          configured,
          missing: total - deployed,
          allDeployed: deployed === total,
          needsDeployment: deployed === 0
        },
        recommendations: deployed === 0 ? 
          ['Deploy all contracts using Hardhat deployment script'] :
          deployed < total ?
          [`Deploy missing contracts: ${missingContracts.map(([name]) => name).join(', ')}`] :
          ['All contracts deployed successfully']
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Deployment status error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
