'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  DollarSign,
  Users,
  Zap,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage
} from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type TimeFrame = '24h' | '7d' | '30d' | '90d';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24h');

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/pools/blockchain-status?detailed=true&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats: DashboardStats = analyticsData?.data?.stats || {
    totalPools: 0,
    totalTVL: 0,
    totalVolume24h: 0,
    averageAPY: 0,
    activePools: 0,
    imbalancedPools: 0
  };

  // Mock additional analytics data (in a real app, this would come from the API)
  const additionalStats = {
    totalUsers: 1247,
    totalTransactions: 8934,
    totalFeesGenerated: stats.totalTVL * 0.003, // Estimate based on 0.3% fees
    rebalanceEvents: 156,
    avgTransactionSize: stats.totalVolume24h / 100, // Estimate
    topPerformingPool: 'RBTC/USDT',
    protocolRevenue: stats.totalTVL * 0.0005, // Estimate protocol cut
  };

  const timeframeOptions = [
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-white/80">
            Comprehensive insights into DEX performance and metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-2">
            {timeframeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeframe(option.key as TimeFrame)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === option.key
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load analytics data
          </p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Value Locked */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value Locked</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.totalTVL)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12.5% vs last {timeframe}</span>
                  </div>
                </div>
                <Droplets className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            {/* Trading Volume */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trading Volume</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.totalVolume24h)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+8.3% vs last {timeframe}</span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Total Pools */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Pools</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.activePools}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    of {stats.totalPools} total
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            {/* Average APY */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average APY</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPercentage(stats.averageAPY)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-red-600">
                    <TrendingDown className="w-3 h-3" />
                    <span>-2.1% vs last {timeframe}</span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {additionalStats.totalUsers.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+15.2% vs last {timeframe}</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </div>

            {/* Total Transactions */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {additionalStats.totalTransactions.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+22.7% vs last {timeframe}</span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-cyan-500" />
              </div>
            </div>

            {/* Fees Generated */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fees Generated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(additionalStats.totalFeesGenerated)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs mt-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.9% vs last {timeframe}</span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            {/* Rebalance Events */}
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rebalances</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {additionalStats.rebalanceEvents.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    automated events
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Detailed Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Pool Performance */}
            <div className="pool-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pool Performance Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Top Performing Pool
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {additionalStats.topPerformingPool}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatPercentage(45.2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">APY</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Average Transaction Size
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Per transaction
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(additionalStats.avgTransactionSize)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">avg size</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Pools Needing Rebalancing
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Require attention
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                      {stats.imbalancedPools}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">pools</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Revenue */}
            <div className="pool-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Protocol Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Protocol Revenue
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total earned
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(additionalStats.protocolRevenue)}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>+25.4%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Fee Collection Rate
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Standard rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      0.30%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per trade</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Uptime
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last 30 days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      99.97%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">availability</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="pool-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                TVL & Volume Trends
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Last {timeframe}</span>
              </div>
            </div>
            
            <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Interactive charts coming soon
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Historical data visualization will be available here
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
