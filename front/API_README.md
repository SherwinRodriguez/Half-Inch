# Hues DEX - API Documentation

A comprehensive Next.js application for DEX liquidity pool management and automated rebalancing on the Rootstock network.

## 🚀 Features

- **Real-time Pool Monitoring**: Track liquidity pools with 30-second updates
- **Automated Rebalancing**: Smart contract integration for pool rebalancing
- **Modern UI/UX**: Responsive design with dark/light theme support
- **Transaction Tracking**: Complete transaction lifecycle monitoring
- **Gas Optimization**: Intelligent gas estimation and price limits
- **Historical Analytics**: Pool performance and rebalancing history

## 📋 API Routes

### System Management

#### `POST /api/system/initialize`
Initialize the DEX system with contract deployment and event listeners.

**Request Body:**
```json
{
  "privateKey": "0x...",
  "rpcUrl": "https://public-node.testnet.rsk.co",
  "contractAddresses": {
    "factory": "0x...",
    "rebalancerController": "0x...",
    "router": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "contractsDeployed": true,
    "eventListenersActive": true,
    "totalPools": 5,
    "networkId": 31,
    "blockNumber": 1234567
  },
  "timestamp": 1640995200000
}
```

#### `GET /api/system/initialize`
Get current system status.

---

### Pool Discovery & Monitoring

#### `GET /api/pools/discover`
Discover all existing pools from the Factory contract.

**Query Parameters:**
- `rpcUrl` (optional): Custom RPC URL
- `factoryAddress` (optional): Factory contract address

**Response:**
```json
{
  "success": true,
  "data": {
    "pools": [...],
    "totalDiscovered": 10,
    "imbalancedCount": 3
  }
}
```

#### `POST /api/pools/discover`
Set target ratios for discovered pools.

**Request Body:**
```json
{
  "pools": ["0x...", "0x..."],
  "targetRatios": {
    "0x...": 1.0,
    "0x...": 1.5
  }
}
```

#### `GET /api/pools/status`
Get real-time status of all pools (called every 30 seconds).

**Query Parameters:**
- `detailed` (boolean): Include full pool data
- `timeframe` (string): Data timeframe (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "pools": [...],
    "totalPools": 10,
    "imbalancedPools": 3,
    "imbalancedAddresses": ["0x...", "0x..."],
    "dashboardStats": {
      "totalValueLocked": 1500000,
      "totalVolume24h": 250000,
      "activePools": 10,
      "rebalancesToday": 5
    }
  }
}
```

#### `GET /api/pools/[address]/metrics`
Get detailed metrics for a specific pool.

**Query Parameters:**
- `timeframe`: 1h, 24h, 7d, 30d
- `analytics` (boolean): Include analytics data

**Response:**
```json
{
  "success": true,
  "data": {
    "pool": {
      "address": "0x...",
      "token0Symbol": "WBTC",
      "token1Symbol": "USDT",
      "ratio": 1.0234,
      "targetRatio": 1.0,
      "isImbalanced": true,
      "tvl": 150000
    },
    "metrics": {
      "historicalData": [...],
      "rebalanceHistory": [...],
      "performance": {
        "totalRebalances": 12,
        "totalVolume": 500000
      }
    }
  }
}
```

---

### Rebalancing Operations

#### `POST /api/rebalance/[address]/estimate`
Calculate rebalancing requirements and costs.

**Request Body:**
```json
{
  "targetRatio": 1.0,
  "slippageTolerance": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poolAddress": "0x...",
    "currentRatio": 1.0234,
    "targetRatio": 1.0,
    "swapAmount0": "1000000000000000000",
    "estimatedGas": "200000",
    "estimatedCost": "0.002",
    "priceImpact": 0.15,
    "slippageImpact": 0.5
  }
}
```

#### `POST /api/rebalance/[address]/execute`
Execute the rebalancing transaction.

**Request Body:**
```json
{
  "targetRatio": 1.0,
  "privateKey": "0x...",
  "slippageTolerance": 0.5,
  "maxGasPrice": 20000000000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "pending",
    "estimatedConfirmation": 1640995230000
  }
}
```

#### `GET /api/rebalance/status/[txHash]`
Check transaction confirmation status.

**Query Parameters:**
- `wait` (boolean): Wait for confirmation
- `rpcUrl` (optional): Custom RPC URL

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0x...",
      "status": "confirmed",
      "blockNumber": 1234568,
      "gasUsed": "180000"
    },
    "rebalanceEvent": {
      "txHash": "0x...",
      "poolAddress": "0x...",
      "fromRatio": 1.0234,
      "toRatio": 1.0001,
      "status": "confirmed"
    },
    "poolUpdated": true
  }
}
```

---

## 🏗️ Architecture

### Core Components

1. **Contract Service** (`/lib/contracts.ts`)
   - Ethers.js integration
   - Contract ABIs and addresses
   - Utility functions for blockchain interaction

2. **Database Layer** (`/lib/database.ts`)
   - In-memory data storage
   - Pool metrics and historical data
   - Rebalance event tracking

3. **Type Definitions** (`/lib/types.ts`)
   - TypeScript interfaces
   - API response types
   - Pool and rebalance data structures

4. **Utility Functions** (`/lib/utils.ts`)
   - Formatting helpers
   - Validation functions
   - Mathematical calculations

### UI Components

- **Dashboard**: Real-time overview with metrics and charts
- **Pool Management**: Create, view, and manage liquidity pools
- **Rebalancing Interface**: Step-by-step rebalancing wizard
- **System Initialization**: Setup wizard for first-time users

### Key Features

- **Real-time Updates**: 30-second polling for pool status
- **Transaction Monitoring**: Background transaction tracking
- **Error Handling**: Comprehensive error boundaries and notifications
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme Support**: Dark/light mode with system preference detection

---

## 🔧 Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_RPC_URL=https://public-node.testnet.rsk.co
   NEXT_PUBLIC_FACTORY_ADDRESS=0x...
   NEXT_PUBLIC_REBALANCER_ADDRESS=0x...
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

---

## 🔐 Security Considerations

- **Private Key Handling**: Never store private keys in localStorage
- **RPC Endpoints**: Use secure, rate-limited RPC providers
- **Gas Limits**: Implement reasonable gas price limits
- **Transaction Validation**: Verify all transaction parameters
- **Error Handling**: Graceful handling of blockchain errors

---

## 📊 Monitoring & Analytics

The system provides comprehensive monitoring capabilities:

- **Pool Performance**: TVL, volume, fees, APY tracking
- **Rebalance History**: Complete transaction history
- **Gas Analytics**: Cost optimization insights
- **Ratio Tracking**: Historical ratio deviation analysis
- **Alert System**: Notifications for imbalanced pools

---

## 🚀 Deployment

The application is designed for deployment on:

- **Vercel**: Optimized for Next.js App Router
- **Netlify**: Static site generation support
- **Docker**: Containerized deployment option
- **Traditional Hosting**: Build output compatible

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🆘 Support

For support and questions:
- GitHub Issues
- Documentation Wiki
- Community Discord

---

*Built with ❤️ for the Rootstock ecosystem*
