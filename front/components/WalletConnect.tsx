'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        >
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </motion.div>
        <div>
          <motion.p 
            className="text-sm font-medium text-yellow-800 dark:text-yellow-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Wallet Not Available
          </motion.p>
          <motion.p 
            className="text-xs text-yellow-700 dark:text-yellow-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Please install MetaMask or another Web3 wallet
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (!walletInfo) {
    return (
      <motion.button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`btn-primary flex items-center space-x-2 ${
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-2'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <AnimatePresence mode="wait">
          {isConnecting ? (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </motion.div>
          ) : (
            <motion.div
              key="connect"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  const networkInfo = getNetworkInfo();

  if (compact) {
    return (
      <motion.div 
        className="flex items-center space-x-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div 
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div 
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {truncateAddress(walletInfo.address)}
          </span>
        </motion.div>
        
        <motion.button
          onClick={disconnectWallet}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Disconnect Wallet"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Wallet Info Card */}
      <motion.div 
        className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <motion.div 
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.span 
              className="font-medium text-gray-900 dark:text-gray-100"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Wallet Connected
            </motion.span>
          </div>
          
          <motion.button
            onClick={disconnectWallet}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
            title="Disconnect Wallet"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Address */}
        <motion.div 
          className="flex items-center justify-between mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {truncateAddress(walletInfo.address)}
            </span>
            <motion.button
              onClick={handleCopyAddress}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              title="Copy Address"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Copy className="w-3 h-3" />
            </motion.button>
            <motion.a
              href={`https://explorer.testnet.rsk.co/address/${walletInfo.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              title="View on Explorer"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ExternalLink className="w-3 h-3" />
            </motion.a>
          </div>
        </motion.div>

        {/* Balance */}
        <AnimatePresence>
          {showBalance && (
            <motion.div 
              className="flex items-center justify-between mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {parseFloat(walletInfo.balance).toFixed(4)} {
                  walletInfo.chainId === 31 || walletInfo.chainId === 30 ? 'RBTC' : 'ETH'
                }
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Network */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">Network:</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${networkInfo?.color}`}>
              {networkInfo?.name}
            </span>
            <AnimatePresence>
              {!isCorrectNetwork && (
                <motion.div 
                  className="w-2 h-2 bg-yellow-500 rounded-full" 
                  title="Wrong Network"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  exit={{ scale: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Network Switch */}
      <AnimatePresence>
        {showNetworkSwitch && !isCorrectNetwork && (
          <motion.div 
            className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-start space-x-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              </motion.div>
              <div className="flex-1">
                <motion.p 
                  className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Wrong Network Detected
                </motion.p>
                <motion.p 
                  className="text-xs text-yellow-700 dark:text-yellow-300 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Please switch to Rootstock network for optimal experience with this DEX.
                </motion.p>
                <motion.button
                  onClick={handleNetworkSwitch}
                  disabled={isSwitchingNetwork}
                  className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.5 }}
                >
                  <AnimatePresence mode="wait">
                    {isSwitchingNetwork ? (
                      <motion.div
                        key="switching"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Switching...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="switch"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Switch to Rootstock</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message for Correct Network */}
      <AnimatePresence>
        {isCorrectNetwork && (
          <motion.div 
            className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </motion.div>
              <motion.span 
                className="text-sm text-green-800 dark:text-green-200"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Connected to Rootstock network
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
