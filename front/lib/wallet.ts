import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

export interface WalletProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private walletInfo: WalletInfo | null = null;
  private listeners: Array<(walletInfo: WalletInfo | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.updateWalletInfo();
      }
    };

    const handleChainChanged = (chainId: string) => {
      this.updateWalletInfo();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
  }

  async isWalletAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  async connectWallet(): Promise<WalletInfo> {
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get wallet info
      await this.updateWalletInfo();

      return this.walletInfo!;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  async updateWalletInfo(): Promise<void> {
    if (!this.provider || !this.signer) return;

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      this.walletInfo = {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
      };

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to update wallet info:', error);
      this.disconnect();
    }
  }

  async switchToRootstock(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    const rootstockChainId = '0x1f'; // 31 in hex (Rootstock Testnet)
    const rootstockMainnetChainId = '0x1e'; // 30 in hex (Rootstock Mainnet)

    try {
      // Try to switch to Rootstock Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: rootstockChainId }],
      });
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: rootstockChainId,
                chainName: 'Rootstock Testnet',
                nativeCurrency: {
                  name: 'Test RBTC',
                  symbol: 'tRBTC',
                  decimals: 18,
                },
                rpcUrls: ['https://public-node.testnet.rsk.co'],
                blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Rootstock network to wallet');
        }
      } else {
        throw new Error('Failed to switch to Rootstock network');
      }
    }

    // Update wallet info after network switch
    await this.updateWalletInfo();
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction(transaction);
      return tx.hash;
    } catch (error: any) {
      console.error('Transaction signing error:', error);
      throw new Error(error.message || 'Failed to sign transaction');
    }
  }

  async getPrivateKey(): Promise<string> {
    // Note: This is not possible with browser wallets for security reasons
    // Private keys cannot be extracted from MetaMask or other browser wallets
    // Instead, we'll use the signer for transactions
    throw new Error('Private key extraction is not supported for security reasons. Use wallet signing instead.');
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error: any) {
      console.error('Message signing error:', error);
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.walletInfo = null;
    this.notifyListeners();
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  isConnected(): boolean {
    return !!this.walletInfo?.isConnected;
  }

  onWalletChange(callback: (walletInfo: WalletInfo | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.walletInfo));
  }

  async checkConnection(): Promise<void> {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        await this.updateWalletInfo();
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  }
}

// Singleton instance
export const walletService = new WalletService();
export default walletService;
