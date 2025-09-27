'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  MoreHorizontal,
  Copy,
  Eye
} from 'lucide-react';
import { Pool } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage, 
  formatTokenAmount, 
  truncateAddress,
  copyToClipboard 
} from '@/lib/utils';
import { toast } from './ui/Toaster';

interface PoolCardProps {
  pool: Pool;
  showActions?: boolean;
}

export function PoolCard({ pool, showActions = true }: PoolCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(pool.address);
      toast.success('Address Copied', 'Pool address copied to clipboard');
    } catch (error) {
      toast.error('Copy Failed', 'Failed to copy address to clipboard');
    }
  };

  const ratioDeviation = Math.abs(pool.ratio - pool.targetRatio) / pool.targetRatio * 100;
  const isHighDeviation = ratioDeviation > 10;

  return (
    <div className="pool-card p-6 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                {pool.token0Symbol.charAt(0)}
              </span>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center -ml-2">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                {pool.token1Symbol.charAt(0)}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {pool.token0Symbol}/{pool.token1Symbol}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyAddress}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1"
              >
                <span>{truncateAddress(pool.address)}</span>
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {pool.isImbalanced ? (
            <span className="status-badge status-imbalanced">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Imbalanced
            </span>
          ) : (
            <span className="status-badge status-balanced">
              <CheckCircle className="w-3 h-3 mr-1" />
              Balanced
            </span>
          )}
          
          {showActions && (
            <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            TVL
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.tvl)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            24h Volume
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.volume24h)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            APY
          </p>
          <div className="flex items-center space-x-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatPercentage(pool.apy)}
            </p>
            {pool.apy > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            24h Fees
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.fees24h)}
          </p>
        </div>
      </div>

      {/* Ratio Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Ratio
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Target: {pool.targetRatio.toFixed(4)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                pool.isImbalanced 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, (pool.ratio / (pool.targetRatio * 2)) * 100)}%`
              }}
            />
          </div>
          <span className={`text-sm font-medium ${
            pool.isImbalanced 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {pool.ratio.toFixed(4)}
          </span>
        </div>
        
        {isHighDeviation && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {formatPercentage(ratioDeviation)} deviation from target
          </p>
        )}
      </div>

      {/* Reserves */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {pool.token0Symbol}
          </p>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            {formatTokenAmount(pool.reserve0)}
          </p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {pool.token1Symbol}
          </p>
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            {formatTokenAmount(pool.reserve1)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center space-x-2">
          <Link
            href={`/pool/${pool.address}`}
            className="flex-1 btn-secondary text-center flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </Link>
          
          {pool.isImbalanced && (
            <Link
              href={`/rebalance/${pool.address}`}
              className="flex-1 btn-primary text-center flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Rebalance</span>
            </Link>
          )}
          
          <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(pool.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Last Rebalance</p>
              <p className="text-gray-900 dark:text-gray-100">
                {pool.lastRebalance ? new Date(pool.lastRebalance).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Supply</p>
              <p className="text-gray-900 dark:text-gray-100">
                {formatTokenAmount(pool.totalSupply)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Token Addresses</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {truncateAddress(pool.token0)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {truncateAddress(pool.token1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
