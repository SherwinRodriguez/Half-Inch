'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { walletService, WalletInfo } from '@/lib/wallet';
import { toast } from '@/components/ui/Toaster';

interface WalletContextType {
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToRootstock: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  isWalletAvailable: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);

  useEffect(() => {
    // Check if wallet is available
    const checkWalletAvailability = async () => {
      const available = await walletService.isWalletAvailable();
      setIsWalletAvailable(available);
    };

    checkWalletAvailability();

    // Check for existing connection
    const checkExistingConnection = async () => {
      try {
        await walletService.checkConnection();
        setWalletInfo(walletService.getWalletInfo());
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    };

    checkExistingConnection();

    // Subscribe to wallet changes
    const unsubscribe = walletService.onWalletChange((info) => {
      setWalletInfo(info);
      
      if (info) {
        toast.success('Wallet Connected', `Connected to ${info.address.slice(0, 6)}...${info.address.slice(-4)}`);
      } else {
        toast.info('Wallet Disconnected', 'Your wallet has been disconnected');
      }
    });

    return unsubscribe;
  }, []);

  const connectWallet = async () => {
    if (!isWalletAvailable) {
      toast.error('Wallet Not Found', 'Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    try {
      const info = await walletService.connectWallet();
      setWalletInfo(info);
      
      // Check if we're on the correct network
      if (info.chainId !== 31 && info.chainId !== 30) {
        toast.warning('Wrong Network', 'Please switch to Rootstock network for optimal experience');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error('Connection Failed', error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    walletService.disconnect();
    setWalletInfo(null);
  };

  const switchToRootstock = async () => {
    try {
      await walletService.switchToRootstock();
      toast.success('Network Switched', 'Successfully switched to Rootstock network');
    } catch (error: any) {
      console.error('Network switch failed:', error);
      toast.error('Network Switch Failed', error.message || 'Failed to switch to Rootstock network');
      throw error;
    }
  };

  const signTransaction = async (transaction: any): Promise<string> => {
    try {
      const txHash = await walletService.signTransaction(transaction);
      toast.success('Transaction Signed', `Transaction submitted: ${txHash.slice(0, 10)}...`);
      return txHash;
    } catch (error: any) {
      console.error('Transaction signing failed:', error);
      toast.error('Transaction Failed', error.message || 'Failed to sign transaction');
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      const signature = await walletService.signMessage(message);
      toast.success('Message Signed', 'Message signed successfully');
      return signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      toast.error('Signing Failed', error.message || 'Failed to sign message');
      throw error;
    }
  };

  const contextValue: WalletContextType = {
    walletInfo,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToRootstock,
    signTransaction,
    signMessage,
    isWalletAvailable,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
