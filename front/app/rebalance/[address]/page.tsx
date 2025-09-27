'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  DollarSign,
  Gauge,
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Pool, RebalanceEstimate } from '@/lib/types';
import { formatCurrency, formatPercentage, formatTokenAmount, truncateAddress } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnect } from '@/components/WalletConnect';

export default function RebalancePage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const { walletInfo, signTransaction } = useWallet();
  
  const [targetRatio, setTargetRatio] = useState<number>(1.0);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [maxGasPrice, setMaxGasPrice] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [step, setStep] = useState<'configure' | 'estimate' | 'execute' | 'confirm'>('configure');

  // Fetch pool data
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ['pool', address],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${address}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch pool data');
      return response.json();
    },
    enabled: !!address,
  });

  // Get rebalance estimate
  const { data: estimateData, isLoading: estimateLoading, refetch: refetchEstimate } = useQuery({
    queryKey: ['rebalance-estimate', address, targetRatio, slippageTolerance],
    queryFn: async () => {
      const response = await fetch(`/api/rebalance/${address}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRatio,
          slippageTolerance,
        }),
      });
      if (!response.ok) throw new Error('Failed to get estimate');
      return response.json();
    },
    enabled: step === 'estimate' && !!address,
  });

  // Execute rebalance
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!walletInfo) {
        throw new Error('Please connect your wallet first');
      }

      const response = await fetch(`/api/rebalance/${address}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRatio,
          walletAddress: walletInfo.address,
          useWalletSigning: true,
          slippageTolerance,
          maxGasPrice: maxGasPrice ? parseFloat(maxGasPrice) * 1e9 : undefined, // Convert to wei
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Rebalance execution failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Rebalance Initiated', `Transaction submitted: ${data.data.txHash}`);
      setStep('confirm');
      // Redirect to transaction status page
      setTimeout(() => {
        router.push(`/rebalance/status/${data.data.txHash}`);
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error('Rebalance Failed', error.message);
    },
  });

  const pool: Pool | undefined = poolData?.data?.pool;
  const estimate: RebalanceEstimate | undefined = estimateData?.data;

  useEffect(() => {
    if (pool) {
      setTargetRatio(pool.targetRatio);
    }
  }, [pool]);

  const handleNext = () => {
    if (step === 'configure') {
      setStep('estimate');
      refetchEstimate();
    } else if (step === 'estimate') {
      setStep('execute');
    }
  };

  const handleExecute = () => {
    if (!walletInfo) {
      toast.error('Wallet Not Connected', 'Please connect your wallet to execute the rebalance');
      return;
    }
    executeMutation.mutate();
  };

  if (poolLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pool Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The requested pool could not be found.
          </p>
        </div>
      </div>
    );
  }

  const ratioDeviation = Math.abs(pool.currentRatio - pool.targetRatio) / pool.targetRatio * 100;
  const isSignificantImbalance = ratioDeviation > 5;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {pool.tokenA.symbol.charAt(0)}
                </span>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center -ml-2">
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {pool.tokenB.symbol.charAt(0)}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Rebalance {pool.tokenA.symbol}/{pool.tokenB.symbol}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {truncateAddress(pool.address)}
              </p>
            </div>
          </div>

          {/* Status Alert */}
          {pool.needsRebalancing ? (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Pool Imbalanced
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Current ratio deviates {formatPercentage(ratioDeviation)} from target. 
                    {isSignificantImbalance && ' Rebalancing recommended.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Pool Balanced
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Current ratio is within acceptable range of target.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['configure', 'estimate', 'execute', 'confirm'].map((stepName, index) => {
              const isActive = step === stepName;
              const isCompleted = ['configure', 'estimate', 'execute', 'confirm'].indexOf(step) > index;
              
              return (
                <div key={stepName} className="flex items-center">
                  {index > 0 && <ArrowRight className="w-4 h-4 text-gray-400 mr-4" />}
                  <div className={`flex items-center space-x-2 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' 
                        : isCompleted
                        ? 'bg-green-100 dark:bg-green-900 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="font-medium capitalize">{stepName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="pool-card p-6">
              {step === 'configure' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Configure Rebalance
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Ratio (Token A / Token B)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={targetRatio}
                      onChange={(e) => setTargetRatio(parseFloat(e.target.value))}
                      className="input-field"
                      min="0.0001"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current ratio: {pool.currentRatio.toFixed(4)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slippage Tolerance (%)
                    </label>
                    <div className="flex space-x-2">
                      {[0.1, 0.5, 1.0, 2.0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippageTolerance(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            slippageTolerance === value
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
                        value={slippageTolerance}
                        onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                        min="0.1"
                        max="50"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Gas Price (Gwei)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={maxGasPrice}
                          onChange={(e) => setMaxGasPrice(e.target.value)}
                          placeholder="Auto"
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="w-full btn-primary"
                  >
                    Get Estimate
                  </button>
                </div>
              )}

              {step === 'estimate' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Rebalance Estimate
                  </h2>

                  {estimateLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="large" />
                    </div>
                  ) : estimate ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400">Current Ratio</p>
                          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                            {estimate.currentRatio.toFixed(4)}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-400">Target Ratio</p>
                          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                            {estimate.targetRatio.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          Transaction Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Estimated Gas</p>
                            <p className="font-medium">{formatTokenAmount(estimate.estimatedGas, 0, 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Estimated Cost</p>
                            <p className="font-medium">{formatTokenAmount(estimate.estimatedCost)} ETH</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Price Impact</p>
                            <p className="font-medium">{formatPercentage(estimate.priceImpact)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Slippage</p>
                            <p className="font-medium">{formatPercentage(estimate.slippageImpact)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          onClick={() => setStep('configure')}
                          className="flex-1 btn-secondary"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleNext}
                          className="flex-1 btn-primary"
                        >
                          Proceed to Execute
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Failed to get rebalance estimate
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 'execute' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Execute Rebalance
                  </h2>

                  {!walletInfo ? (
                    <div>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          You need to connect your wallet to execute the rebalance
                        </p>
                      </div>
                      <WalletConnect />
                    </div>
                  ) : (
                    <div>
                      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                              Wallet Connected
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              Transaction will be signed using your connected wallet: {truncateAddress(walletInfo.address)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              Transaction Confirmation Required
                            </p>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                              You will be prompted to confirm the transaction in your wallet. Make sure to review all details before confirming.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setStep('estimate')}
                      className="flex-1 btn-secondary"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={executeMutation.isPending || !walletInfo}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {executeMutation.isPending ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>{!walletInfo ? 'Connect Wallet to Execute' : 'Execute Rebalance'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Rebalance Initiated
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your rebalance transaction has been submitted to the blockchain.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Redirecting to transaction status...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pool Info */}
            <div className="pool-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pool Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TVL</span>
                  <span className="font-medium">{formatCurrency(pool.tvl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                  <span className="font-medium">{formatCurrency(pool.volume24h || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">APY</span>
                  <span className="font-medium">{formatPercentage(pool.apy || 0)}</span>
                </div>
              </div>
            </div>

            {/* Reserves */}
            <div className="pool-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Current Reserves
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{pool.tokenA.symbol}</span>
                  <span className="font-medium">{formatTokenAmount(pool.reserveA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{pool.tokenB.symbol}</span>
                  <span className="font-medium">{formatTokenAmount(pool.reserveB)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pool-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Explorer</span>
                </button>
                <button className="w-full btn-secondary">
                  View Pool Details
                </button>
                <button className="w-full btn-secondary">
                  Add Liquidity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
