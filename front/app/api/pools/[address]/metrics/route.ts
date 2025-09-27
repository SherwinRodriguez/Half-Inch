import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { PoolMetrics, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as '1h' | '24h' | '7d' | '30d' || '24h';
    const includeAnalytics = searchParams.get('analytics') === 'true';
    
    // Get pool data
    const pool = database.getPool(address);
    if (!pool) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    // Get pool metrics
    const metrics = database.getPoolMetrics(address);
    if (!metrics) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool metrics not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    // Filter historical data based on timeframe
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
    
    const filteredHistoricalData = metrics.historicalData.filter(
      data => data.timestamp >= startTime
    );
    
    const filteredRebalanceHistory = metrics.rebalanceHistory.filter(
      event => event.timestamp >= startTime
    );
    
    // Prepare response data
    const responseData = {
      pool,
      metrics: {
        ...metrics,
        historicalData: filteredHistoricalData,
        rebalanceHistory: filteredRebalanceHistory
      },
      timeframe,
      analytics: includeAnalytics ? database.getPoolAnalytics(address, timeframe) : undefined
    };
    
    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get pool metrics error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { action, data } = await request.json();
    
    const pool = database.getPool(address);
    if (!pool) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool not found',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    switch (action) {
      case 'update_target_ratio':
        const { targetRatio } = data;
        if (typeof targetRatio !== 'number' || targetRatio <= 0) {
          throw new Error('Invalid target ratio');
        }
        
        database.updatePool(address, { targetRatio });
        
        const updateResponse: ApiResponse<{ targetRatio: number }> = {
          success: true,
          data: { targetRatio },
          timestamp: Date.now()
        };
        
        return NextResponse.json(updateResponse);
        
      case 'add_historical_data':
        const { historicalData } = data;
        if (!historicalData || typeof historicalData !== 'object') {
          throw new Error('Invalid historical data');
        }
        
        database.addHistoricalData(address, {
          timestamp: Date.now(),
          ...historicalData
        });
        
        const addResponse: ApiResponse<{ added: boolean }> = {
          success: true,
          data: { added: true },
          timestamp: Date.now()
        };
        
        return NextResponse.json(addResponse);
        
      case 'reset_metrics':
        // Reset pool metrics
        database.addPoolMetrics({
          address,
          historicalData: [],
          rebalanceHistory: [],
          performance: {
            totalRebalances: 0,
            avgTimeBetweenRebalances: 0,
            totalVolume: 0,
            totalFees: 0,
            impermanentLoss: 0
          }
        });
        
        const resetResponse: ApiResponse<{ reset: boolean }> = {
          success: true,
          data: { reset: true },
          timestamp: Date.now()
        };
        
        return NextResponse.json(resetResponse);
        
      default:
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    console.error('Update pool metrics error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 400 });
  }
}
