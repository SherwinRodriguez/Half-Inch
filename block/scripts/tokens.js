const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DEX contracts to Rootstock...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy ERC20 tokens for testing
  console.log("\n1. Deploying test tokens...");
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  
  const TokenC = await ethers.getContractFactory("TokenC");
  const tokenC = await TokenC.deploy(initialSupply);
  await tokenC.waitForDeployment();
  console.log("TokenC deployed to:", tokenC.target);

  const TokenD = await ethers.getContractFactory("TokenD");
  const tokenD = await TokenD.deploy(initialSupply);
  await tokenD.waitForDeployment();
  console.log("TokenD deployed to:", tokenD.target);

  console.log("\nDeployment completed successfully!");
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });