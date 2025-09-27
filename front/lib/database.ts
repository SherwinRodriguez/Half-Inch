import { Pool, PoolMetrics, RebalanceEvent, DashboardStats } from './types';

// In-memory database for storing pool data and metrics
class InMemoryDatabase {
  private pools: Map<string, Pool> = new Map();
  private poolMetrics: Map<string, PoolMetrics> = new Map();
  private rebalanceEvents: RebalanceEvent[] = [];
  private dashboardStats: DashboardStats = {
    totalPools: 0,
    totalTVL: 0,
    totalVolume24h: 0,
    averageAPY: 0,
    activePools: 0,
    imbalancedPools: 0,
  };

  // Pool operations
  addPool(pool: Pool): void {
    this.pools.set(pool.address, pool);
    this.updateDashboardStats();
  }

  getPool(address: string): Pool | undefined {
    return this.pools.get(address);
  }

  getAllPools(): Pool[] {
    return Array.from(this.pools.values());
  }

  updatePool(address: string, updates: Partial<Pool>): void {
    const pool = this.pools.get(address);
    if (pool) {
      this.pools.set(address, { ...pool, ...updates });
      this.updateDashboardStats();
    }
  }

  removePool(address: string): void {
    this.pools.delete(address);
    this.poolMetrics.delete(address);
    this.updateDashboardStats();
  }

  // Pool metrics operations
  addPoolMetrics(metrics: PoolMetrics): void {
    this.poolMetrics.set(metrics.address, metrics);
  }

  getPoolMetrics(address: string): PoolMetrics | undefined {
    return this.poolMetrics.get(address);
  }

  updatePoolMetrics(address: string, updates: Partial<PoolMetrics>): void {
    const metrics = this.poolMetrics.get(address);
    if (metrics) {
      this.poolMetrics.set(address, { ...metrics, ...updates });
    }
  }

  addHistoricalData(address: string, data: {
    timestamp: number;
    ratio: number;
    tvl: number;
    volume: number;
    fees: number;
  }): void {
    const metrics = this.poolMetrics.get(address);
    if (metrics) {
      metrics.historicalData.push(data);
      // Keep only last 1000 data points
      if (metrics.historicalData.length > 1000) {
        metrics.historicalData = metrics.historicalData.slice(-1000);
      }
      this.poolMetrics.set(address, metrics);
    }
  }

  // Rebalance events operations
  addRebalanceEvent(event: RebalanceEvent): void {
    this.rebalanceEvents.push(event);
    
    // Update pool metrics
    const metrics = this.poolMetrics.get(event.poolAddress);
    if (metrics) {
      metrics.rebalanceHistory.push(event);
      metrics.performance.totalRebalances++;
      this.poolMetrics.set(event.poolAddress, metrics);
    }
    
    this.updateDashboardStats();
  }

  getRebalanceEvent(txHash: string): RebalanceEvent | undefined {
    return this.rebalanceEvents.find(event => event.txHash === txHash);
  }

  getRebalanceEvents(poolAddress?: string): RebalanceEvent[] {
    if (poolAddress) {
      return this.rebalanceEvents.filter(event => event.poolAddress === poolAddress);
    }
    return [...this.rebalanceEvents];
  }

  updateRebalanceEvent(txHash: string, updates: Partial<RebalanceEvent>): void {
    const index = this.rebalanceEvents.findIndex(event => event.txHash === txHash);
    if (index !== -1) {
      this.rebalanceEvents[index] = { ...this.rebalanceEvents[index], ...updates };
      
      // Update pool metrics as well
      const event = this.rebalanceEvents[index];
      const metrics = this.poolMetrics.get(event.poolAddress);
      if (metrics) {
        const historyIndex = metrics.rebalanceHistory.findIndex(h => h.txHash === txHash);
        if (historyIndex !== -1) {
          metrics.rebalanceHistory[historyIndex] = event;
          this.poolMetrics.set(event.poolAddress, metrics);
        }
      }
    }
  }

  // Dashboard stats operations
  getDashboardStats(): DashboardStats {
    return { ...this.dashboardStats };
  }

  private updateDashboardStats(): void {
    const pools = this.getAllPools();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    this.dashboardStats = {
      totalPools: pools.length,
      totalTVL: pools.reduce((sum, pool) => sum + pool.tvl, 0),
      totalVolume24h: pools.reduce((sum, pool) => sum + (pool.volume24h || 0), 0),
      averageAPY: pools.length > 0 ? pools.reduce((sum, pool) => sum + (pool.apy || 0), 0) / pools.length : 0,
      activePools: pools.filter(pool => pool.isActive).length,
      imbalancedPools: pools.filter(pool => pool.needsRebalancing).length,
    };
  }

  // Search and filter operations
  searchPools(query: string): Pool[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPools().filter(pool => 
      pool.address.toLowerCase().includes(lowerQuery) ||
      pool.tokenA.symbol.toLowerCase().includes(lowerQuery) ||
      pool.tokenB.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  getImbalancedPools(): Pool[] {
    return this.getAllPools().filter(pool => pool.needsRebalancing);
  }

  getPoolsByTVL(limit: number = 10): Pool[] {
    return this.getAllPools()
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  }

  getPoolsByVolume(limit: number = 10): Pool[] {
    return this.getAllPools()
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, limit);
  }

  // Analytics operations
  getPoolAnalytics(address: string, timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): any {
    const metrics = this.poolMetrics.get(address);
    if (!metrics) return null;

    const now = Date.now();
    let startTime: number;
    
    switch (timeframe) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (24 * 60 * 60 * 1000);
    }

    const filteredData = metrics.historicalData.filter(data => data.timestamp >= startTime);
    
    if (filteredData.length === 0) return null;

    const latest = filteredData[filteredData.length - 1];
    const earliest = filteredData[0];

    return {
      timeframe,
      dataPoints: filteredData.length,
      tvlChange: latest.tvl - earliest.tvl,
      tvlChangePercent: earliest.tvl > 0 ? ((latest.tvl - earliest.tvl) / earliest.tvl) * 100 : 0,
      volumeTotal: filteredData.reduce((sum, data) => sum + data.volume, 0),
      feesTotal: filteredData.reduce((sum, data) => sum + data.fees, 0),
      ratioVolatility: this.calculateVolatility(filteredData.map(d => d.ratio)),
      rebalanceCount: metrics.rebalanceHistory.filter(r => r.timestamp >= startTime).length,
    };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Data persistence (for future implementation with real database)
  exportData(): string {
    return JSON.stringify({
      pools: Array.from(this.pools.entries()),
      poolMetrics: Array.from(this.poolMetrics.entries()),
      rebalanceEvents: this.rebalanceEvents,
      dashboardStats: this.dashboardStats,
      timestamp: Date.now(),
    });
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      this.pools = new Map(parsed.pools);
      this.poolMetrics = new Map(parsed.poolMetrics);
      this.rebalanceEvents = parsed.rebalanceEvents || [];
      this.dashboardStats = parsed.dashboardStats || this.dashboardStats;
      
      console.log('Database data imported successfully');
    } catch (error) {
      console.error('Failed to import database data:', error);
    }
  }

  // Clear all data
  clear(): void {
    this.pools.clear();
    this.poolMetrics.clear();
    this.rebalanceEvents = [];
    this.dashboardStats = {
      totalTVL: 0,
      totalVolume24h: 0,
      averageAPY: 0,
      totalPools: 0,
      activePools: 0,
      imbalancedPools: 0
    };
  }
}

// Singleton instance
const database = new InMemoryDatabase();
export { database };
export default database;
