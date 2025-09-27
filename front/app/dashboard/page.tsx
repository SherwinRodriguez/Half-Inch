'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/components/Dashboard';
import { SystemInitialization } from '@/components/SystemInitialization';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ApiStatusCheck } from '@/components/ApiStatusCheck';

export default function DashboardPage() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Check system status
  const { data: systemStatus, isLoading, error } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const response = await fetch('/api/system/initialize');
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      return response.json();
    },
    retry: 1,
  });

  useEffect(() => {
    if (systemStatus?.success && systemStatus?.data?.isInitialized) {
      setIsInitialized(true);
    }
  }, [systemStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-white/80">
            Checking system status...
          </p>
        </div>
      </div>
    );
  }

  if (error || !isInitialized) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gradient mb-4">
                Hues DEX Platform
              </h1>
              <p className="text-xl text-white/80">
                Advanced Liquidity Pool Management & Automated Rebalancing
              </p>
            </div>
            
            <ApiStatusCheck />
            
            <ErrorBoundary>
              <SystemInitialization 
                onInitialized={() => setIsInitialized(true)}
                error={error as Error}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  );
}
