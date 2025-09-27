const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Simple Factory Pool Check...");
  
  const FACTORY_ADDRESS = "0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c";
  console.log("Factory Address:", FACTORY_ADDRESS);
  
  try {
    // Get Factory contract
    const Factory = await ethers.getContractFactory("Factory");
    const factory = Factory.attach(FACTORY_ADDRESS);
    
    // Check if contract exists
    const provider = ethers.provider;
    const code = await provider.getCode(FACTORY_ADDRESS);
    
    if (code === '0x') {
      console.log("❌ Factory contract not found at this address");
      return;
    }
    
    console.log("✅ Factory contract found");
    
    // Get total number of pairs using allPairs.length
    try {
      // Try to get the length of allPairs array
      const totalPairs = await factory.allPairs.length;
      console.log(`📊 Total pairs: ${totalPairs}`);
      
      if (totalPairs > 0) {
        console.log("\n📋 Pair Addresses:");
        for (let i = 0; i < Math.min(totalPairs, 10); i++) { // Limit to first 10
          const pairAddress = await factory.allPairs(i);
          console.log(`   ${i + 1}. ${pairAddress}`);
        }
        
        if (totalPairs > 10) {
          console.log(`   ... and ${totalPairs - 10} more pairs`);
        }
      } else {
        console.log("❌ No pairs found in Factory");
        console.log("   This confirms your pool creation failed");
      }
      
    } catch (lengthError) {
      console.log("❌ Could not get allPairs length:", lengthError.message);
    }
    
    // Try to check specific pair from your transaction
    const tokenA = "0x5366CDdbdCa3208F05CFC3567816A8cC19F2B679";
    const tokenB = "0xcFe954Df58237dd363d9c63bCad3247498ac94D3";
    
    console.log(`\n🔍 Checking specific pair: ${tokenA} / ${tokenB}`);
    
    try {
      const pairAddress = await factory.getPair(tokenA, tokenB);
      console.log(`   Pair address: ${pairAddress}`);
      
      if (pairAddress === "0x0000000000000000000000000000000000000000") {
        console.log("   ❌ Pair does not exist (as expected from failed transaction)");
      } else {
        console.log("   ✅ Pair exists!");
      }
    } catch (pairError) {
      console.log(`   ❌ Error checking pair: ${pairError.message}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
