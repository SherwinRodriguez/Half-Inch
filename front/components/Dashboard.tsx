'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  AlertTriangle,
  DollarSign,
  Zap,
  Clock
} from 'lucide-react';
import { DashboardStats, Pool } from '@/lib/types';
import { formatCurrency, formatPercentage, formatTimeAgo, formatTokenAmount } from '@/lib/utils';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { PoolCard } from './PoolCard';
import { RebalanceActivity } from './RebalanceActivity';
import { PoolChart } from './PoolChart';

export function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Fetch pool status and dashboard stats
  const { data: poolsData, isLoading: poolsLoading } = useQuery({
    queryKey: ['pools-status', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/pools/status?detailed=true&timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch pools data');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent rebalance activity
  const { data: rebalanceData, isLoading: rebalanceLoading } = useQuery({
    queryKey: ['rebalance-activity'],
    queryFn: async () => {
      const response = await fetch('/api/rebalance/activity?limit=10');
      if (!response.ok) throw new Error('Failed to fetch rebalance activity');
      return response.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const stats: DashboardStats = poolsData?.data?.dashboardStats || {
    totalPools: 0,
    totalTVL: 0,
    totalVolume24h: 0,
    averageAPY: 0,
    activePools: 0,
    imbalancedPools: 0,
  };

  const pools: Pool[] = poolsData?.data?.pools || [];
  const imbalancedPools = pools.filter(pool => pool.needsRebalancing);

  const statCards = [
    {
      title: 'Total Value Locked',
      value: formatCurrency(stats.totalTVL),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Active Pools',
      value: stats.activePools?.toString() || '0',
      change: `${stats.imbalancedPools || 0} imbalanced`,
      trend: (stats.imbalancedPools || 0) > 0 ? 'down' : 'neutral' as const,
      icon: Layers,
      color: 'green',
    },
    {
      title: '24h Volume',
      value: formatCurrency(stats.totalVolume24h),
      change: '+8.2%',
      trend: 'up' as const,
      icon: Activity,
      color: 'purple',
    },
    {
      title: 'Average APY',
      value: formatPercentage(stats.averageAPY || 0),
      change: 'Across all pools',
      trend: 'neutral' as const,
      icon: Zap,
      color: 'orange',
    },
  ];

  if (poolsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading dashboard data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your DEX liquidity pools
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {formatTimeAgo(Date.now())}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const trendIcon = stat.trend === 'up' ? TrendingUp : 
                           stat.trend === 'down' ? TrendingDown : Activity;
          const TrendIcon = trendIcon;
          
          return (
            <div key={index} className="pool-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendIcon className={`w-4 h-4 mr-1 ${
                  stat.trend === 'up' ? 'text-green-500' : 
                  stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`} />
                <span className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                  stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Imbalanced Pools Alert */}
      {imbalancedPools.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Pools Requiring Attention
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                {imbalancedPools.length} pool{imbalancedPools.length > 1 ? 's are' : ' is'} currently imbalanced and may need rebalancing.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {imbalancedPools.slice(0, 3).map((pool) => (
                  <span
                    key={pool.address}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                  >
                    {pool.token0Symbol}/{pool.token1Symbol}
                  </span>
                ))}
                {imbalancedPools.length > 3 && (
                  <span className="text-xs text-yellow-700 dark:text-yellow-300">
                    +{imbalancedPools.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pool Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Liquidity Pools
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>
          </div>

          {pools.length === 0 ? (
            <div className="pool-card p-8 text-center">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Pools Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Discover existing pools or create a new liquidity pool to get started.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button className="btn-primary">
                  Discover Pools
                </button>
                <button className="btn-secondary">
                  Create Pool
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pools.slice(0, 6).map((pool) => (
                <PoolCard key={pool.address} pool={pool} />
              ))}
              
              {pools.length > 6 && (
                <div className="text-center">
                  <button className="btn-secondary">
                    View All Pools ({pools.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="pool-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h3>
            <RebalanceActivity 
              data={rebalanceData?.data || []} 
              isLoading={rebalanceLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="pool-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full btn-primary">
                Create New Pool
              </button>
              <button className="w-full btn-secondary">
                Discover Pools
              </button>
              <button className="w-full btn-secondary">
                View Analytics
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="pool-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Event Listeners
                </span>
                <span className="status-badge status-balanced">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Auto Rebalancing
                </span>
                <span className="status-badge status-balanced">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Network
                </span>
                <span className="status-badge status-balanced">
                  Rootstock
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {pools.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PoolChart
            title="TVL Overview"
            data={pools.map(pool => ({
              name: `${pool.token0Symbol}/${pool.token1Symbol}`,
              value: pool.tvl,
              ratio: pool.ratio,
            }))}
            timeframe={selectedTimeframe}
          />
          
          <PoolChart
            title="Pool Ratios"
            data={pools.map(pool => ({
              name: `${pool.token0Symbol}/${pool.token1Symbol}`,
              value: pool.ratio,
              target: pool.targetRatio,
              imbalanced: pool.isImbalanced,
            }))}
            timeframe={selectedTimeframe}
          />
        </div>
      )}
    </div>
  );
}
