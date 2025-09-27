import { ethers } from 'ethers';
import { ContractAddresses } from './types';

// Contract ABIs - Based on actual Factory.sol contract
export const FACTORY_ABI = [
  // Functions
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "function setFeeTo(address _feeTo) external",
  "function setFeeToSetter(address _feeToSetter) external",
  
  // Public variables (automatically create getter functions)
  "function feeTo() external view returns (address)",
  "function feeToSetter() external view returns (address)",
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function allPairs(uint256) external view returns (address pair)",
  
  // Events
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint256)"
];

export const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function reserve0() external view returns (uint112)",
  "function reserve1() external view returns (uint112)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function mint(address to, uint256 amount0, uint256 amount1) external returns (uint256 liquidity)",
  "function burn(address to) external returns (uint256 amount0, uint256 amount1)",
  "function swap(uint256 amount0Out, uint256 amount1Out, address to) external",
  "function initialize(address _token0, address _token1) external",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)"
];

export const REBALANCER_CONTROLLER_ABI = [
  "function rebalance(address pair, uint256 targetRatioBps) external",
  "function keeper() external view returns (address)",
  "function maxSlippage() external view returns (uint256)",
  "function maxGasPrice() external view returns (uint256)",
  "function cooldown() external view returns (uint256)",
  "function lastRebalance(address pair) external view returns (uint256)",
  "event Rebalance(address indexed pair, uint256 oldRatio, uint256 newRatio, uint256 targetRatio)"
];

export const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Router ABI - Based on actual Router.sol contract
export const ROUTER_ABI = [
  // Public variables (automatically create getter functions)
  "function factory() external view returns (address)",
  "function wtrbtc() external view returns (address)",
  
  // Functions
  "function addLiquidity(address tokenA, address tokenB, uint amountA, uint amountB) external"
];

// Multiple RPC endpoints for better reliability
export const RPC_ENDPOINTS = [
  'https://public-node.testnet.rsk.co',
  'https://rpc.testnet.rootstock.io/public',
  'https://mycrypto.testnet.rsk.co',
];

export const DEFAULT_RPC_URL = RPC_ENDPOINTS[0];

// Default contract addresses (should be updated after deployment)
export const DEFAULT_ADDRESSES: ContractAddresses = {
  factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  rebalancerController: process.env.NEXT_PUBLIC_REBALANCER_ADDRESS || '0x0000000000000000000000000000000000000000',
  keeperHelper: process.env.NEXT_PUBLIC_KEEPER_HELPER_ADDRESS || '0x0000000000000000000000000000000000000000',
  wtrbtc: process.env.NEXT_PUBLIC_WTRBTC_ADDRESS || '0x0000000000000000000000000000000000000000',
  tokenA: process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS || '0x0000000000000000000000000000000000000000',
  tokenB: process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31, // Rootstock Testnet
  name: 'Rootstock Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || DEFAULT_RPC_URL,
  blockExplorer: 'https://explorer.testnet.rsk.co',
  nativeCurrency: {
    name: 'Test RBTC',
    symbol: 'tRBTC',
    decimals: 18,
  },
};

// Contract instances
export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private contracts: { [key: string]: ethers.Contract } = {};

  constructor(rpcUrl?: string, privateKey?: string) {
    // Use provided RPC URL or try multiple endpoints
    const targetRpcUrl = rpcUrl || NETWORK_CONFIG.rpcUrl;
    this.provider = new ethers.JsonRpcProvider(targetRpcUrl, undefined, {
      staticNetwork: true,
      batchMaxCount: 1, // Disable batching for better reliability
    });
    
    // Set reasonable timeouts
    this.provider._getConnection().timeout = 30000; // 30 seconds
    
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }
  }

  // Expose the provider for direct access
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  // Helper method to retry RPC calls with different endpoints
  async retryWithDifferentRpc<T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < RPC_ENDPOINTS.length && i < maxRetries + 1; i++) {
      try {
        if (i > 0) {
          // Switch to a different RPC endpoint
          console.log(`Retrying with RPC endpoint: ${RPC_ENDPOINTS[i]}`);
          this.provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[i], undefined, {
            staticNetwork: true,
            batchMaxCount: 1,
          });
          this.provider._getConnection().timeout = 30000;
          
          if (this.signer && 'privateKey' in this.signer) {
            this.signer = new ethers.Wallet((this.signer as any).privateKey, this.provider);
          }
        }
        
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`RPC call failed with endpoint ${RPC_ENDPOINTS[i] || 'default'}:`, error.message);
        
        // If it's a timeout or network error, try next endpoint
        if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR' || 
            error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
          continue;
        }
        
        // If it's a contract error, don't retry
        if (error.code === 'CALL_EXCEPTION') {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }

  async getContract(name: string, address: string, abi: string[]): Promise<ethers.Contract> {
    const key = `${name}_${address}`;
    
    if (!this.contracts[key]) {
      this.contracts[key] = new ethers.Contract(
        address,
        abi,
        this.signer || this.provider
      );
    }
    
    return this.contracts[key];
  }

  async getFactoryContract(address?: string): Promise<ethers.Contract> {
    return this.getContract('factory', address || DEFAULT_ADDRESSES.factory, FACTORY_ABI);
  }

  async getPairContract(address: string): Promise<ethers.Contract> {
    return this.getContract('pair', address, PAIR_ABI);
  }

  async getRebalancerContract(address?: string): Promise<ethers.Contract> {
    return this.getContract('rebalancer', address || DEFAULT_ADDRESSES.rebalancerController, REBALANCER_CONTROLLER_ABI);
  }

  async getERC20Contract(address: string): Promise<ethers.Contract> {
    return this.getContract('erc20', address, ERC20_ABI);
  }

  async getRouterContract(address?: string): Promise<ethers.Contract> {
    return this.getContract('router', address || DEFAULT_ADDRESSES.router, ROUTER_ABI);
  }

  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('No signer available. Private key required for transactions.');
    }
    return this.signer;
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getTransaction(hash: string): Promise<ethers.TransactionResponse | null> {
    return await this.provider.getTransaction(hash);
  }

  async getTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(hash);
  }

  async estimateGas(contract: ethers.Contract, method: string, params: any[]): Promise<bigint> {
    return await contract[method].estimateGas(...params);
  }

  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  formatUnits(value: bigint | string, decimals: number = 18): string {
    return ethers.formatUnits(value, decimals);
  }

  parseUnits(value: string, decimals: number = 18): bigint {
    return ethers.parseUnits(value, decimals);
  }

  isAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  getAddress(address: string): string {
    return ethers.getAddress(address);
  }
}

// Utility functions
export function calculateRatio(reserve0: string, reserve1: string): number {
  const r0 = parseFloat(ethers.formatEther(reserve0));
  const r1 = parseFloat(ethers.formatEther(reserve1));
  return r1 > 0 ? (r0 / r1) : 0;
}

export function calculateTVL(reserve0: string, reserve1: string, token0Price: number = 1, token1Price: number = 1): number {
  const r0 = parseFloat(ethers.formatEther(reserve0));
  const r1 = parseFloat(ethers.formatEther(reserve1));
  return (r0 * token0Price) + (r1 * token1Price);
}

export function calculatePriceImpact(amountIn: string, reserveIn: string, reserveOut: string): number {
  const amountInBig = ethers.parseEther(amountIn);
  const reserveInBig = ethers.parseEther(reserveIn);
  const reserveOutBig = ethers.parseEther(reserveOut);
  
  const amountOut = (amountInBig * reserveOutBig) / (reserveInBig + amountInBig);
  const priceImpact = (amountInBig * BigInt(100)) / reserveInBig;
  
  return parseFloat(ethers.formatEther(priceImpact));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  // Handle null, undefined, or invalid inputs
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '0.00';
  }
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}
