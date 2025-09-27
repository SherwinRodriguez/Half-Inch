// 1inch Integration Service
// This service integrates with 1inch API to get token addresses across all supported chains

export interface ChainInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  router?: string;
  isActive: boolean;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  tags?: string[];
  verified?: boolean;
}

export interface OneInchToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
}

export interface OneInchTokenList {
  tokens: Record<string, OneInchToken>;
  keywords: string[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  timestamp: string;
  uri: string;
}

export interface OneInchChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  explorers: string[];
  features: string[];
}

export class OneInchIntegration {
  private readonly baseUrl = 'https://api.1inch.io/v5.2';
  private readonly tokenListUrl = 'https://tokens.1inch.io/v1.0';
  
  // 1inch supported chains
  private readonly supportedChains: Record<number, OneInchChainConfig> = {
    1: {
      chainId: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpc: ['https://eth.llamarpc.com'],
      explorers: ['https://etherscan.io'],
      features: ['swap', 'limit-order']
    },
    56: {
      chainId: 56,
      name: 'BSC',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpc: ['https://bsc-dataseed.binance.org'],
      explorers: ['https://bscscan.com'],
      features: ['swap']
    },
    137: {
      chainId: 137,
      name: 'Polygon',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpc: ['https://polygon-rpc.com'],
      explorers: ['https://polygonscan.com'],
      features: ['swap']
    },
    42161: {
      chainId: 42161,
      name: 'Arbitrum',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpc: ['https://arb1.arbitrum.io/rpc'],
      explorers: ['https://arbiscan.io'],
      features: ['swap']
    },
    10: {
      chainId: 10,
      name: 'Optimism',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpc: ['https://mainnet.optimism.io'],
      explorers: ['https://optimistic.etherscan.io'],
      features: ['swap']
    },
    43114: {
      chainId: 43114,
      name: 'Avalanche',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      rpc: ['https://api.avax.network/ext/bc/C/rpc'],
      explorers: ['https://snowtrace.io'],
      features: ['swap']
    },
    31: {
      chainId: 31,
      name: 'Rootstock Testnet',
      nativeCurrency: { name: 'Rootstock Bitcoin', symbol: 'RBTC', decimals: 18 },
      rpc: ['https://public-node.testnet.rsk.co'],
      explorers: ['https://explorer.testnet.rsk.co'],
      features: ['swap']
    }
  };

  /**
   * Get all supported chains from 1inch
   */
  async getSupportedChains(): Promise<ChainInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chains`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chains: ${response.statusText}`);
      }
      
      const chains = await response.json();
      return chains.map((chain: any) => ({
        chainId: chain.chainId,
        name: chain.name,
        rpcUrl: this.supportedChains[chain.chainId]?.rpc[0] || '',
        router: chain.router,
        isActive: true
      }));
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      // Fallback to our predefined chains
      return Object.values(this.supportedChains).map(chain => ({
        chainId: chain.chainId,
        name: chain.name,
        rpcUrl: chain.rpc[0],
        router: undefined,
        isActive: true
      }));
    }
  }

  /**
   * Get token list for a specific chain
   */
  async getTokensForChain(chainId: number): Promise<TokenInfo[]> {
    try {
      const response = await fetch(`${this.tokenListUrl}/${chainId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens for chain ${chainId}: ${response.statusText}`);
      }
      
      const tokenList: OneInchTokenList = await response.json();
      
      return Object.entries(tokenList.tokens).map(([address, token]) => ({
        address: address.toLowerCase(),
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        chainId: chainId,
        logoURI: token.logoURI,
        tags: token.tags,
        verified: token.tags?.includes('verified') || false
      }));
    } catch (error) {
      console.error(`Error fetching tokens for chain ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Get all tokens across all supported chains
   */
  async getAllTokens(): Promise<TokenInfo[]> {
    const allTokens: TokenInfo[] = [];
    const chains = await this.getSupportedChains();
    
    for (const chain of chains) {
      try {
        const tokens = await this.getTokensForChain(chain.chainId);
        allTokens.push(...tokens);
      } catch (error) {
        console.error(`Error fetching tokens for chain ${chain.chainId}:`, error);
      }
    }
    
    return allTokens;
  }

  /**
   * Get token by symbol across all chains
   */
  async getTokenBySymbol(symbol: string, chainId?: number): Promise<TokenInfo[]> {
    const tokens = chainId 
      ? await this.getTokensForChain(chainId)
      : await this.getAllTokens();
    
    return tokens.filter(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  /**
   * Get token by address
   */
  async getTokenByAddress(address: string, chainId?: number): Promise<TokenInfo | null> {
    const tokens = chainId 
      ? await this.getTokensForChain(chainId)
      : await this.getAllTokens();
    
    return tokens.find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    ) || null;
  }

  /**
   * Search tokens by name or symbol
   */
  async searchTokens(query: string, chainId?: number): Promise<TokenInfo[]> {
    const tokens = chainId 
      ? await this.getTokensForChain(chainId)
      : await this.getAllTokens();
    
    const lowerQuery = query.toLowerCase();
    return tokens.filter(token => 
      token.name.toLowerCase().includes(lowerQuery) ||
      token.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get verified tokens only
   */
  async getVerifiedTokens(chainId?: number): Promise<TokenInfo[]> {
    const tokens = chainId 
      ? await this.getTokensForChain(chainId)
      : await this.getAllTokens();
    
    return tokens.filter(token => token.verified);
  }

  /**
   * Get popular tokens (those with common symbols like USDC, USDT, etc.)
   */
  async getPopularTokens(chainId?: number): Promise<TokenInfo[]> {
    const popularSymbols = ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'BNB', 'MATIC', 'AVAX'];
    const tokens = chainId 
      ? await this.getTokensForChain(chainId)
      : await this.getAllTokens();
    
    return tokens.filter(token => 
      popularSymbols.includes(token.symbol.toUpperCase())
    );
  }

  /**
   * Get native currency for a chain
   */
  getNativeCurrency(chainId: number): { name: string; symbol: string; decimals: number } | null {
    return this.supportedChains[chainId]?.nativeCurrency || null;
  }

  /**
   * Check if a chain is supported by 1inch
   */
  isChainSupported(chainId: number): boolean {
    return chainId in this.supportedChains;
  }

  /**
   * Get chain configuration
   */
  getChainConfig(chainId: number): OneInchChainConfig | null {
    return this.supportedChains[chainId] || null;
  }

  /**
   * Get all chain configurations
   */
  getAllChainConfigs(): OneInchChainConfig[] {
    return Object.values(this.supportedChains);
  }

  /**
   * Get token price from 1inch (if available)
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${chainId}/quote?fromTokenAddress=${tokenAddress}&toTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&amount=1000000000000000000`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return parseFloat(data.toTokenAmount) / 1e18; // Convert from wei
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string, chainId: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${chainId}/tokens/${tokenAddress}/balance?walletAddress=${walletAddress}`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }
  }
}

// Export singleton instance
export const oneInchIntegration = new OneInchIntegration();

// Export utility functions
export const getTokenSymbol = (token: TokenInfo): string => token.symbol;
export const getTokenName = (token: TokenInfo): string => token.name;
export const getTokenDecimals = (token: TokenInfo): number => token.decimals;
export const formatTokenAmount = (amount: string, decimals: number): string => {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return wholePart.toString();
  }
  
  return `${wholePart.toString()}.${trimmedFractional}`;
};

// Cache for token data
class TokenCache {
  private cache = new Map<string, { data: TokenInfo[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: TokenInfo[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): TokenInfo[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const tokenCache = new TokenCache();
