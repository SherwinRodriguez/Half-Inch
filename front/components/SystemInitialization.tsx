'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Server, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { toast } from './ui/Toaster';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnect } from './WalletConnect';

interface SystemInitializationProps {
  onInitialized: () => void;
  error?: Error;
}

export function SystemInitialization({ onInitialized, error }: SystemInitializationProps) {
  const { walletInfo } = useWallet();
  
  const [formData, setFormData] = useState({
    rpcUrl: 'https://public-node.testnet.rsk.co',
    factoryAddress: '',
    rebalancerAddress: '',
    routerAddress: '',
  });
  const [initStep, setInitStep] = useState<'idle' | 'deploying' | 'listening' | 'complete'>('idle');

  const initializeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!walletInfo) {
        throw new Error('Please connect your wallet first');
      }

      setInitStep('deploying');
      
      const response = await fetch('/api/system/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletInfo.address,
          useWalletSigning: true,
          rpcUrl: data.rpcUrl,
          contractAddresses: {
            factory: data.factoryAddress,
            rebalancerController: data.rebalancerAddress,
            router: data.routerAddress,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Initialization failed');
      }

      setInitStep('listening');
      
      // Simulate event listener setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInitStep('complete');
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('System Initialized', 'DEX system is ready for operation');
      setTimeout(() => {
        onInitialized();
      }, 1500);
    },
    onError: (error: Error) => {
      setInitStep('idle');
      toast.error('Initialization Failed', error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletInfo) {
      toast.error('Wallet Not Connected', 'Please connect your wallet to initialize the system');
      return;
    }
    
    if (!formData.rpcUrl) {
      toast.error('Missing RPC URL', 'RPC URL is required to connect to the blockchain');
      return;
    }
    
    initializeMutation.mutate(formData);
  };

  const steps = [
    {
      id: 'deploying',
      title: 'Deploy & Register Contracts',
      description: 'Verifying contract deployment and registering addresses',
      icon: Server,
      active: initStep === 'deploying',
      completed: ['listening', 'complete'].includes(initStep),
    },
    {
      id: 'listening',
      title: 'Set Up Event Listeners',
      description: 'Configuring real-time event monitoring',
      icon: Database,
      active: initStep === 'listening',
      completed: initStep === 'complete',
    },
    {
      id: 'complete',
      title: 'Initialize Pool Monitoring',
      description: 'System ready for liquidity pool management',
      icon: Zap,
      active: initStep === 'complete',
      completed: initStep === 'complete',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="pool-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            System Initialization
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your DEX system to start managing liquidity pools
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                System Not Initialized
              </p>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {error.message || 'Please initialize the system to continue'}
            </p>
          </div>
        )}

        {/* Wallet Connection */}
        {!walletInfo && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connect your wallet to initialize the DEX system
              </p>
            </div>
            <WalletConnect />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RPC URL *
            </label>
            <input
              type="url"
              value={formData.rpcUrl}
              onChange={(e) => setFormData({ ...formData, rpcUrl: e.target.value })}
              placeholder="https://public-node.testnet.rsk.co"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Factory Address
              </label>
              <input
                type="text"
                value={formData.factoryAddress}
                onChange={(e) => setFormData({ ...formData, factoryAddress: e.target.value })}
                placeholder="0x..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rebalancer Address
              </label>
              <input
                type="text"
                value={formData.rebalancerAddress}
                onChange={(e) => setFormData({ ...formData, rebalancerAddress: e.target.value })}
                placeholder="0x..."
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Router Address
            </label>
            <input
              type="text"
              value={formData.routerAddress}
              onChange={(e) => setFormData({ ...formData, routerAddress: e.target.value })}
              placeholder="0x..."
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={initializeMutation.isPending || !walletInfo}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {initializeMutation.isPending ? (
              <>
                <LoadingSpinner size="small" />
                <span>Initializing...</span>
              </>
            ) : (
              <span>{!walletInfo ? 'Connect Wallet to Initialize' : 'Initialize System'}</span>
            )}
          </button>
        </form>

        {initializeMutation.isPending && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Initialization Progress
            </h3>
            <div className="space-y-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      step.completed
                        ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800'
                        : step.active
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : step.active ? (
                        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        step.completed
                          ? 'text-green-800 dark:text-green-200'
                          : step.active
                          ? 'text-blue-800 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {step.title}
                      </p>
                      <p className={`text-sm ${
                        step.completed
                          ? 'text-green-600 dark:text-green-400'
                          : step.active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
