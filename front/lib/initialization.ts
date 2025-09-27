import database from './database';

class InitializationService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Starting application initialization...');

      // Check if we already have pools in the database
      const existingPools = database.getAllPools();
      if (existingPools.length > 0) {
        console.log(`✅ Found ${existingPools.length} existing pools in database`);
        this.initialized = true;
        return;
      }

      console.log('🔍 No pools found, starting pool discovery...');
      
      // Discover pools automatically
      await this.discoverPools();
      
      this.initialized = true;
      console.log('✅ Application initialization completed');
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      // Don't throw - let the app continue even if discovery fails
    }
  }

  private async discoverPools(): Promise<void> {
    try {
      // Make internal API call to discover pools
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pools/discover`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.pools) {
        console.log(`🎉 Successfully discovered ${data.data.totalDiscovered} pools`);
        console.log(`⚠️  Found ${data.data.imbalancedCount} pools that need rebalancing`);
      } else {
        console.warn('⚠️  Pool discovery returned no results');
      }
    } catch (error) {
      console.error('❌ Pool discovery failed:', error);
      throw error;
    }
  }

  async forceRediscover(): Promise<{ success: boolean; totalDiscovered: number; error?: string }> {
    try {
      console.log('🔄 Forcing pool rediscovery...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pools/discover`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.pools) {
        console.log(`🎉 Successfully rediscovered ${data.data.totalDiscovered} pools`);
        return {
          success: true,
          totalDiscovered: data.data.totalDiscovered
        };
      } else {
        return {
          success: false,
          totalDiscovered: 0,
          error: 'No pools found'
        };
      }
    } catch (error) {
      console.error('❌ Forced pool rediscovery failed:', error);
      return {
        success: false,
        totalDiscovered: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
  }
}

// Singleton instance
const initializationService = new InitializationService();
export default initializationService;
