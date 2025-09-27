'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Droplets,
  ArrowUpDown,
  ExternalLink,
  RefreshCw,
  Plus,
  Eye,
  Activity
} from 'lucide-react';
import { Pool, DashboardStats } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage, 
  formatTokenAmount, 
  truncateAddress,
  copyToClipboard 
} from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';
import Link from 'next/link';

type SortField = 'tvl' | 'volume24h' | 'apy' | 'created' | 'name';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'active' | 'inactive' | 'imbalanced';

export default function PoolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch pools data
  const { data: poolsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pools', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/pools/status?detailed=true&timeframe=24h');
      if (!response.ok) {
        throw new Error('Failed to fetch pools data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pools: Pool[] = poolsData?.data?.pools || [];
  const stats: DashboardStats = poolsData?.data?.stats || {
    totalPools: 0,
    totalTVL: 0,
    totalVolume24h: 0,
    averageAPY: 0,
    activePools: 0,
    imbalancedPools: 0
  };

  // Filter and sort pools
  const filteredAndSortedPools = pools
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

      // Type filter
      switch (filterType) {
        case 'active':
          return pool.isActive;
        case 'inactive':
          return !pool.isActive;
        case 'imbalanced':
          return pool.needsRebalancing;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'tvl':
          aValue = a.tvl;
          bValue = b.tvl;
          break;
        case 'volume24h':
          aValue = a.volume24h || 0;
          bValue = b.volume24h || 0;
          break;
        case 'apy':
          aValue = a.apy || 0;
          bValue = b.apy || 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'name':
          aValue = `${a.tokenA.symbol}/${a.tokenB.symbol}`;
          bValue = `${b.tokenA.symbol}/${b.tokenB.symbol}`;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCopyAddress = (address: string) => {
    copyToClipboard(address);
    toast.success('Address Copied', 'Pool address copied to clipboard');
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Liquidity Pools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and manage liquidity pools on the Hues DEX platform
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
          
          <Link href="/create-pool" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Pool</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pools</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalPools}
              </p>
            </div>
            <Droplets className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total TVL</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalTVL)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalVolume24h)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg APY</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPercentage(stats.averageAPY)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Pools' },
                { key: 'active', label: 'Active Only' },
                { key: 'inactive', label: 'Inactive' },
                { key: 'imbalanced', label: 'Needs Rebalancing' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as FilterType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === filter.key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pools Table */}
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
        ) : filteredAndSortedPools.length === 0 ? (
          <div className="text-center py-12">
            <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterType !== 'all' ? 'No pools match your criteria' : 'No pools found'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <Link href="/create-pool" className="btn-primary">
                Create First Pool
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>Pool</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('tvl')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>TVL</span>
                      {getSortIcon('tvl')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('volume24h')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>24h Volume</span>
                      {getSortIcon('volume24h')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('apy')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <span>APY</span>
                      {getSortIcon('apy')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedPools.map((pool) => (
                  <tr key={pool.address} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {pool.tokenA.symbol.charAt(0)}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {pool.tokenB.symbol.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {pool.tokenA.symbol} / {pool.tokenB.symbol}
                          </div>
                          <button
                            onClick={() => handleCopyAddress(pool.address)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {truncateAddress(pool.address)}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(pool.tvl)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTokenAmount(pool.reserveA)} {pool.tokenA.symbol} + {formatTokenAmount(pool.reserveB)} {pool.tokenB.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(pool.volume24h || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatPercentage(pool.apy || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          pool.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {pool.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {pool.needsRebalancing && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            Rebalance
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/pools/${pool.address}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {pool.needsRebalancing && (
                          <Link
                            href={`/rebalance/${pool.address}`}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                        )}
                        <a
                          href={`https://explorer.testnet.rsk.co/address/${pool.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!isLoading && !error && filteredAndSortedPools.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAndSortedPools.length} of {pools.length} pools
          {searchTerm && ` matching "${searchTerm}"`}
          {filterType !== 'all' && ` (${filterType} filter applied)`}
        </div>
      )}
    </div>
  );
}
