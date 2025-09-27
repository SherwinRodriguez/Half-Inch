'use client';

import Link from 'next/link';
import { 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Zap
} from 'lucide-react';
import { RebalanceEvent } from '@/lib/types';
import { formatTimeAgo, truncateAddress, formatTokenAmount } from '@/lib/utils';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface RebalanceActivityProps {
  data: RebalanceEvent[];
  isLoading?: boolean;
  limit?: number;
}

export function RebalanceActivity({ data, isLoading, limit = 5 }: RebalanceActivityProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No recent rebalance activity
        </p>
      </div>
    );
  }

  const recentEvents = data.slice(0, limit);

  return (
    <div className="space-y-3">
      {recentEvents.map((event) => (
        <RebalanceEventItem key={event.txHash} event={event} />
      ))}
      
      {data.length > limit && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/rebalance/activity"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View all activity</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

interface RebalanceEventItemProps {
  event: RebalanceEvent;
}

function RebalanceEventItem({ event }: RebalanceEventItemProps) {
  const getStatusIcon = () => {
    switch (event.status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const ratioChange = event.toRatio - event.fromRatio;
  const ratioChangePercent = (ratioChange / event.fromRatio) * 100;

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <Link
            href={`/pool/${event.poolAddress}`}
            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Pool {truncateAddress(event.poolAddress)}
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(event.timestamp)}
          </span>
        </div>
        
        <div className="mt-1 flex items-center justify-between">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Ratio: {event.fromRatio.toFixed(4)} → {event.toRatio.toFixed(4)}
            <span className={`ml-1 ${ratioChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({ratioChange > 0 ? '+' : ''}{ratioChangePercent.toFixed(2)}%)
            </span>
          </div>
          
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>
        
        {event.status === 'confirmed' && event.gasUsed && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Gas used: {formatTokenAmount(event.gasUsed, 0, 0)}
          </div>
        )}
        
        {event.slippage > 0 && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Slippage: {event.slippage.toFixed(2)}%
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <Link
          href={`/rebalance/status/${event.txHash}`}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
