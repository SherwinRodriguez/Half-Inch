'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  Coins,
  Globe,
  Shield,
  Activity,
  TrendingUp
} from 'lucide-react';
import { TokenInfo } from '@/lib/1inch-integration';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toaster';

interface TokenManagerProps {
  chainId?: number;
  showCreateToken?: boolean;
  showCrossChain?: boolean;
}

export function TokenManager({ 
  chainId, 
  showCreateToken = true, 
  showCrossChain = true 
}: TokenManagerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<number | undefined>(chainId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCrossChainForm, setShowCrossChainForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'external' | 'popular'>('external');

  // Fetch supported chains
  const { data: chainsData } = useQuery({
    queryKey: ['chains'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/1inch?action=chains');
      if (!response.ok) throw new Error('Failed to fetch chains');
      return response.json();
    },
  });

  // Fetch tokens based on active tab
  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ['tokens', activeTab, selectedChain, searchQuery],
    queryFn: async () => {
      let url = '/api/tokens/1inch?action=';
      
      if (activeTab === 'local') {
        url = '/api/tokens/manage?action=local-tokens';
      } else if (activeTab === 'popular') {
        url += 'popular';
        if (selectedChain) url += `&chainId=${selectedChain}`;
      } else {
        if (searchQuery) {
          url += `search&query=${encodeURIComponent(searchQuery)}`;
          if (selectedChain) url += `&chainId=${selectedChain}`;
        } else {
          url += 'tokens';
          if (selectedChain) url += `&chainId=${selectedChain}`;
        }
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async (tokenData: {
      name: string;
      symbol: string;
      decimals: number;
      initialSupply: string;
      isMintable: boolean;
      isBurnable: boolean;
      privateKey: string;
    }) => {
      const response = await fetch('/api/tokens/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-token',
          ...tokenData
        }),
      });
      if (!response.ok) throw new Error('Failed to create token');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Token Created', `Token ${data.data.symbol} created successfully`);
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast.error('Creation Failed', error.message);
    },
  });

  // Register token mutation
  const registerTokenMutation = useMutation({
    mutationFn: async (tokenData: {
      tokenAddress: string;
      name: string;
      symbol: string;
      decimals: number;
      chainId: number;
      privateKey: string;
    }) => {
      const response = await fetch('/api/tokens/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-token',
          ...tokenData
        }),
      });
      if (!response.ok) throw new Error('Failed to register token');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Token Registered', `Token ${data.data.symbol} registered successfully`);
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error) => {
      toast.error('Registration Failed', error.message);
    },
  });

  const tokens = tokensData?.data || [];
  const chains = chainsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Token Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tokens across all supported chains
          </p>
        </div>
        
        <div className="flex space-x-2">
          {showCreateToken && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Token</span>
            </button>
          )}
          
          {showCrossChain && (
            <button
              onClick={() => setShowCrossChainForm(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>Cross-Chain</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Chain Selector */}
        <div className="flex-1">
          <select
            value={selectedChain || ''}
            onChange={(e) => setSelectedChain(e.target.value ? parseInt(e.target.value) : undefined)}
            className="input-field"
          >
            <option value="">All Chains</option>
            {chains.map((chain: any) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('external')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'external'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <ExternalLink className="w-4 h-4" />
            <span>External Tokens</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'local'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Coins className="w-4 h-4" />
            <span>Local Tokens</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'popular'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Popular</span>
          </div>
        </button>
      </div>

      {/* Tokens List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {tokensLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No tokens found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tokens.map((token: TokenInfo | any, index: number) => (
              <TokenRow 
                key={`${token.address}-${index}`} 
                token={token} 
                onRegister={registerTokenMutation.mutate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Token Form */}
      {showCreateForm && (
        <CreateTokenForm 
          onClose={() => setShowCreateForm(false)}
          onCreate={createTokenMutation.mutate}
          isLoading={createTokenMutation.isPending}
        />
      )}

      {/* Cross-Chain Form */}
      {showCrossChainForm && (
        <CrossChainForm 
          onClose={() => setShowCrossChainForm(false)}
          chains={chains}
        />
      )}
    </div>
  );
}

function TokenRow({ 
  token, 
  onRegister 
}: { 
  token: TokenInfo | any; 
  onRegister: (data: any) => void;
}) {
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const handleRegister = (privateKey: string) => {
    onRegister({
      tokenAddress: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      chainId: token.chainId,
      privateKey
    });
    setShowRegisterForm(false);
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {token.logoURI ? (
            <img 
              src={token.logoURI} 
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-token.png';
              }}
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-gray-500" />
            </div>
          )}
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {token.symbol}
              </h3>
              {token.verified && (
                <Shield className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {token.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {token.decimals} decimals
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chain: {token.chainId}
            </p>
          </div>

          <button
            onClick={() => setShowRegisterForm(true)}
            className="btn-secondary text-sm"
          >
            Register
          </button>
        </div>
      </div>

      {showRegisterForm && (
        <RegisterTokenForm 
          token={token}
          onRegister={handleRegister}
          onClose={() => setShowRegisterForm(false)}
        />
      )}
    </div>
  );
}

function CreateTokenForm({ 
  onClose, 
  onCreate, 
  isLoading 
}: { 
  onClose: () => void;
  onCreate: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '',
    isMintable: true,
    isBurnable: true,
    privateKey: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create New Token
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="My Token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Symbol
            </label>
            <input
              type="text"
              required
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="input-field"
              placeholder="MTK"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Decimals
            </label>
            <input
              type="number"
              min="0"
              max="18"
              value={formData.decimals}
              onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Supply
            </label>
            <input
              type="text"
              required
              value={formData.initialSupply}
              onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
              className="input-field"
              placeholder="1000000"
            />
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isMintable}
                onChange={(e) => setFormData({ ...formData, isMintable: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mintable</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isBurnable}
                onChange={(e) => setFormData({ ...formData, isBurnable: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Burnable</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Private Key
            </label>
            <input
              type="password"
              required
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              className="input-field"
              placeholder="Enter private key for deployment"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterTokenForm({ 
  token, 
  onRegister, 
  onClose 
}: { 
  token: any;
  onRegister: (privateKey: string) => void;
  onClose: () => void;
}) {
  const [privateKey, setPrivateKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(privateKey);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
        Register {token.symbol} Token
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Private Key
          </label>
          <input
            type="password"
            required
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="input-field"
            placeholder="Enter private key for registration"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary text-sm"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
}

function CrossChainForm({ 
  onClose, 
  chains 
}: { 
  onClose: () => void;
  chains: any[];
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cross-Chain Token Mapping
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This feature will be implemented to map tokens across different chains.
        </p>
        
        <button
          onClick={onClose}
          className="w-full btn-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
