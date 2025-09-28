'use client';

import { TokenManager } from '@/components/TokenManager';
import { ChainSelector, SUPPORTED_CHAINS, Chain } from '@/components/ChainSelector';
import { useState } from 'react';

export default function TokensPage() {
  const [selectedChain, setSelectedChain] = useState<Chain>(SUPPORTED_CHAINS.find(c => c.chainId === 31) || SUPPORTED_CHAINS[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Token Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create, manage, and discover tokens across all supported blockchain networks. 
              Integrated with 1inch API for comprehensive token data.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Select Network
              </div>
              <ChainSelector 
                selectedChain={selectedChain}
                onChainSelect={setSelectedChain}
              />
            </div>
          </div>
        </div>
      </div>

      <TokenManager 
        chainId={selectedChain.chainId}
        showCreateToken={true}
        showCrossChain={true}
      />
    </div>
  );
}
