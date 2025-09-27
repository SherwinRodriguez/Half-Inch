# 🚀 Factory Contract Deployment Guide

## Issue Identified
The Factory contract at address `0xD8714cAD07549c9cF80B2a2170E19720CF3c4B1c` **does not exist** on the Rootstock testnet. This is why pool discovery is failing.

## Solution: Deploy the Factory Contract

### Step 1: Navigate to Blockchain Directory
```bash
cd d:\Hues-full\block
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
```

### Step 3: Check Hardhat Configuration
Make sure your `hardhat.config.js` has the Rootstock testnet configuration:

```javascript
networks: {
  rskTestnet: {
    url: 'https://public-node.testnet.rsk.co',
    chainId: 31,
    accounts: [process.env.PRIVATE_KEY] // Make sure this is set
  }
}
```

### Step 4: Set Environment Variables
Create or update `.env` file in the `/block` directory:

```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://public-node.testnet.rsk.co
```

### Step 5: Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network rskTestnet
```

### Step 6: Update Frontend Environment
After deployment, update `d:\Hues-full\front\.env` with the deployed addresses:

```env
FACTORY_ADDRESS=0x_new_factory_address_here
ROUTER_ADDRESS=0x_new_router_address_here
WTRBTC_ADDRESS=0x_new_wtrbtc_address_here
# ... other contract addresses
```

### Step 7: Test the Deployment
Visit these endpoints to verify:
- `http://localhost:3000/api/quick-test`
- `http://localhost:3000/api/debug/factory-pairs`

## Alternative: Use Existing Deployed Contracts

If contracts are already deployed elsewhere, you just need to update the addresses in your `.env` file.

## Troubleshooting

### If deployment fails:
1. Check your private key has tRBTC for gas
2. Verify network configuration
3. Try a different RPC endpoint

### If RPC issues persist:
Try these alternative RPC endpoints:
- `https://public-node.testnet.rsk.co`
- `https://rootstock-testnet.drpc.org`
- `https://mycrypto.testnet.rsk.co`

## Next Steps After Deployment

1. ✅ Factory contract deployed
2. ✅ Pool creation will work
3. ✅ Pool discovery will work
4. ✅ Database storage will work
5. ✅ Pools page will show data

The entire DEX system will be functional once the contracts are properly deployed!
