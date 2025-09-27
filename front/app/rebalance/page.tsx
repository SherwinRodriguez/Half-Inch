'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Pool } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage, 
  formatTokenAmount, 
  truncateAddress,
  formatTimeAgo
} from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function RebalancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyImbalanced, setShowOnlyImbalanced] = useState(true);

  // Fetch pools data
  const { data: poolsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pools', 'rebalance'],
    queryFn: async () => {
      const response = await fetch('/api/pools/blockchain-status?detailed=true&timeframe=24h');
      if (!response.ok) {
        throw new Error('Failed to fetch pools data');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const allPools: Pool[] = poolsData?.data?.pools || [];
  
  // Filter pools
  const filteredPools = allPools
    .filter(pool => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          pool.tokenA.symbol.toLowerCase().includes(searchLower) ||
          pool.tokenB.symbol.toLowerCase().includes(searchLower) ||
          pool.address.toLowerCase().includes(searchLower) ||
          `${pool.tokenA.symbol}/${pool.tokenB.symbol}`.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Imbalanced filter
      if (showOnlyImbalanced) {
        return pool.needsRebalancing;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by rebalancing priority (most urgent first)
      if (a.needsRebalancing && !b.needsRebalancing) return -1;
      if (!a.needsRebalancing && b.needsRebalancing) return 1;
      
      // Then by TVL (highest first)
      return b.tvl - a.tvl;
    });

  const imbalancedCount = allPools.filter(pool => pool.needsRebalancing).length;
  const totalTVLAtRisk = allPools
    .filter(pool => pool.needsRebalancing)
    .reduce((sum, pool) => sum + pool.tvl, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pool Rebalancing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage pool rebalancing across the platform
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pools Needing Rebalancing</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {imbalancedCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {allPools.length} total pools
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">TVL at Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalTVLAtRisk)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                requires attention
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Auto Rebalancing</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Active
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                monitoring enabled
              </p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="pool-card p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pools by token or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyImbalanced}
                onChange={(e) => setShowOnlyImbalanced(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show only imbalanced pools
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Pools List */}
      <div className="pool-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Failed to load pools data
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {showOnlyImbalanced 
                ? 'No pools currently need rebalancing' 
                : 'No pools match your search criteria'
              }
            </p>
            {showOnlyImbalanced && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All pools are properly balanced! 🎉
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPools.map((pool) => (
              <div key={pool.address} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Pool Info */}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {pool.tokenA.symbol} / {pool.tokenB.symbol}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {truncateAddress(pool.address)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {pool.needsRebalancing ? (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Needs Rebalancing</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Balanced</span>
                      </div>
                    )}
                  </div>

                  {/* Pool Metrics */}
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">TVL</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(pool.tvl)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Ratio</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {pool.currentRatio?.toFixed(4) || '0.0000'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Target Ratio</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {pool.targetRatio?.toFixed(4) || '1.0000'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Rebalance</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {pool.lastRebalance ? formatTimeAgo(pool.lastRebalance) : 'Never'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/pools/${pool.address}`}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </Link>
                      
                      {pool.needsRebalancing && (
                        <Link
                          href={`/rebalance/${pool.address}`}
                          className="btn-primary text-sm flex items-center space-x-2"
                        >
                          <Activity className="w-4 h-4" />
                          <span>Rebalance</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info for Imbalanced Pools */}
                {pool.needsRebalancing && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Rebalancing Recommended
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Current ratio deviates from target. Rebalancing will optimize pool performance and reduce impermanent loss.
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-orange-600 dark:text-orange-400">
                          <span>Reserves: {formatTokenAmount(pool.reserveA)} {pool.tokenA.symbol} + {formatTokenAmount(pool.reserveB)} {pool.tokenB.symbol}</span>
                          <span>Deviation: {formatPercentage(Math.abs((pool.currentRatio || 0) - (pool.targetRatio || 1)) / (pool.targetRatio || 1))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!isLoading && !error && filteredPools.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredPools.length} pools
          {searchTerm && ` matching "${searchTerm}"`}
          {showOnlyImbalanced && ` (imbalanced only)`}
        </div>
      )}
    </div>
  );
}
