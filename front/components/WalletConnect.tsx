'use client';

import { useState } from 'react';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { formatCurrency, truncateAddress, copyToClipboard } from '@/lib/utils';
import { toast } from './ui/Toaster';

interface WalletConnectProps {
  showBalance?: boolean;
  showNetworkSwitch?: boolean;
  compact?: boolean;
}

export function WalletConnect({ 
  showBalance = true, 
  showNetworkSwitch = true,
  compact = false 
}: WalletConnectProps) {
  const { 
    walletInfo, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    switchToRootstock,
    isWalletAvailable 
  } = useWallet();
  
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const handleCopyAddress = async () => {
    if (walletInfo?.address) {
      try {
        await copyToClipboard(walletInfo.address);
        toast.success('Address Copied', 'Wallet address copied to clipboard');
      } catch (error) {
        toast.error('Copy Failed', 'Failed to copy address to clipboard');
      }
    }
  };

  const handleNetworkSwitch = async () => {
    setIsSwitchingNetwork(true);
    try {
      await switchToRootstock();
    } catch (error) {
      // Error is already handled in the context
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const getNetworkInfo = () => {
    if (!walletInfo) return null;
    
    const { chainId } = walletInfo;
    
    switch (chainId) {
      case 31:
        return { name: 'Rootstock Testnet', color: 'text-green-600 dark:text-green-400' };
      case 30:
        return { name: 'Rootstock Mainnet', color: 'text-green-600 dark:text-green-400' };
      case 1:
        return { name: 'Ethereum Mainnet', color: 'text-yellow-600 dark:text-yellow-400' };
      case 11155111:
        return { name: 'Sepolia Testnet', color: 'text-yellow-600 dark:text-yellow-400' };
      default:
        return { name: `Chain ${chainId}`, color: 'text-red-600 dark:text-red-400' };
    }
  };

  const isCorrectNetwork = walletInfo?.chainId === 31 || walletInfo?.chainId === 30;

  if (!isWalletAvailable) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Wallet Not Available
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Please install MetaMask or another Web3 wallet
          </p>
        </div>
      </div>
    );
  }

  if (!walletInfo) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`btn-primary flex items-center space-x-2 ${
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-2'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  const networkInfo = getNetworkInfo();

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {truncateAddress(walletInfo.address)}
          </span>
        </div>
        
        <button
          onClick={disconnectWallet}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info Card */}
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Wallet Connected
            </span>
          </div>
          
          <button
            onClick={disconnectWallet}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
            title="Disconnect Wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Address */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {truncateAddress(walletInfo.address)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              title="Copy Address"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={`https://explorer.testnet.rsk.co/address/${walletInfo.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              title="View on Explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Balance */}
        {showBalance && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {parseFloat(walletInfo.balance).toFixed(4)} {
                walletInfo.chainId === 31 || walletInfo.chainId === 30 ? 'RBTC' : 'ETH'
              }
            </span>
          </div>
        )}

        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Network:</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${networkInfo?.color}`}>
              {networkInfo?.name}
            </span>
            {!isCorrectNetwork && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Wrong Network" />
            )}
          </div>
        </div>
      </div>

      {/* Network Switch */}
      {showNetworkSwitch && !isCorrectNetwork && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Wrong Network Detected
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                Please switch to Rootstock network for optimal experience with this DEX.
              </p>
              <button
                onClick={handleNetworkSwitch}
                disabled={isSwitchingNetwork}
                className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSwitchingNetwork ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Switch to Rootstock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message for Correct Network */}
      {isCorrectNetwork && (
        <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              Connected to Rootstock network
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
