'use client';

import { useState } from 'react';
import { ChevronDown, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Chain {
  chainId: number;
  name: string;
  symbol: string;
  logoURI: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    logoURI: '/ethereum-logo.png',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: 31,
    name: 'Rootstock Testnet',
    symbol: 'RBTC',
    logoURI: '/rbtc-logo.png',
    rpcUrl: 'https://public-node.testnet.rsk.co',
    blockExplorer: 'https://explorer.testnet.rsk.co',
    nativeCurrency: {
      name: 'Rootstock Bitcoin',
      symbol: 'RBTC',
      decimals: 18
    }
  },
  {
    chainId: 56,
    name: 'BSC',
    symbol: 'BNB',
    logoURI: '/bsc-logo.png',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18
    }
  },
  {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    logoURI: '/polygon-logo.png',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    logoURI: '/arbitrum-logo.png',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    logoURI: '/optimism-logo.png',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    logoURI: '/avalanche-logo.png',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    }
  }
];

interface ChainSelectorProps {
  selectedChain: Chain;
  onChainSelect: (chain: Chain) => void;
  className?: string;
}

export function ChainSelector({ selectedChain, onChainSelect, className = '' }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[140px]"
      >
        <img 
          src={selectedChain.logoURI} 
          alt={selectedChain.name}
          className="w-5 h-5 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-chain.png';
          }}
        />
        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
          {selectedChain.symbol}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[200px] max-h-80 overflow-hidden"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                  Select Network
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.chainId}
                      onClick={() => {
                        onChainSelect(chain);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <img 
                        src={chain.logoURI} 
                        alt={chain.name}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-chain.png';
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {chain.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {chain.symbol}
                        </div>
                      </div>
                      {selectedChain.chainId === chain.chainId && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
