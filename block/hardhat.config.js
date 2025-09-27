require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');

const { PRIVATE_KEY, ROOTSTOCK_RPC_URL, ROOTSTOCK_TESTNET_RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    rootstock: {
      url: process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 30,
      gasPrice: 60000000
    },
    testnet: {
      url: process.env.ROOTSTOCK_TESTNET_RPC_URL || "https://public-node.testnet.rsk.co",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 31,
      gasPrice: 60000000
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "rootstock",
        chainId: 30,
        urls: {
          apiURL: "https://blockscout.com/rsk/mainnet/api",
          browserURL: "https://blockscout.com/rsk/mainnet"
        }
      },
      {
        network: "testnet",
        chainId: 31,
        urls: {
          apiURL: "https://blockscout.com/rsk/testnet/api",
          browserURL: "https://blockscout.com/rsk/testnet"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
