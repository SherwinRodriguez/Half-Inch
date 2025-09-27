'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/Toaster';

// Global flag to prevent multiple concurrent initializations
let globalInitializing = false;

interface SystemInitializerProps {
  children: React.ReactNode;
}

export function SystemInitializer({ children }: SystemInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Prevent multiple concurrent initializations
        if (globalInitializing) {
          console.log('⏭️ System initialization already in progress, skipping...');
          setIsInitializing(false);
          return;
        }
        
        console.log('🚀 Initializing Hues DEX system...');
        globalInitializing = true;
        
        // Check if already initialized recently (within last 10 minutes)
        const lastInit = localStorage.getItem('hues_last_init');
        const now = Date.now();
        if (lastInit && (now - parseInt(lastInit)) < 10 * 60 * 1000) {
          console.log('✅ System already initialized recently, skipping...');
          setIsInitializing(false);
          globalInitializing = false;
          return;
        }
        
        // Call system initialization endpoint
        const response = await fetch('/api/system/initialize', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Initialization failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ System initialized successfully');
          console.log(`📊 Found ${data.data.totalPools} pools`);
          
          // Store initialization timestamp
          localStorage.setItem('hues_last_init', now.toString());
          
          // Show success toast if pools were discovered
          if (data.data.totalPools > 0) {
            toast.success(
              'System Ready!', 
              `Found ${data.data.totalPools} existing pools${data.data.activeRebalances > 0 ? `, ${data.data.activeRebalances} need rebalancing` : ''}`
            );
          }
        } else {
          throw new Error(data.error || 'System initialization failed');
        }
        
        setIsInitializing(false);
        globalInitializing = false;
        
        // Set up periodic discovery (every hour)
        const periodicDiscovery = setInterval(async () => {
          try {
            console.log('🔄 Running periodic pool discovery...');
            const periodicResponse = await fetch('/api/pools/discover');
            if (periodicResponse.ok) {
              const periodicData = await periodicResponse.json();
              if (periodicData.success && periodicData.data.totalDiscovered > 0) {
                console.log(`🎉 Periodic discovery found ${periodicData.data.totalDiscovered} pools`);
              }
            }
          } catch (periodicError) {
            console.warn('⚠️  Periodic discovery failed:', periodicError);
          }
        }, 60 * 60 * 1000); // Run every hour

        return () => clearInterval(periodicDiscovery);
        
      } catch (error) {
        console.error('❌ System initialization failed:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitializing(false);
        globalInitializing = false;
        
        // Show error toast but don't block the app
        toast.warning(
          'Initialization Warning',
          'Some features may not work properly. Try refreshing or using the Discover button.'
        );
      }
    };

    // Add a small delay to avoid too many simultaneous requests on app start
    const timer = setTimeout(initializeSystem, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Don't block the app if initialization fails - just log the error
  return <>{children}</>;
}

export default SystemInitializer;
