const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Fetching all pools from Factory contract...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Factory contract address from your error log
  const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || "0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c";
  
  console.log("Factory Address:", FACTORY_ADDRESS);
  
  try {
    // Get Factory contract
    const Factory = await ethers.getContractFactory("Factory");
    const factory = Factory.attach(FACTORY_ADDRESS);
    
    // Get total number of pairs
    const totalPairs = await factory.allPairs.length;
    console.log(`\n📊 Total pairs in Factory: ${totalPairs}`);
    
    if (totalPairs === 0) {
      console.log("❌ No pools found in Factory contract");
      console.log("   This means no pools have been successfully created yet");
      return;
    }
    
    console.log("\n📋 All Pools:");
    console.log("=".repeat(60));
    
    // Fetch all pair addresses
    for (let i = 0; i < totalPairs; i++) {
      try {
        const pairAddress = await factory.allPairs(i);
        console.log(`\n${i + 1}. Pool Address: ${pairAddress}`);
        
        // Get pair contract to fetch token details
        const Pair = await ethers.getContractFactory("Pair");
        const pair = Pair.attach(pairAddress);
        
        // Get token addresses
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        
        console.log(`   Token 0: ${token0}`);
        console.log(`   Token 1: ${token1}`);
        
        // Get token symbols if possible
        try {
          const Token0 = await ethers.getContractAt("IERC20", token0);
          const Token1 = await ethers.getContractAt("IERC20", token1);
          
          const symbol0 = await Token0.symbol();
          const symbol1 = await Token1.symbol();
          
          console.log(`   Pair: ${symbol0} / ${symbol1}`);
        } catch (symbolError) {
          console.log(`   Pair: Unknown / Unknown (couldn't fetch symbols)`);
        }
        
        // Get reserves
        try {
          const reserves = await pair.getReserves();
          console.log(`   Reserves: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`);
          console.log(`   Last Update: ${new Date(Number(reserves[2]) * 1000).toLocaleString()}`);
        } catch (reserveError) {
          console.log(`   Reserves: Could not fetch reserves`);
        }
        
      } catch (pairError) {
        console.log(`❌ Error fetching pair ${i}: ${pairError.message}`);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Pool check completed!");
    
  } catch (error) {
    console.error("❌ Error fetching pools:", error.message);
    
    if (error.message.includes("call revert exception")) {
      console.log("\n💡 Possible issues:");
      console.log("   1. Factory contract not deployed at the specified address");
      console.log("   2. Wrong network - make sure you're connected to the right network");
      console.log("   3. RPC endpoint issues");
    }
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
