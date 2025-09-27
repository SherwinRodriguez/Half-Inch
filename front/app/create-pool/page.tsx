'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Plus, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { PoolCreationParams } from '@/lib/types';
import { isValidAddress, formatTokenAmount, truncateAddress } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnect } from '@/components/WalletConnect';
import { RpcErrorHandler } from '@/components/RpcErrorHandler';

export default function CreatePoolPage() {
  const { walletInfo, signTransaction } = useWallet();
  
  const [formData, setFormData] = useState<PoolCreationParams>({
    tokenA: '',
    tokenB: '',
    amountA: '',
    amountB: '',
    targetRatio: 1.0,
  });
  
  const [step, setStep] = useState<'setup' | 'confirm' | 'creating'>('setup');
  const [tokenAInfo, setTokenAInfo] = useState<any>(null);
  const [tokenBInfo, setTokenBInfo] = useState<any>(null);
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const createPoolMutation = useMutation({
    mutationFn: async (data: PoolCreationParams) => {
      // Check if we have either wallet or private key
      if (!usePrivateKey && !walletInfo) {
        throw new Error('Please connect your wallet or provide a private key');
      }
      
      if (usePrivateKey && !privateKey) {
        throw new Error('Please provide a private key');
      }

      setStep('creating');
      
      // Prepare request body based on authentication method
      const requestBody = {
        ...data,
        ...(usePrivateKey 
          ? { privateKey, useWalletSigning: false }
          : { walletAddress: walletInfo?.address, useWalletSigning: true }
        )
      };
      
      const createResponse = await fetch('/api/pools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create pool');
      }

      const result = await createResponse.json();
      
      // Add initial liquidity
      if (data.amountA && data.amountB) {
        const liquidityResponse = await fetch('/api/pools/add-liquidity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolAddress: result.data.poolAddress,
            amountA: data.amountA,
            amountB: data.amountB,
            ...(usePrivateKey 
              ? { privateKey, useWalletSigning: false }
              : { walletAddress: walletInfo?.address, useWalletSigning: true }
            )
          }),
        });

        if (!liquidityResponse.ok) {
          console.warn('Pool created but failed to add initial liquidity');
        }
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success('Pool Created', `Pool ${data.data.poolAddress} created successfully`);
      // Reset form
      setFormData({
        tokenA: '',
        tokenB: '',
        amountA: '',
        amountB: '',
        targetRatio: 1.0,
      });
      setStep('setup');
    },
    onError: (error: Error) => {
      console.error('Pool creation failed:', error);
      setStep('confirm');
      // Don't show toast for RPC errors, let the RpcErrorHandler component handle it
      if (!error.message?.includes('timeout') && !error.message?.includes('free tier')) {
        toast.error('Pool Creation Failed', error.message);
      }
    },
  });

  const handleTokenLookup = async (address: string, isTokenA: boolean) => {
    if (!isValidAddress(address)) return;

    try {
      const response = await fetch(`/api/tokens/${address}`);
      if (response.ok) {
        const tokenInfo = await response.json();
        if (isTokenA) {
          setTokenAInfo(tokenInfo.data);
        } else {
          setTokenBInfo(tokenInfo.data);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch token info:', error);
    }
  };

  const calculateRatio = () => {
    if (!formData.amountA || !formData.amountB) return 0;
    return parseFloat(formData.amountA) / parseFloat(formData.amountB);
  };

  const isFormValid = () => {
    const hasAuth = usePrivateKey ? privateKey : walletInfo;
    return (
      hasAuth &&
      isValidAddress(formData.tokenA) &&
      isValidAddress(formData.tokenB) &&
      formData.tokenA !== formData.tokenB &&
      parseFloat(formData.amountA || '0') > 0 &&
      parseFloat(formData.amountB || '0') > 0 &&
      formData.targetRatio > 0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'setup') {
      setStep('confirm');
    } else if (step === 'confirm') {
      createPoolMutation.mutate(formData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create Liquidity Pool
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new trading pair and provide initial liquidity
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              step === 'setup' ? 'text-blue-600' : 'text-green-600'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'setup' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' 
                  : 'bg-green-100 dark:bg-green-900 text-green-600'
              }`}>
                {step === 'setup' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="font-medium">Setup</span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className={`flex items-center space-x-2 ${
              step === 'confirm' ? 'text-blue-600' : 
              step === 'creating' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirm' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : step === 'creating'
                  ? 'bg-green-100 dark:bg-green-900 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                {step === 'creating' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === 'confirm' ? (
                  '2'
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <span className="font-medium">Confirm</span>
            </div>
          </div>
        </div>

        <div className="pool-card p-8">
          {/* Authentication Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Choose Authentication Method
            </h3>
            
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUsePrivateKey(false)}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  !usePrivateKey
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                🔗 Wallet Connection (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setUsePrivateKey(true)}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  usePrivateKey
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                🔑 Private Key
              </button>
            </div>

            {/* Wallet Connection */}
            {!usePrivateKey && !walletInfo && (
              <div>
                <div className="text-center mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Connect your wallet to create liquidity pools securely
                  </p>
                </div>
                <WalletConnect />
              </div>
            )}

            {/* Connected Wallet Info */}
            {!usePrivateKey && walletInfo && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Wallet Connected
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {truncateAddress(walletInfo.address)} • Balance: {parseFloat(walletInfo.balance).toFixed(4)} RBTC
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Private Key Input */}
            {usePrivateKey && (
              <div>
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Security Warning
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        Using private keys directly is less secure. We recommend using wallet connection instead.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="0x..."
                      className="input-field pr-10"
                      required={usePrivateKey}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPrivateKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {step === 'setup' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token A Address *
                </label>
                <input
                  type="text"
                  value={formData.tokenA}
                  onChange={(e) => {
                    setFormData({ ...formData, tokenA: e.target.value });
                    handleTokenLookup(e.target.value, true);
                  }}
                  placeholder="0x..."
                  className="input-field"
                  required
                />
                {tokenAInfo && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {tokenAInfo.name} ({tokenAInfo.symbol})
                    </p>
                  </div>
                )}
              </div>

              {/* Token B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token B Address *
                </label>
                <input
                  type="text"
                  value={formData.tokenB}
                  onChange={(e) => {
                    setFormData({ ...formData, tokenB: e.target.value });
                    handleTokenLookup(e.target.value, false);
                  }}
                  placeholder="0x..."
                  className="input-field"
                  required
                />
                {tokenBInfo && (
                  <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      {tokenBInfo.name} ({tokenBInfo.symbol})
                    </p>
                  </div>
                )}
              </div>

              {/* Initial Liquidity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token A Amount *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.amountA}
                    onChange={(e) => setFormData({ ...formData, amountA: e.target.value })}
                    placeholder="0.0"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token B Amount *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.amountB}
                    onChange={(e) => setFormData({ ...formData, amountB: e.target.value })}
                    placeholder="0.0"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Target Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Ratio (Token A / Token B)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.targetRatio}
                  onChange={(e) => setFormData({ ...formData, targetRatio: parseFloat(e.target.value) })}
                  placeholder="1.0"
                  className="input-field"
                  min="0.0001"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current ratio from amounts: {calculateRatio().toFixed(4)}
                </p>
              </div>

              {/* Validation Warnings */}
              {formData.tokenA && formData.tokenB && formData.tokenA === formData.tokenB && (
                <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      Token A and Token B must be different
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid()}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usePrivateKey 
                  ? (!privateKey ? 'Enter Private Key to Continue' : 'Review Pool Creation')
                  : (!walletInfo ? 'Connect Wallet to Continue' : 'Review Pool Creation')
                }
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Confirm Pool Creation
              </h2>

              {/* Show RPC Error Handler if there's an error */}
              {createPoolMutation.error && (
                <RpcErrorHandler 
                  error={createPoolMutation.error as Error}
                  onRetry={() => {
                    createPoolMutation.reset();
                    createPoolMutation.mutate(formData);
                  }}
                />
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trading Pair</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tokenAInfo?.symbol || 'TokenA'} / {tokenBInfo?.symbol || 'TokenB'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Initial Liquidity</span>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatTokenAmount(formData.amountA)} {tokenAInfo?.symbol || 'TokenA'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatTokenAmount(formData.amountB)} {tokenBInfo?.symbol || 'TokenB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Target Ratio</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formData.targetRatio.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Initial Ratio</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {calculateRatio().toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                      Important Notes
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 text-sm mt-1 space-y-1">
                      <li>• Make sure you have approved both tokens for spending</li>
                      <li>• Pool creation requires gas fees</li>
                      <li>• You'll receive LP tokens representing your share</li>
                      <li>• The pool will be automatically monitored for rebalancing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 btn-secondary"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createPoolMutation.isPending}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {createPoolMutation.isPending ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Creating Pool...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Pool</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <LoadingSpinner size="large" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                Creating Pool...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Please wait while we create your liquidity pool and add initial liquidity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
