'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

  const ratioDeviation = Math.abs(pool.currentRatio - pool.targetRatio) / pool.targetRatio * 100;
  const isHighDeviation = ratioDeviation > 10;

  return (
    <motion.div 
      className="pool-card p-6 hover:shadow-lg transition-all duration-300"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <motion.div 
              className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                {pool.tokenA.symbol.charAt(0)}
              </span>
            </motion.div>
            <motion.div 
              className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center -ml-2"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                {pool.tokenB.symbol.charAt(0)}
              </span>
            </motion.div>
          </div>
          
          <div>
            <motion.h3 
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {pool.tokenA.symbol}/{pool.tokenB.symbol}
            </motion.h3>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleCopyAddress}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center space-x-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span>{truncateAddress(pool.address)}</span>
                <Copy className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <AnimatePresence mode="wait">
            {pool.needsRebalancing ? (
              <motion.span 
                key="imbalanced"
                className="status-badge status-imbalanced"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                </motion.div>
                Imbalanced
              </motion.span>
            ) : (
              <motion.span 
                key="balanced"
                className="status-badge status-balanced"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                </motion.div>
                Balanced
              </motion.span>
            )}
          </AnimatePresence>
          
          {showActions && (
            <motion.button 
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, staggerChildren: 0.1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            TVL
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.tvl)}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            24h Volume
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.volume24h || 0)}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            APY
          </p>
          <div className="flex items-center space-x-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatPercentage(pool.apy || 0)}
            </p>
            <motion.div
              animate={{ 
                y: (pool.apy || 0) > 0 ? [-1, 1, -1] : [1, -1, 1],
                rotate: (pool.apy || 0) > 0 ? [0, 5, 0] : [0, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              {(pool.apy || 0) > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            24h Fees
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(pool.fees24h)}
          </p>
        </motion.div>
      </motion.div>

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
                pool.needsRebalancing 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, (pool.currentRatio / (pool.targetRatio * 2)) * 100)}%`
              }}
            />
          </div>
          <span className={`text-sm font-medium ${
            pool.needsRebalancing 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {pool.currentRatio.toFixed(4)}
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
            {pool.tokenA.symbol}
          </p>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            {formatTokenAmount(pool.reserveA)}
          </p>
        </div>

        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {pool.tokenB.symbol}
          </p>
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            {formatTokenAmount(pool.reserveB)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.9, staggerChildren: 0.1 }}
          >
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href={`/pool/${pool.address}`}
                className="flex-1 btn-secondary text-center flex items-center justify-center space-x-2 w-full"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </Link>
            </motion.div>
            
            <AnimatePresence>
              {pool.needsRebalancing && (
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={`/rebalance/${pool.address}`}
                    className="flex-1 btn-primary text-center flex items-center justify-center space-x-2 w-full"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    <span>Rebalance</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.button 
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-gray-900 dark:text-gray-100">
                {pool.createdAt ? new Date(pool.createdAt).toLocaleDateString() : 'Unknown'}
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
                  {truncateAddress(pool.tokenA.address)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {truncateAddress(pool.tokenB.address)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
