# 🌈 Hues DEX - Automated Liquidity Rebalancing System

A sophisticated Decentralized Exchange (DEX) built for the Rootstock network with automated liquidity rebalancing capabilities.

## 🏗️ Project Structure

```
Hues-full/
├── block/                  # Smart contracts & blockchain infrastructure
│   ├── contracts/         # Solidity smart contracts
│   ├── scripts/          # Deployment scripts
│   ├── test/             # Contract tests
│   └── ignition/         # Hardhat Ignition modules
├── front/                 # Next.js frontend application
│   ├── app/              # Next.js App Router pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utility libraries & contract interfaces
│   └── public/           # Static assets
└── README.md
```

## 🚀 Features

### Smart Contracts
- **Factory.sol** - Creates and manages trading pairs using CREATE2
- **Pair.sol** - Individual liquidity pool contracts (Uniswap V2-style)
- **Router.sol** - Main interface for adding liquidity and swaps
- **RebalancerController.sol** - Automated rebalancing with keeper functionality
- **KeeperHelper.sol** - Helper contract for rebalancing operations
- **WTRBTC.sol** - Wrapped tRBTC (Rootstock's native token wrapper)

### Frontend Application
- **Modern Next.js 14** with App Router
- **Real-time pool monitoring** and status updates
- **Automated rebalancing** with gas estimation
- **Transaction tracking** and confirmation
- **Responsive design** with dark/light theme support
- **Comprehensive error handling** and user feedback

### API Infrastructure
- **Pool Management** - Create, discover, and monitor liquidity pools
- **Rebalancing System** - Estimate and execute automated rebalancing
- **Real-time Monitoring** - 30-second polling for pool status updates
- **Contract Verification** - Diagnostic tools for contract deployment status
- **Transaction Tracking** - Monitor and parse blockchain events

## 🛠️ Technology Stack

### Blockchain
- **Solidity ^0.8.28** - Smart contract development
- **Hardhat** - Development framework
- **OpenZeppelin Contracts v5.4.0** - Security and standards
- **Rootstock (RSK)** - Bitcoin-secured blockchain

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **ethers.js** - Blockchain interaction
- **Lucide React** - Icon library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Hues-full.git
   cd Hues-full
   ```

2. **Install blockchain dependencies**
   ```bash
   cd block
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../front
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development

1. **Start the frontend development server**
   ```bash
   cd front
   npm run dev
   ```

2. **Deploy smart contracts (optional)**
   ```bash
   cd block
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network rootstock-testnet
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 📋 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Blockchain
RPC_URL=https://public-node.testnet.rsk.co
FACTORY_ADDRESS=0x...
ROUTER_ADDRESS=0x...

# Keeper
KEEPER_PRIVATE_KEY=0x...
MAX_GAS_PRICE=20000000000
REBALANCE_COOLDOWN=3600

# Development
NODE_ENV=development
DEBUG=true
```

## 🔄 Automated Rebalancing System

The DEX features a sophisticated automated rebalancing system:

### Components
1. **Pool Monitoring** - Continuous monitoring of liquidity pool ratios
2. **Imbalance Detection** - Identifies pools requiring rebalancing
3. **Gas Optimization** - Estimates optimal gas prices for transactions
4. **Keeper Network** - Automated execution of rebalancing operations
5. **Cooldown Management** - Prevents excessive rebalancing

### API Endpoints
- `GET /api/pools/status` - Monitor all pools (30s polling)
- `POST /api/rebalance/[address]/estimate` - Calculate rebalancing requirements
- `POST /api/rebalance/[address]/execute` - Execute rebalancing transaction
- `GET /api/rebalance/status/[txHash]` - Track transaction status

## 🧪 Testing

### Smart Contracts
```bash
cd block
npx hardhat test
npx hardhat coverage
```

### Frontend
```bash
cd front
npm run test
npm run lint
```

## 🚀 Deployment

### Smart Contracts
```bash
cd block
npx hardhat run scripts/deploy.js --network rootstock-testnet
```

### Frontend
```bash
cd front
npm run build
npm start
```

## 📊 API Documentation

### Pool Management
- `POST /api/pools/create` - Create new liquidity pool
- `POST /api/pools/add-liquidity` - Add liquidity to existing pool
- `GET /api/pools/discover` - Discover all pools from Factory
- `GET /api/pools/[address]/metrics` - Get pool metrics and history

### System Diagnostics
- `GET /api/debug/contract-status` - Check all contract deployment status
- `GET /api/debug/router-status` - Router-specific diagnostics
- `GET /api/verify-factory` - Verify Factory contract functionality

### Rebalancing
- `POST /api/rebalance/[address]/estimate` - Estimate rebalancing costs
- `POST /api/rebalance/[address]/execute` - Execute rebalancing
- `GET /api/rebalance/activity` - View rebalancing history

## 🔐 Security

- **Private Key Management** - Never commit private keys to version control
- **Environment Variables** - Use `.env` files for sensitive configuration
- **Access Control** - Keeper-only functions with proper modifiers
- **Gas Limits** - Protection against excessive gas consumption
- **Slippage Protection** - Configurable slippage tolerance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check the `/docs` folder for detailed guides
- **Issues** - Report bugs via GitHub Issues
- **Discussions** - Join community discussions
- **API Status** - Check `/api/debug/contract-status` for system health

## 🔗 Links

- **Rootstock Network** - https://rootstock.io/
- **Hardhat Documentation** - https://hardhat.org/
- **Next.js Documentation** - https://nextjs.org/docs
- **OpenZeppelin Contracts** - https://openzeppelin.com/contracts/

---

Built with ❤️ for the Rootstock ecosystem
