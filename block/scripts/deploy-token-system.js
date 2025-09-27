const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Token System Deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ChainRegistry
  console.log("\n📋 Deploying ChainRegistry...");
  const ChainRegistry = await ethers.getContractFactory("ChainRegistry");
  const chainRegistry = await ChainRegistry.deploy();
  await chainRegistry.deployed();
  console.log("✅ ChainRegistry deployed to:", chainRegistry.address);

  // Deploy TokenFactory
  console.log("\n🏭 Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.deployed();
  console.log("✅ TokenFactory deployed to:", tokenFactory.address);

  // Deploy TokenManager
  console.log("\n🔧 Deploying TokenManager...");
  const TokenManager = await ethers.getContractFactory("TokenManager");
  const tokenManager = await TokenManager.deploy(
    chainRegistry.address,
    tokenFactory.address
  );
  await tokenManager.deployed();
  console.log("✅ TokenManager deployed to:", tokenManager.address);

  // Create some default tokens
  console.log("\n🪙 Creating default tokens...");

  // Create WRBTC token
  const tx1 = await tokenFactory.createToken(
    "Wrapped RBTC",
    "WRBTC",
    18,
    ethers.utils.parseEther("1000000"), // 1M tokens
    true, // mintable
    true // burnable
  );
  await tx1.wait();
  console.log("✅ WRBTC token created");

  // Create USDC token
  const tx2 = await tokenFactory.createToken(
    "USD Coin",
    "USDC",
    6,
    ethers.utils.parseUnits("1000000", 6), // 1M tokens with 6 decimals
    true, // mintable
    true // burnable
  );
  await tx2.wait();
  console.log("✅ USDC token created");

  // Create USDT token
  const tx3 = await tokenFactory.createToken(
    "Tether USD",
    "USDT",
    6,
    ethers.utils.parseUnits("1000000", 6), // 1M tokens with 6 decimals
    true, // mintable
    true // burnable
  );
  await tx3.wait();
  console.log("✅ USDT token created");

  // Get all created tokens
  console.log("\n📊 Token Summary:");
  const allTokens = await tokenFactory.getAllTokens();
  for (let i = 0; i < allTokens.length; i++) {
    const tokenInfo = await tokenFactory.getTokenInfo(allTokens[i]);
    console.log(`  ${tokenInfo.symbol}: ${tokenInfo.tokenAddress}`);
  }

  // Register tokens in TokenManager
  console.log("\n📝 Registering tokens in TokenManager...");
  for (let i = 0; i < allTokens.length; i++) {
    const tokenInfo = await tokenFactory.getTokenInfo(allTokens[i]);
    await tokenManager.registerToken(
      tokenInfo.tokenAddress,
      tokenInfo.name,
      tokenInfo.symbol,
      tokenInfo.decimals,
      tokenInfo.chainId
    );
    console.log(`✅ Registered ${tokenInfo.symbol} in TokenManager`);
  }

  // Verify some tokens
  console.log("\n✅ Verifying tokens...");
  for (let i = 0; i < allTokens.length; i++) {
    await tokenManager.verifyToken(allTokens[i], true);
    const tokenInfo = await tokenManager.getTokenInfo(allTokens[i]);
    console.log(`✅ Verified ${tokenInfo.symbol}`);
  }

  // Mint some tokens to deployer
  console.log("\n🪙 Minting tokens to deployer...");
  for (let i = 0; i < allTokens.length; i++) {
    const tokenInfo = await tokenManager.getTokenInfo(allTokens[i]);
    const mintAmount =
      tokenInfo.symbol === "WRBTC"
        ? ethers.utils.parseEther("1000")
        : ethers.utils.parseUnits("1000", tokenInfo.decimals);

    await tokenManager.mintToken(allTokens[i], deployer.address, mintAmount);
    console.log(`✅ Minted 1000 ${tokenInfo.symbol} to deployer`);
  }

  // Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("ChainRegistry:", chainRegistry.address);
  console.log("TokenFactory:", tokenFactory.address);
  console.log("TokenManager:", tokenManager.address);
  console.log("\n📋 Supported Chains:");
  const supportedChains = await chainRegistry.getSupportedChains();
  for (let i = 0; i < supportedChains.length; i++) {
    const chainInfo = await chainRegistry.getChainInfo(supportedChains[i]);
    console.log(`  ${chainInfo.chainId}: ${chainInfo.name}`);
  }
  console.log("\n🪙 Created Tokens:");
  for (let i = 0; i < allTokens.length; i++) {
    const tokenInfo = await tokenManager.getTokenInfo(allTokens[i]);
    console.log(
      `  ${tokenInfo.symbol} (${tokenInfo.name}): ${tokenInfo.tokenAddress}`
    );
  }

  // Save deployment addresses
  const deploymentInfo = {
    chainRegistry: chainRegistry.address,
    tokenFactory: tokenFactory.address,
    tokenManager: tokenManager.address,
    tokens: allTokens,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    network: await ethers.provider.getNetwork(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(
    __dirname,
    "../deployments/token-system.json"
  );

  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  console.log("\n🚀 Token System deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
