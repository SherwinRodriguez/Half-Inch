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
          <h1 className="text-3xl font-tan-nimbus font-bold text-white">
            Dashboard
          </h1>
          <p className="text-white/80 mt-1 font-space-grotesk">
            Monitor and manage your DEX liquidity pools
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">
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
            <div 
              key={index} 
              className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 relative overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.23)',
                backdropFilter: 'blur(21px)',
                WebkitBackdropFilter: 'blur(21px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              {/* Gradient highlights */}
              <div 
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)'
                }}
              />
              <div 
                className="absolute top-0 left-0 w-px h-full"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8), transparent, rgba(255, 255, 255, 0.3))'
                }}
              />
              
              {/* Title Section */}
              <div className="flex items-center mb-4">
                <div className={`relative p-2 w-10 h-10 rounded-full flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  stat.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                  'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}>
                  <Icon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                </div>
                <p className="ml-3 text-white text-lg font-medium">
                  {stat.title}
                </p>
                <div className="ml-auto font-semibold flex items-center">
                  <TrendIcon className={`w-5 h-5 ${
                    stat.trend === 'up' ? 'text-green-300' : 
                    stat.trend === 'down' ? 'text-red-300' : 'text-white/60'
                  }`} />
                  <span className={`ml-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-300' : 
                    stat.trend === 'down' ? 'text-red-300' : 'text-white/60'
                  }`}>
                    {stat.trend === 'up' ? '+' : stat.trend === 'down' ? '-' : ''}
                    {stat.trend !== 'neutral' ? '20%' : ''}
                  </span>
                </div>
              </div>
              
              {/* Data Section */}
              <div className="flex flex-col">
                <p className="mt-4 mb-4 text-white text-4xl leading-10 font-bold text-left">
                  {stat.value}
                </p>
                
                {/* Progress Bar */}
                <div className="relative bg-white/20 w-full h-2 rounded-full">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                      stat.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      stat.color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      stat.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                      'bg-gradient-to-r from-orange-400 to-orange-500'
                    }`}
                    style={{ 
                      width: stat.trend === 'up' ? '76%' : 
                             stat.trend === 'down' ? '45%' : '60%' 
                    }}
                  />
                </div>
                
                {/* Change Text */}
                <p className={`text-sm mt-2 ${
                  stat.trend === 'up' ? 'text-green-300' : 
                  stat.trend === 'down' ? 'text-red-300' : 
                  'text-white/70'
                }`}>
                  {stat.change}
                </p>
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
                    {pool.tokenA.symbol}/{pool.tokenB.symbol}
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
            <h2 className="text-xl font-bricolage font-semibold text-white">
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
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <RebalanceActivity 
              data={rebalanceData?.data || []} 
              isLoading={rebalanceLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="pool-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
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
            <h3 className="text-lg font-semibold text-white mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Event Listeners
                </span>
                <span className="status-badge status-balanced">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Auto Rebalancing
                </span>
                <span className="status-badge status-balanced">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
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
              name: `${pool.tokenA.symbol}/${pool.tokenB.symbol}`,
              value: pool.tvl,
              ratio: pool.currentRatio,
            }))}
            timeframe={selectedTimeframe}
          />
          
          <PoolChart
            title="Pool Ratios"
            data={pools.map(pool => ({
              name: `${pool.tokenA.symbol}/${pool.tokenB.symbol}`,
              value: pool.currentRatio,
              target: pool.targetRatio,
              imbalanced: pool.needsRebalancing,
            }))}
            timeframe={selectedTimeframe}
          />
        </div>
      )}
    </div>
  );
}
