export interface Pool {
  address: string;
  tokenA: {
    address: string;
    symbol: string;
  };
  tokenB: {
    address: string;
    symbol: string;
  };
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  currentRatio: number;
  targetRatio: number;
  needsRebalancing: boolean;
  isActive: boolean;
  lastRebalance: number | null;
  rebalanceCount: number;
  createdAt: number | null;
  tvl: number;
  volume24h: number | null;
  fees24h: number;
  apy: number | null;
}

export interface PoolMetrics {
  address: string;
  historicalData: {
    timestamp: number;
    ratio: number;
    tvl: number;
    volume: number;
    fees: number;
  }[];
  rebalanceHistory: RebalanceEvent[];
  performance: {
    totalRebalances: number;
    avgTimeBetweenRebalances: number;
    totalVolume: number;
    totalFees: number;
    impermanentLoss: number;
  };
}

export interface RebalanceEvent {
  txHash: string;
  timestamp: number;
  poolAddress: string;
  fromRatio: number;
  toRatio: number;
  targetRatio: number;
  gasUsed: string;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
  swapAmount0: string;
  swapAmount1: string;
  slippage: number;
}

export interface RebalanceEstimate {
  poolAddress: string;
  currentRatio: number;
  targetRatio: number;
  swapAmount0: string;
  swapAmount1: string;
  estimatedGas: string;
  gasPrice: string;
  estimatedCost: string;
  slippageImpact: number;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
}

export interface SystemStatus {
  isInitialized: boolean;
  contractsDeployed: boolean;
  eventListenersActive: boolean;
  totalPools: number;
  activeRebalances: number;
  lastUpdate: number;
  networkId: number;
  blockNumber: number;
}

export interface ContractAddresses {
  factory: string;
  router: string;
  rebalancerController: string;
  keeperHelper: string;
  wtrbtc: string;
  tokenA: string;
  tokenB: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  events?: any[];
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PoolCreationParams {
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  targetRatio: number;
}

export interface DashboardStats {
  totalPools: number;
  totalTVL: number;
  totalVolume24h: number;
  averageAPY: number;
  activePools: number;
  imbalancedPools: number;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
}
