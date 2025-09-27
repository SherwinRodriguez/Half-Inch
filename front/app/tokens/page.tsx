'use client';

import { TokenManager } from '@/components/TokenManager';
import { useState } from 'react';

export default function TokensPage() {
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>(31); // Default to Rootstock Testnet

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Token Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create, manage, and discover tokens across all supported blockchain networks. 
          Integrated with 1inch API for comprehensive token data.
        </p>
      </div>

      <TokenManager 
        chainId={selectedChainId}
        showCreateToken={true}
        showCrossChain={true}
      />
    </div>
  );
}
