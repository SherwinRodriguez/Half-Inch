# 1inch Integration Guide

This guide explains how to integrate 1inch services to get token addresses across all chains and implement token minting functionality in your DEX system.

## 🎯 Overview

The 1inch integration provides:

- **Multi-chain token discovery** across all 1inch supported networks
- **Token creation and management** with minting capabilities
- **Cross-chain token mapping** for unified token management
- **Real-time token data** with prices and balances
- **Comprehensive token registry** with verification system

## 🏗️ Architecture

### Smart Contracts

#### 1. ChainRegistry.sol

- Manages supported blockchain networks
- Stores chain configurations (RPC URLs, explorers, features)
- Provides chain validation and information

#### 2. TokenFactory.sol

- Creates new ERC20 tokens with customizable parameters
- Supports mintable and burnable tokens
- Manages token lifecycle and permissions

#### 3. TokenManager.sol

- Central token registry across all chains
- Cross-chain token mapping
- Token verification and activation system
- Integration with TokenFactory for minting/burning

### Frontend Integration

#### 1. 1inch Integration Service (`lib/1inch-integration.ts`)

- Fetches token data from 1inch API
- Supports all 1inch chains (Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche)
- Caches token data for performance
- Provides token search and filtering

#### 2. Token Management API (`api/tokens/`)

- `/api/tokens/1inch` - 1inch token data
- `/api/tokens/manage` - Local token management
- Supports CRUD operations for tokens
- Private key authentication for transactions

#### 3. Token Manager Component (`components/TokenManager.tsx`)

- React component for token management UI
- Create, register, and manage tokens
- Search and filter across chains
- Cross-chain token mapping interface

## 🚀 Quick Start

### 1. Deploy Smart Contracts

```bash
cd block
npm install
npx hardhat compile
npx hardhat run scripts/deploy-token-system.js --network rsk-testnet
```

### 2. Update Frontend Configuration

Add the deployed contract addresses to your environment:

```env
NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_MANAGER_ADDRESS=0x...
```

### 3. Access Token Manager

Navigate to `/tokens` in your application to access the token management interface.

## 📚 API Reference

### 1inch Integration API

#### Get Supported Chains

```javascript
GET /api/tokens/1inch?action=chains
```

#### Get Tokens for Chain

```javascript
GET /api/tokens/1inch?action=tokens&chainId=1
```

#### Search Tokens

```javascript
GET /api/tokens/1inch?action=search&query=USDC&chainId=1
```

#### Get Token by Symbol

```javascript
GET /api/tokens/1inch?action=token-by-symbol&symbol=USDC&chainId=1
```

#### Get Token by Address

```javascript
GET /api/tokens/1inch?action=token-by-address&address=0x...&chainId=1
```

#### Get Popular Tokens

```javascript
GET /api/tokens/1inch?action=popular&chainId=1
```

#### Get Verified Tokens

```javascript
GET /api/tokens/1inch?action=verified&chainId=1
```

#### Get Token Price

```javascript
GET /api/tokens/1inch?action=price&address=0x...&chainId=1
```

#### Get Token Balance

```javascript
GET /api/tokens/1inch?action=balance&address=0x...&walletAddress=0x...&chainId=1
```

### Token Management API

#### Create Token

```javascript
POST /api/tokens/manage
{
  "action": "create-token",
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "initialSupply": "1000000",
  "isMintable": true,
  "isBurnable": true,
  "privateKey": "0x..."
}
```

#### Register Token

```javascript
POST /api/tokens/manage
{
  "action": "register-token",
  "tokenAddress": "0x...",
  "name": "External Token",
  "symbol": "EXT",
  "decimals": 18,
  "chainId": 1,
  "privateKey": "0x..."
}
```

#### Mint Token

```javascript
POST /api/tokens/manage
{
  "action": "mint-token",
  "tokenAddress": "0x...",
  "to": "0x...",
  "amount": "1000",
  "privateKey": "0x..."
}
```

#### Burn Token

```javascript
POST /api/tokens/manage
{
  "action": "burn-token",
  "tokenAddress": "0x...",
  "from": "0x...",
  "amount": "1000",
  "privateKey": "0x..."
}
```

## 🔧 Smart Contract Usage

### ChainRegistry

```solidity
// Add a new chain
chainRegistry.addChain(chainId, "Chain Name", "https://rpc.url", routerAddress);

// Get chain information
ChainInfo memory chainInfo = chainRegistry.getChainInfo(chainId);

// Check if chain is supported
bool isSupported = chainRegistry.isChainSupported(chainId);
```

### TokenFactory

```solidity
// Create a new token
address newToken = tokenFactory.createToken(
    "Token Name",
    "SYMBOL",
    18, // decimals
    ethers.utils.parseEther("1000000"), // initial supply
    true, // mintable
    true  // burnable
);

// Mint tokens
tokenFactory.mintToken(tokenAddress, recipient, amount);

// Burn tokens
tokenFactory.burnToken(tokenAddress, holder, amount);
```

### TokenManager

```solidity
// Register an external token
tokenManager.registerToken(
    tokenAddress,
    "Token Name",
    "SYMBOL",
    18, // decimals
    chainId
);

// Add cross-chain mapping
tokenManager.addCrossChainMapping(
    localToken,
    remoteToken,
    remoteChainId
);

// Verify a token
tokenManager.verifyToken(tokenAddress, true);

// Activate/deactivate token
tokenManager.activateToken(tokenAddress, true);
```

## 🌐 Supported Chains

The integration supports all 1inch networks:

| Chain ID | Name              | Native Currency | Features           |
| -------- | ----------------- | --------------- | ------------------ |
| 1        | Ethereum          | ETH             | Swap, Limit Orders |
| 56       | BSC               | BNB             | Swap               |
| 137      | Polygon           | MATIC           | Swap               |
| 42161    | Arbitrum          | ETH             | Swap               |
| 10       | Optimism          | ETH             | Swap               |
| 43114    | Avalanche         | AVAX            | Swap               |
| 31       | Rootstock Testnet | RBTC            | Swap               |

## 🎨 Frontend Components

### TokenManager Component

```tsx
import { TokenManager } from "@/components/TokenManager";

function MyPage() {
  return (
    <TokenManager
      chainId={1} // Optional: filter by chain
      showCreateToken={true} // Show create token button
      showCrossChain={true} // Show cross-chain mapping
    />
  );
}
```

### 1inch Integration Service

```typescript
import { oneInchIntegration } from "@/lib/1inch-integration";

// Get all tokens
const tokens = await oneInchIntegration.getAllTokens();

// Get tokens for specific chain
const ethTokens = await oneInchIntegration.getTokensForChain(1);

// Search tokens
const usdcTokens = await oneInchIntegration.searchTokens("USDC");

// Get token price
const price = await oneInchIntegration.getTokenPrice(tokenAddress, chainId);
```

## 🔐 Security Considerations

### Private Key Management

- Private keys are only used locally for transaction signing
- Never stored or transmitted to servers
- Use environment variables for deployment keys

### Token Verification

- Implement verification system for external tokens
- Validate token contracts before registration
- Use multi-signature for critical operations

### Access Control

- Owner-only functions for token creation and management
- Role-based access for different operations
- Timelock for governance functions

## 🚀 Deployment Guide

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### 2. Network Configuration

Update `hardhat.config.js`:

```javascript
module.exports = {
  networks: {
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 31,
    },
    // Add other networks as needed
  },
};
```

### 3. Deploy Contracts

```bash
# Deploy to Rootstock Testnet
npx hardhat run scripts/deploy-token-system.js --network rskTestnet

# Deploy to other networks
npx hardhat run scripts/deploy-token-system.js --network ethereum
npx hardhat run scripts/deploy-token-system.js --network bsc
```

### 4. Update Frontend

Update contract addresses in your frontend configuration and restart the development server.

## 📊 Monitoring and Analytics

### Token Metrics

- Track token creation and registration
- Monitor cross-chain mappings
- Analyze token usage patterns

### Performance Monitoring

- API response times
- Cache hit rates
- Error rates and types

### Security Monitoring

- Failed transaction attempts
- Unusual token creation patterns
- Access control violations

## 🔄 Maintenance

### Regular Tasks

- Update 1inch API endpoints if they change
- Monitor token list updates
- Update supported chains as new ones are added
- Review and update security measures

### Backup and Recovery

- Regular backup of token registry data
- Contract upgrade procedures
- Emergency pause mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the smart contract code
- Test with testnet first

---

**Happy Token Managing! 🪙✨**
