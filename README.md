# HalfInch 

**A Comprehensive Decentralized Exchange Platform for Cross-Chain Liquidity Management**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?logo=next.js)](https://nextjs.org/)
[![Powered by Rootstock](https://img.shields.io/badge/Powered%20by-Rootstock-orange)](https://rootstock.io/)
[![1inch Integration](https://img.shields.io/badge/Powered%20by-1inch-blue)](https://1inch.io/)

## 🚀 Key Innovation

**HalfInch solves critical DeFi challenges through:**

- **🔄 Automated Liquidity Rebalancing**: Advanced algorithms maintain optimal pool ratios on Rootstock (RBTC)
- **⚖️ BTC/RBTC Parity Maintenance**: Ensures perfect 1:1 ratio between Bitcoin and Rootstock Bitcoin
- **🌐 Cross-Chain Transaction Support**: Seamless multi-chain operations via 1inch API integration

---

## 📋 Overview

HalfInch is a full-stack decentralized exchange (DEX) platform built on Rootstock Testnet with comprehensive multi-chain support. It provides a complete DeFi ecosystem for liquidity management, automated token trading, and intelligent rebalancing across multiple blockchain networks.

### 🎯 Core Mission

To solve liquidity fragmentation and ratio imbalances in DeFi by providing automated rebalancing solutions that maintain optimal token ratios, particularly focusing on the critical BTC/RBTC parity in the Bitcoin ecosystem.

## ✨ Features

### 🔧 Liquidity Management
- **Automated Pool Rebalancing**: Smart algorithms detect and correct ratio imbalances
- **Custom Pool Creation**: Deploy liquidity pools with any ERC20 token pair
- **Real-time Pool Discovery**: Automatic detection of existing pools across networks
- **Advanced Analytics**: Comprehensive pool performance metrics and insights

### 🌐 Multi-Chain Trading
- **7 Supported Networks**: Ethereum, Rootstock, BSC, Polygon, Arbitrum, Optimism, Avalanche
- **1inch API Integration**: Professional DEX aggregator for optimal trade execution
- **Real-time Token Search**: Live token discovery with instant price quotes
- **Advanced Slippage Control**: Configurable protection against price impact

### ⚖️ BTC/RBTC Ratio Management
- **Automatic Parity Maintenance**: Ensures 1:1 ratio between BTC and RBTC
- **Price Impact Minimization**: Intelligent rebalancing to reduce market disruption
- **Threshold-based Monitoring**: Continuous monitoring with automatic intervention
- **Gas-optimized Execution**: Efficient transaction processing

### 🔍 Token Discovery & Management
- **Multi-chain Token Search**: Access thousands of verified tokens
- **Custom Token Creation**: Deploy new ERC20 tokens with ease
- **Cross-chain Token Mapping**: Unified token management across networks
- **Real-time Price Feeds**: Live market data and analytics

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with dark/light theme support
- **State Management**: React Query for efficient server state
- **Animations**: Framer Motion for smooth user interactions
- **Type Safety**: Full TypeScript implementation

### Backend Infrastructure
- **Blockchain**: Rootstock Testnet (RSK)
- **Smart Contracts**: Solidity with Hardhat framework
- **Core Contracts**: Factory, Pair, Router, RebalancerController
- **API Integration**: 1inch API for multi-chain data and trading

### Smart Contract Architecture

```solidity
// Factory Contract - Pool Creation
contract Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function allPairs(uint) external view returns (address pair);
}

// Pair Contract - Liquidity Management
contract Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1);
    function swap(uint amount0Out, uint amount1Out, address to) external;
}

// RebalancerController - Automated Rebalancing
contract RebalancerController {
    function rebalance(address pair, uint targetRatio) external;
    function calculateSwapAmount(address pair, uint targetRatio) external view returns (uint);
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MetaMask or compatible Web3 wallet
- Rootstock Testnet setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/halfinch.git
   cd halfinch
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_ROOTSTOCK_RPC_URL=https://public-node.testnet.rsk.co
   NEXT_PUBLIC_1INCH_API_KEY=your_1inch_api_key
   PRIVATE_KEY=your_private_key
   CONTRACT_ADDRESS=deployed_contract_address
   ```

4. **Smart Contract Deployment**
   ```bash
   npm run compile
   npm run deploy:testnet
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Usage

### Dashboard
- Monitor total pools, TVL, volume, and system health
- View recent rebalancing activity and performance metrics
- Quick access to trading and pool management

### Trading
1. Select source and target tokens from supported networks
2. Enter trade amount and review price impact
3. Configure slippage tolerance and gas settings
4. Execute cross-chain swaps via 1inch integration

### Pool Management
1. Create custom liquidity pools with any token pair
2. Add/remove liquidity with optimal ratios
3. Monitor pool performance and rebalancing activity
4. Discover existing pools automatically

### Automated Rebalancing
1. Set target ratios for BTC/RBTC and other pairs
2. Configure rebalancing thresholds and parameters
3. Monitor automatic rebalancing execution
4. Track rebalancing performance and history

## 🔧 API Reference

### Pool Management
```http
GET /api/pools/status          # Get all pools status
POST /api/pools/create         # Create new pool
GET /api/pools/discover        # Discover pools from blockchain
GET /api/pools/[address]/metrics # Get pool metrics
```

### Trading
```http
GET /api/swap/quote            # Get swap quote
POST /api/swap/execute         # Execute swap
GET /api/tokens/search         # Search tokens
GET /api/tokens/1inch          # Get 1inch token data
```

### Rebalancing
```http
GET /api/rebalance/[address]/estimate  # Get rebalance estimate
POST /api/rebalance/[address]/execute  # Execute rebalance
GET /api/rebalance/activity            # Get rebalancing activity
```

## 🔐 Security

- **Private Key Management**: Secure local key handling
- **Smart Contract Audits**: Thoroughly tested and audited contracts
- **Slippage Protection**: Advanced protection against price manipulation
- **Access Controls**: Proper permissions and emergency functions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Rootstock](https://rootstock.io/) for the Bitcoin-secured smart contract platform
- [1inch](https://1inch.io/) for DEX aggregation and cross-chain support
- [Next.js](https://nextjs.org/) for the robust frontend framework
- The DeFi community for continuous innovation and feedback



---

**Built with ❤️ for the DeFi ecosystem**
