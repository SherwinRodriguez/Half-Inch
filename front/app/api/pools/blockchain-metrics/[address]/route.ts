import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import { Pool, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as '1h' | '24h' | '7d' | '30d' || '24h';
    
    console.log(`🔍 Fetching metrics for pool ${address} from blockchain...`);
    
    // Get RPC URL from environment or use default
    const rpcUrl = 'https://public-node.testnet.rsk.co';
    const contractService = new ContractService(rpcUrl);
    
    // Get pair contract
    const pairContract = await contractService.getPairContract(address);
    
    // Get current reserves and token info
    const [reserve0, reserve1, totalSupply, token0Address, token1Address] = await Promise.all([
      pairContract.reserve0(),
      pairContract.reserve1(),
      pairContract.totalSupply(),
      pairContract.token0(),
      pairContract.token1()
    ]);
    
    // Get token symbols
    const token0Contract = await contractService.getERC20Contract(token0Address);
    const token1Contract = await contractService.getERC20Contract(token1Address);
    
    let token0Symbol, token1Symbol;
    try {
      token0Symbol = await token0Contract.symbol().catch(() => `Token0_${token0Address.slice(0, 8)}`);
    } catch (error) {
      token0Symbol = `Token0_${token0Address.slice(0, 8)}`;
    }
    
    try {
      token1Symbol = await token1Contract.symbol().catch(() => `Token1_${token1Address.slice(0, 8)}`);
    } catch (error) {
      token1Symbol = `Token1_${token1Address.slice(0, 8)}`;
    }
    
    // Calculate current metrics
    const reserve0Float = parseFloat(contractService.formatUnits(reserve0));
    const reserve1Float = parseFloat(contractService.formatUnits(reserve1));
    const ratio = reserve1Float > 0 ? reserve0Float / reserve1Float : 0;
    const tvl = reserve0Float + reserve1Float;
    const targetRatio = 1.0;
    const isImbalanced = Math.abs(ratio - targetRatio) > 0.1;
    
    const pool: Pool = {
      address,
      tokenA: {
        address: token0Address,
        symbol: token0Symbol
      },
      tokenB: {
        address: token1Address,
        symbol: token1Symbol
      },
      reserveA: reserve0.toString(),
      reserveB: reserve1.toString(),
      totalSupply: totalSupply.toString(),
      currentRatio: ratio,
      targetRatio,
      needsRebalancing: isImbalanced,
      isActive: true,
      lastRebalance: null,
      rebalanceCount: 0,
      createdAt: Date.now(),
      tvl,
      volume24h: null,
      fees24h: 0,
      apy: null
    };
    
    // Generate mock historical data for demonstration
    const now = Date.now();
    const historicalData = [];
    const rebalanceHistory = [];
    
    // Create some sample historical data points
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // Every hour for 24 hours
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      const historicalRatio = ratio + variance;
      const historicalTVL = tvl * (1 + variance * 0.1);
      
      historicalData.push({
        timestamp,
        ratio: historicalRatio,
        tvl: historicalTVL,
        volume: 0,
        fees: 0
      });
    }
    
    // Mock rebalance history
    rebalanceHistory.push({
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: now - (12 * 60 * 60 * 1000), // 12 hours ago
      poolAddress: address,
      fromRatio: 0.8,
      toRatio: 1.0,
      targetRatio: 1.0,
      gasUsed: '150000',
      gasPrice: '20000000000',
      status: 'confirmed' as const,
      swapAmount0: '1000000000000000000',
      swapAmount1: '0',
      slippage: 0.5
    });
    
    const metrics = {
      address,
      historicalData,
      rebalanceHistory,
      performance: {
        totalRebalances: rebalanceHistory.length,
        avgTimeBetweenRebalances: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        totalVolume: 0,
        totalFees: 0,
        impermanentLoss: 0
      }
    };
    
    // Filter data based on timeframe
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
    
    const responseData = {
      pool,
      metrics: {
        ...metrics,
        historicalData: filteredHistoricalData,
        rebalanceHistory: filteredRebalanceHistory
      },
      timeframe
    };
    
    console.log(`✅ Pool metrics fetched for ${token0Symbol}/${token1Symbol}`);
    
    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Blockchain pool metrics error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
