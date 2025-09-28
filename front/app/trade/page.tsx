'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Coins,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';
import { oneInchIntegration, TokenInfo } from '@/lib/1inch-integration';
import { formatTokenAmount } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnect } from '@/components/WalletConnect';
import { ChainSelector, SUPPORTED_CHAINS, Chain } from '@/components/ChainSelector';
import { TokenSelector } from '@/components/TokenSelector';

interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  estimatedGas: string;
  slippage: number;
}

export default function TradePage() {
  const { walletInfo } = useWallet();
  const [selectedChain, setSelectedChain] = useState<Chain>(SUPPORTED_CHAINS.find(c => c.chainId === 31) || SUPPORTED_CHAINS[0]);
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isReversed, setIsReversed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  // Default to RBTC (Rootstock Bitcoin) for Rootstock Testnet
  const RBTC_TOKEN: TokenInfo = {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
    decimals: 18,
    chainId: 31,
    logoURI: '/rbtc-logo.png',
    verified: true
  };

  // Fetch popular tokens for selected chain
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['popular-tokens', selectedChain.chainId],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/1inch?action=tokens&chainId=${selectedChain.chainId}`);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get swap quote
  const { data: quoteData, isLoading: quoteLoading, refetch: refetchQuote } = useQuery({
    queryKey: ['swap-quote', fromToken?.address, toToken?.address, fromAmount, slippage],
    queryFn: async () => {
      if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
        return null;
      }

      const response = await fetch(
        `/api/swap/quote?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${fromAmount}&chainId=${selectedChain.chainId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!fromToken && !!toToken && !!fromAmount && parseFloat(fromAmount) > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Swap execution mutation
  const swapMutation = useMutation({
    mutationFn: async (swapData: { fromToken: TokenInfo; toToken: TokenInfo; amount: string; quote: SwapQuote; privateKey: string }) => {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTokenAddress: swapData.fromToken.address,
          toTokenAddress: swapData.toToken.address,
          fromAmount: swapData.amount,
          toAmount: swapData.quote.toAmount,
          slippage,
          privateKey: swapData.privateKey,
          chainId: selectedChain.chainId.toString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Swap execution failed');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      toast.success('Swap Executed', `Transaction: ${data.data.txHash}`);
      setFromAmount('');
      setToAmount('');
    },
    onError: (error: Error) => {
      toast.error('Swap Failed', error.message);
    },
  });

  // Initialize with RBTC
  useEffect(() => {
    if (!fromToken) {
      setFromToken(RBTC_TOKEN);
    }
  }, [fromToken]);

  const tokens = tokensData?.data || [];

  const handleSwapTokens = () => {
    setIsReversed(!isReversed);
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (quoteData && value) {
      setToAmount(quoteData.toAmount);
    }
  };

  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !quoteData) return;
    if (!privateKey) {
      toast.error('Private Key Required', 'Please enter your private key to execute the swap');
      return;
    }
    
    swapMutation.mutate({
      fromToken,
      toToken,
      amount: fromAmount,
      quote: quoteData,
      privateKey
    });
  };

  const formatPrice = (amount: string, decimals: number) => {
    return formatTokenAmount(amount, decimals, 4);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Trade Tokens
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Swap tokens across multiple blockchain networks with real-time search
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Network
              </div>
              <ChainSelector 
                selectedChain={selectedChain}
                onChainSelect={setSelectedChain}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trading Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Swap
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => refetchQuote()}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Transaction Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slippage Tolerance (%)
                    </label>
                    <div className="flex space-x-2">
                      {[0.1, 0.5, 1.0, 2.0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippage(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            slippage === value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                      <input
                        type="number"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                        min="0.1"
                        max="50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Private Key (Required for Trading)
                    </label>
                    <input
                      type="password"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Enter private key for transaction signing"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Private key is used locally and never stored. Required for executing swaps.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* From Token */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <div className="flex space-x-2">
                <TokenSelector
                  selectedToken={fromToken}
                  onTokenSelect={setFromToken}
                  chain={selectedChain}
                  placeholder="Select token"
                  className="min-w-[200px]"
                />
                <div className="flex-1">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              {fromToken && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Balance: {formatPrice('0', fromToken.decimals)} {fromToken.symbol}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
              <button
                onClick={handleSwapTokens}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* To Token */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <div className="flex space-x-2">
                <TokenSelector
                  selectedToken={toToken}
                  onTokenSelect={setToToken}
                  chain={selectedChain}
                  placeholder="Select token"
                  className="min-w-[200px]"
                />
                <div className="flex-1">
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    readOnly={!!quoteData}
                  />
                </div>
              </div>
              {toToken && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Balance: {formatPrice('0', toToken.decimals)} {toToken.symbol}
                </div>
              )}
            </div>

            {/* Quote Details */}
            {quoteData && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Swap Details
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Rate:</span>
                    <span className="text-blue-900 dark:text-blue-100">
                      1 {quoteData.fromToken.symbol} = {(parseFloat(quoteData.toAmount) / parseFloat(quoteData.fromAmount)).toFixed(6)} {quoteData.toToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Price Impact:</span>
                    <span className="text-blue-900 dark:text-blue-100">{quoteData.priceImpact}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Estimated Gas:</span>
                    <span className="text-blue-900 dark:text-blue-100">{quoteData.estimatedGas}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Button */}
            {!walletInfo ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your wallet to start trading
                  </p>
                  <WalletConnect />
                </div>
              </div>
            ) : (
              <button
                onClick={handleSwap}
                disabled={!fromToken || !toToken || !fromAmount || !privateKey || swapMutation.isPending || quoteLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 py-4"
              >
                {swapMutation.isPending ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Swapping...</span>
                  </>
                ) : quoteLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Getting Quote...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="w-5 h-5" />
                    <span>Swap</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Market Info Sidebar */}
        <div className="space-y-6">
            {/* Popular Tokens */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Popular Tokens on {selectedChain.name}
            </h3>
            <div className="space-y-3">
              {tokensData?.data?.slice(0, 5).map((token: TokenInfo) => (
                <TokenCard 
                  key={token.address} 
                  token={token} 
                  onSelect={() => setToToken(token)}
                  isSelected={toToken?.address === token.address}
                />
              ))}
            </div>
          </div>

          {/* Market Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Market Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">RBTC Price</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">$2,850</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">$1.2M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Pairs</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{tokensData?.data?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Token Card Component
function TokenCard({ 
  token, 
  onSelect, 
  isSelected 
}: { 
  token: TokenInfo;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <img 
        src={token.logoURI || '/placeholder-token.png'} 
        alt={token.symbol}
        className="w-8 h-8 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-token.png';
        }}
      />
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {token.symbol}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {token.name}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          $0.00
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          +0.00%
        </div>
      </div>
    </button>
  );
}
