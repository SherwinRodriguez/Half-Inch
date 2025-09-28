'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Check, 
  Search, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  Star,
  Shield
} from 'lucide-react';
import { Chain } from './ChainSelector';

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  verified?: boolean;
  tags?: string[];
}

interface TokenSelectorProps {
  selectedToken: TokenInfo | null;
  onTokenSelect: (token: TokenInfo) => void;
  chain: Chain;
  placeholder?: string;
  className?: string;
  showChainSelector?: boolean;
  onChainChange?: (chain: Chain) => void;
}

export function TokenSelector({ 
  selectedToken, 
  onTokenSelect, 
  chain,
  placeholder = "Select Token",
  className = "",
  showChainSelector = false,
  onChainChange
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time token search
  const { data: searchResults, isLoading: isSearching, error } = useQuery({
    queryKey: ['token-search', debouncedQuery, chain.chainId],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { tokens: [], total: 0 };
      }

      const response = await fetch(
        `/api/tokens/search?query=${encodeURIComponent(debouncedQuery)}&chainId=${chain.chainId}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search tokens');
      }
      
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // 30 seconds
  });

  // Popular tokens for the selected chain
  const { data: popularTokens } = useQuery({
    queryKey: ['popular-tokens', chain.chainId],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/1inch?action=tokens&chainId=${chain.chainId}`);
      if (!response.ok) throw new Error('Failed to fetch popular tokens');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTokenSelect = useCallback((token: TokenInfo) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  }, [onTokenSelect]);

  const displayTokens = searchResults?.data?.tokens || popularTokens?.data || [];
  const hasSearchResults = debouncedQuery.length >= 2 && searchResults?.data?.tokens;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[160px]"
      >
        {selectedToken ? (
          <>
            <img 
              src={selectedToken.logoURI || '/placeholder-token.png'} 
              alt={selectedToken.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-token.png';
              }}
            />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {selectedToken.symbol}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedToken.name}
              </div>
            </div>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
        )}
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
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden"
            >
              {/* Header with chain info and search */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                {showChainSelector && onChainChange && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Network
                    </div>
                    <div className="flex items-center space-x-2">
                      <img 
                        src={chain.logoURI} 
                        alt={chain.name}
                        className="w-4 h-4 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-chain.png';
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {chain.name}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* Token List */}
              <div className="max-h-72 overflow-y-auto">
                {isSearching && debouncedQuery.length >= 2 && (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Searching tokens...
                    </p>
                  </div>
                )}

                {error && debouncedQuery.length >= 2 && (
                  <div className="p-4 text-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-500 dark:text-red-400">
                      Failed to search tokens
                    </p>
                  </div>
                )}

                {!isSearching && displayTokens.length === 0 && !hasSearchResults && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tokens found
                    </p>
                  </div>
                )}

                {displayTokens.length > 0 && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayTokens.map((token: TokenInfo, index: number) => (
                      <motion.button
                        key={`${token.address}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleTokenSelect(token)}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <img 
                          src={token.logoURI || '/placeholder-token.png'} 
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-token.png';
                          }}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {token.symbol}
                            </span>
                            {token.verified && (
                              <Shield className="w-3 h-3 text-green-500" />
                            )}
                            {token.tags?.includes('verified') && (
                              <Star className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {token.name}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {token.address.slice(0, 6)}...{token.address.slice(-4)}
                          </div>
                        </div>
                        {selectedToken?.address === token.address && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Search Results Info */}
                {hasSearchResults && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {searchResults.data.total} result{searchResults.data.total !== 1 ? 's' : ''} for "{debouncedQuery}"
                      </span>
                      <span className="flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>1inch API</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
