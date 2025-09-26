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
  
  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(initialSupply);
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", tokenA.target);

  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy(initialSupply);
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", tokenB.target);

  // Deploy WTRBTC (Wrapped tRBTC)
  console.log("\n2. Deploying WTRBTC...");
  const WTRBTC = await ethers.getContractFactory("WTRBTC");
  const wtrbtc = await WTRBTC.deploy();
  await wtrbtc.waitForDeployment();
  console.log("WTRBTC deployed to:", wtrbtc.target);

  // Deploy Factory
  console.log("\n3. Deploying Factory...");
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy(deployer.address); // deployer as feeToSetter
  await factory.waitForDeployment();
  console.log("Factory deployed to:", factory.target);

  // Deploy Router
  console.log("\n4. Deploying Router...");
  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(factory.target, wtrbtc.target);
  await router.waitForDeployment();
  console.log("Router deployed to:", router.target);

  // Deploy RebalancerController
  console.log("\n5. Deploying RebalancerController...");
  const maxSlippage = 500; // 5%
  const maxGasPrice = ethers.parseUnits("20", "gwei");
  const cooldown = 300; // 5 minutes
  
  const RebalancerController = await ethers.getContractFactory("RebalancerController");
  const rebalancerController = await RebalancerController.deploy(
    deployer.address, // keeper address
    maxSlippage,
    maxGasPrice,
    cooldown
  );
  await rebalancerController.waitForDeployment();
  console.log("RebalancerController deployed to:", rebalancerController.target);

  // Deploy KeeperHelper
  console.log("\n6. Deploying KeeperHelper...");
  const KeeperHelper = await ethers.getContractFactory("KeeperHelper");
  const keeperHelper = await KeeperHelper.deploy(router.target);
  await keeperHelper.waitForDeployment();
  console.log("KeeperHelper deployed to:", keeperHelper.target);

  // Create initial liquidity pools
  console.log("\n7. Creating initial liquidity pools...");
  
  // Create WTRBTC/TokenA pair
  const createPairTx1 = await factory.createPair(wtrbtc.target, tokenA.target);
  await createPairTx1.wait();
  const pairAddress1 = await factory.getPair(wtrbtc.target, tokenA.target);
  console.log("WTRBTC/TokenA pair created at:", pairAddress1);

  // Create TokenA/TokenB pair
  const createPairTx2 = await factory.createPair(tokenA.target, tokenB.target);
  await createPairTx2.wait();
  const pairAddress2 = await factory.getPair(tokenA.target, tokenB.target);
  console.log("TokenA/TokenB pair created at:", pairAddress2);

  // Wrap some tRBTC for initial liquidity (optional - only if sufficient balance)
  console.log("\n8. Checking balance for tRBTC wrapping...");
  const currentBalance = await ethers.provider.getBalance(deployer.address);
  const wrapAmount = ethers.parseEther("0.01"); // 0.01 tRBTC (much smaller amount)
  const minRequiredBalance = ethers.parseEther("0.02"); // Keep some for gas
  
  if (currentBalance > minRequiredBalance) {
    console.log("Wrapping", ethers.formatEther(wrapAmount), "tRBTC for testing...");
    const depositTx = await wtrbtc.deposit({ value: wrapAmount });
    await depositTx.wait();
    console.log("Successfully wrapped", ethers.formatEther(wrapAmount), "tRBTC");
  } else {
    console.log("Insufficient balance for wrapping. Skipping this step.");
    console.log("You can wrap tRBTC later by calling WTRBTC.deposit() with value");
  }

  console.log("\n=== Deployment Summary ===");
  console.log("TokenA:", tokenA.target);
  console.log("TokenB:", tokenB.target);
  console.log("WTRBTC:", wtrbtc.target);
  console.log("Factory:", factory.target);
  console.log("Router:", router.target);
  console.log("RebalancerController:", rebalancerController.target);
  console.log("KeeperHelper:", keeperHelper.target);
  console.log("WTRBTC/TokenA Pair:", pairAddress1);
  console.log("TokenA/TokenB Pair:", pairAddress2);
  
  console.log("\n=== Next Steps ===");
  console.log("1. Get more tRBTC from faucet if needed: https://faucet.rootstock.io/");
  console.log("2. Wrap tRBTC: await wtrbtc.deposit({ value: ethers.parseEther('amount') })");
  console.log("3. Add liquidity to the pools using the Router contract");
  console.log("4. Perform swaps to create imbalance");
  console.log("5. Use RebalancerController to rebalance pools");
  console.log("6. Monitor and test the keeper system");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
