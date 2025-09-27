require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');

const { PRIVATE_KEY} = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    testnet: {
      url: process.env.ROOTSTOCK_TESTNET_RPC_URL || "https://public-node.testnet.rsk.co",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 31,
      gasPrice: 60000000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
