'use client';

import { AlertTriangle, RefreshCw, ExternalLink, Wifi } from 'lucide-react';

interface RpcErrorHandlerProps {
  error: Error;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function RpcErrorHandler({ error, onRetry, showRetryButton = true }: RpcErrorHandlerProps) {
  const isRpcError = error.message?.includes('timeout') || 
                    error.message?.includes('Request timeout') ||
                    error.message?.includes('free tier') ||
                    error.message?.includes('upgrade your tier') ||
                    error.message?.includes('CALL_EXCEPTION');

  const isNetworkError = error.message?.includes('NETWORK_ERROR') ||
                        error.message?.includes('connection') ||
                        error.message?.includes('fetch');

  if (!isRpcError && !isNetworkError) {
    return null; // Let other error handlers deal with non-RPC errors
  }

  const getErrorInfo = () => {
    if (error.message?.includes('free tier') || error.message?.includes('upgrade your tier')) {
      return {
        title: 'RPC Rate Limit Exceeded',
        description: 'The free RPC endpoint has reached its rate limit. This is a temporary issue.',
        icon: AlertTriangle,
        color: 'yellow',
        suggestions: [
          'Wait a few minutes and try again',
          'The system will automatically try different RPC endpoints',
          'Consider using a paid RPC provider for better reliability'
        ]
      };
    }

    if (error.message?.includes('timeout')) {
      return {
        title: 'Network Timeout',
        description: 'The blockchain network is taking too long to respond.',
        icon: Wifi,
        color: 'red',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'The network may be experiencing high traffic'
        ]
      };
    }

    if (error.message?.includes('CALL_EXCEPTION')) {
      return {
        title: 'Smart Contract Call Failed',
        description: 'The smart contract interaction failed, possibly due to network issues.',
        icon: AlertTriangle,
        color: 'red',
        suggestions: [
          'Verify your token addresses are correct',
          'Ensure you have sufficient gas fees',
          'Try again with a different RPC endpoint'
        ]
      };
    }

    return {
      title: 'Network Connection Error',
      description: 'Unable to connect to the blockchain network.',
      icon: Wifi,
      color: 'red',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'The network may be temporarily unavailable'
      ]
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  return (
    <div className={`p-4 rounded-lg border ${
      errorInfo.color === 'yellow' 
        ? 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800'
        : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 ${
          errorInfo.color === 'yellow'
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400'
        }`} />
        
        <div className="flex-1">
          <h3 className={`font-medium ${
            errorInfo.color === 'yellow'
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {errorInfo.title}
          </h3>
          
          <p className={`text-sm mt-1 ${
            errorInfo.color === 'yellow'
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {errorInfo.description}
          </p>

          <div className="mt-3">
            <p className={`text-sm font-medium mb-2 ${
              errorInfo.color === 'yellow'
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              What you can do:
            </p>
            <ul className={`text-sm space-y-1 ${
              errorInfo.color === 'yellow'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {showRetryButton && onRetry && (
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={onRetry}
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  errorInfo.color === 'yellow'
                    ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-700'
                    : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <a
                href="https://developers.rsk.co/rsk/node/configure/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  errorInfo.color === 'yellow'
                    ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-700'
                    : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>RPC Help</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Technical Details (Collapsible) */}
      <details className="mt-4">
        <summary className={`cursor-pointer text-sm ${
          errorInfo.color === 'yellow'
            ? 'text-yellow-700 dark:text-yellow-300'
            : 'text-red-700 dark:text-red-300'
        } hover:underline`}>
          Show technical details
        </summary>
        <pre className={`mt-2 p-3 rounded text-xs overflow-auto ${
          errorInfo.color === 'yellow'
            ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
            : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
        }`}>
          {error.message}
          {error.stack && (
            <>
              {'\n\nStack trace:\n'}
              {error.stack}
            </>
          )}
        </pre>
      </details>
    </div>
  );
}
