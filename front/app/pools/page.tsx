'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Activity,
  Compass
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
  const queryClient = useQueryClient();

  // Auto-initialize system on mount
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        await fetch('/api/system/initialize');
      } catch (error) {
        console.warn('System initialization failed:', error);
      }
    };
    
    initializeSystem();
  }, []);

  // Fetch pools data
  const { data: poolsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pools', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/pools/blockchain-status?detailed=true&timeframe=24h');
      if (!response.ok) {
        throw new Error('Failed to fetch pools data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Pool discovery mutation
  const discoverPoolsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/pools/discover');
      if (!response.ok) {
        throw new Error('Failed to discover pools');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          'Pools Discovered!', 
          `Found ${data.data.totalDiscovered} pools${data.data.imbalancedCount > 0 ? `, ${data.data.imbalancedCount} need rebalancing` : ''}`
        );
        queryClient.invalidateQueries({ queryKey: ['pools'] });
      } else {
        toast.error('Discovery Failed', data.error || 'Unknown error occurred');
      }
    },
    onError: (error) => {
      toast.error('Discovery Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    },
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-tan-nimbus font-bold text-white mb-2">
            Liquidity Pools
          </h1>
          <p className="text-white/80 text-lg font-space-grotesk">
            Discover and manage liquidity pools on the Hues DEX platform
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => discoverPoolsMutation.mutate()}
            disabled={discoverPoolsMutation.isPending}
            className="btn-secondary flex items-center space-x-2"
            title="Discover existing pools from the blockchain"
          >
            <Compass className={`w-4 h-4 ${discoverPoolsMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Discover</span>
          </button>
          
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Pools', value: stats.totalPools.toString(), icon: Droplets, color: 'blue' },
          { title: 'Total TVL', value: formatCurrency(stats.totalTVL), icon: BarChart3, color: 'green' },
          { title: '24h Volume', value: formatCurrency(stats.totalVolume24h), icon: Activity, color: 'purple' },
          { title: 'Avg APY', value: formatPercentage(stats.averageAPY), icon: TrendingUp, color: 'orange' }
        ].map((stat, index) => {
          const Icon = stat.icon;
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
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  stat.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                  'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div 
        className="rounded-2xl p-6 relative overflow-hidden"
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search pools by token or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'all', label: 'All Pools' },
                { key: 'active', label: 'Active Only' },
                { key: 'inactive', label: 'Inactive' },
                { key: 'imbalanced', label: 'Needs Rebalancing' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as FilterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    filterType === filter.key
                      ? 'bg-white/30 text-white border border-white/40'
                      : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white'
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
      <div 
        className="rounded-2xl overflow-hidden relative"
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-12 px-6">
            <p className="text-red-300 mb-4 text-lg">
              Failed to load pools data
            </p>
            <button 
              onClick={() => refetch()} 
              className="px-6 py-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 hover:bg-red-500/30 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedPools.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Droplets className="w-16 h-16 text-white/40 mx-auto mb-6" />
            <p className="text-white/80 mb-6 text-lg">
              {searchTerm || filterType !== 'all' ? 'No pools match your criteria' : 'No pools found'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => discoverPoolsMutation.mutate()}
                  disabled={discoverPoolsMutation.isPending}
                  className="px-6 py-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-200 hover:bg-purple-500/30 transition-all duration-300 inline-flex items-center space-x-2"
                >
                  <Compass className={`w-4 h-4 ${discoverPoolsMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{discoverPoolsMutation.isPending ? 'Discovering...' : 'Discover Pools'}</span>
                </button>
                
                <Link 
                  href="/create-pool" 
                  className="px-6 py-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-200 hover:bg-blue-500/30 transition-all duration-300 inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Pool</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-sm font-medium text-white/80 uppercase tracking-wider hover:text-white transition-colors duration-200"
                    >
                      <span>Pool</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('tvl')}
                      className="flex items-center space-x-1 text-sm font-medium text-white/80 uppercase tracking-wider hover:text-white transition-colors duration-200"
                    >
                      <span>TVL</span>
                      {getSortIcon('tvl')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('volume24h')}
                      className="flex items-center space-x-1 text-sm font-medium text-white/80 uppercase tracking-wider hover:text-white transition-colors duration-200"
                    >
                      <span>24h Volume</span>
                      {getSortIcon('volume24h')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('apy')}
                      className="flex items-center space-x-1 text-sm font-medium text-white/80 uppercase tracking-wider hover:text-white transition-colors duration-200"
                    >
                      <span>APY</span>
                      {getSortIcon('apy')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAndSortedPools.map((pool) => (
                  <tr key={pool.address} className="hover:bg-white/5 transition-colors duration-200">
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
                          <div className="text-sm font-medium text-white">
                            {pool.tokenA.symbol} / {pool.tokenB.symbol}
                          </div>
                          <button
                            onClick={() => handleCopyAddress(pool.address)}
                            className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200"
                          >
                            {truncateAddress(pool.address)}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(pool.tvl)}
                      </div>
                      <div className="text-xs text-white/60">
                        {formatTokenAmount(pool.reserveA)} {pool.tokenA.symbol} + {formatTokenAmount(pool.reserveB)} {pool.tokenB.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {formatCurrency(pool.volume24h || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {formatPercentage(pool.apy || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          pool.isActive
                            ? 'bg-green-500/20 border border-green-400/30 text-green-200'
                            : 'bg-red-500/20 border border-red-400/30 text-red-200'
                        }`}>
                          {pool.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {pool.needsRebalancing && (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-200">
                            Rebalance
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/pools/${pool.address}`}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 hover:text-blue-100 transition-all duration-200"
                          title="View Pool Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {pool.needsRebalancing && (
                          <Link
                            href={`/rebalance/${pool.address}`}
                            className="p-2 rounded-lg bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 hover:text-orange-100 transition-all duration-200"
                            title="Rebalance Pool"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                        )}
                        <a
                          href={`https://explorer.testnet.rsk.co/address/${pool.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80 transition-all duration-200"
                          title="View on Explorer"
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
        <div className="text-center text-sm text-white/60">
          Showing {filteredAndSortedPools.length} of {pools.length} pools
          {searchTerm && ` matching "${searchTerm}"`}
          {filterType !== 'all' && ` (${filterType} filter applied)`}
        </div>
      )}
    </div>
  );
}
