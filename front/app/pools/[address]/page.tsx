'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { Pool, PoolMetrics } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage, 
  formatTokenAmount, 
  truncateAddress,
  copyToClipboard,
  formatTimeAgo
} from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';
import { PoolChart } from '@/components/PoolChart';
import Link from 'next/link';

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Fetch pool data
  const { data: poolData, isLoading: poolLoading, error: poolError, refetch: refetchPool } = useQuery({
    queryKey: ['pool', address],
    queryFn: async () => {
      const response = await fetch(`/api/pools/status?address=${address}&detailed=true&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pool data');
      }
      return response.json();
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Fetch pool metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['pool-metrics', address, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${address}/metrics?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pool metrics');
      }
      return response.json();
    },
    enabled: !!address,
    refetchInterval: 60000,
  });

  const pool: Pool | null = poolData?.data?.pools?.[0] || null;
  const metrics: PoolMetrics | null = metricsData?.data || null;

  const handleCopyAddress = (addr: string) => {
    copyToClipboard(addr);
    toast.success('Address Copied', 'Address copied to clipboard');
  };

  const handleRefresh = () => {
    refetchPool();
  };

  if (poolLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (poolError || !pool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Pool Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested pool could not be found or loaded.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button onClick={() => router.back()} className="btn-secondary">
              Go Back
            </button>
            <Link href="/pools" className="btn-primary">
              View All Pools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {pool.tokenA.symbol.charAt(0)}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {pool.tokenB.symbol.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pool.tokenA.symbol} / {pool.tokenB.symbol}
              </h1>
              <button
                onClick={() => handleCopyAddress(pool.address)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1"
              >
                <span>{truncateAddress(pool.address)}</span>
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={poolLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${poolLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {pool.needsRebalancing && (
            <Link
              href={`/rebalance/${pool.address}`}
              className="btn-primary flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Rebalance</span>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border mb-8 ${
        pool.isActive
          ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center space-x-2">
          {pool.isActive ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${
              pool.isActive
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              Pool Status: {pool.isActive ? 'Active' : 'Inactive'}
            </p>
            {pool.needsRebalancing && (
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                ⚠️ This pool needs rebalancing to maintain optimal ratios
              </p>
            )}
          </div>
          <a
            href={`https://explorer.testnet.rsk.co/address/${pool.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Explorer</span>
          </a>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value Locked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(pool.tvl)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTokenAmount(pool.reserveA)} {pool.tokenA.symbol} + {formatTokenAmount(pool.reserveB)} {pool.tokenB.symbol}
              </p>
            </div>
            <Droplets className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(pool.volume24h || 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">APY</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPercentage(pool.apy || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Ratio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pool.currentRatio?.toFixed(4) || '0.0000'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: {pool.targetRatio?.toFixed(4) || '1.0000'}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="pool-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Pool Performance
          </h2>
          
          <div className="flex items-center space-x-2">
            {['1h', '24h', '7d', '30d'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {metricsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : metricsError || !metrics ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chart data unavailable</p>
          </div>
        ) : (
          <PoolChart 
            title="Pool Performance"
            data={metrics.historicalData || []} 
            timeframe={timeframe}
          />
        )}
      </div>

      {/* Pool Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token Information */}
        <div className="pool-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Token Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {pool.tokenA.symbol.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {pool.tokenA.symbol}
                  </p>
                  <button
                    onClick={() => handleCopyAddress(pool.tokenA.address)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1"
                  >
                    <span>{truncateAddress(pool.tokenA.address)}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTokenAmount(pool.reserveA)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reserve
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {pool.tokenB.symbol.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {pool.tokenB.symbol}
                  </p>
                  <button
                    onClick={() => handleCopyAddress(pool.tokenB.address)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1"
                  >
                    <span>{truncateAddress(pool.tokenB.address)}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTokenAmount(pool.reserveB)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reserve
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pool Statistics */}
        <div className="pool-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pool Statistics
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pool Created</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {pool.createdAt ? formatTimeAgo(pool.createdAt) : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Rebalance</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {pool.lastRebalance ? formatTimeAgo(pool.lastRebalance) : 'Never'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Rebalance Count</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {pool.rebalanceCount || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fee Tier</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                0.3%
              </span>
            </div>

            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Fees Earned</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(metrics.performance?.totalFees || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Impermanent Loss</span>
                  <span className={`font-medium ${
                    (metrics.performance?.impermanentLoss || 0) < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {formatPercentage(metrics.performance?.impermanentLoss || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex items-center justify-center space-x-4">
        <Link
          href={`/pools/${pool.address}/add-liquidity`}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Liquidity</span>
        </Link>
        
        <Link
          href={`/pools/${pool.address}/remove-liquidity`}
          className="btn-secondary flex items-center space-x-2"
        >
          <Minus className="w-4 h-4" />
          <span>Remove Liquidity</span>
        </Link>
        
        {pool.needsRebalancing && (
          <Link
            href={`/rebalance/${pool.address}`}
            className="btn-primary bg-orange-600 hover:bg-orange-700 flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Rebalance Pool</span>
          </Link>
        )}
      </div>
    </div>
  );
}
