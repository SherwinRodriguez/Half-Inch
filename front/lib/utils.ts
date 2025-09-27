import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidPrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey) || /^[a-fA-F0-9]{64}$/.test(privateKey);
}

export function formatTokenAmount(amount: string | number, decimals = 18, displayDecimals = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (num === 0) return '0';
  
  if (num < 0.0001) {
    return '< 0.0001';
  }
  
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  
  return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

export function calculateAPY(
  totalRewards: number,
  totalStaked: number,
  timeframe: number // in days
): number {
  if (totalStaked === 0 || timeframe === 0) return 0;
  
  const dailyReturn = totalRewards / totalStaked / timeframe;
  const apy = (Math.pow(1 + dailyReturn, 365) - 1) * 100;
  
  return apy;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'success':
    case 'balanced':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    case 'pending':
    case 'processing':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    case 'failed':
    case 'error':
    case 'imbalanced':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(err => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
    }
    throw err;
  });
}
