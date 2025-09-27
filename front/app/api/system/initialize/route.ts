import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import database from '@/lib/database';
import { SystemStatus, ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { privateKey, rpcUrl, contractAddresses } = await request.json();
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl, privateKey);
    
    // Update contract addresses if provided
    const addresses = { ...DEFAULT_ADDRESSES, ...contractAddresses };
    
    // Deploy and register all contracts
    const factoryContract = await contractService.getFactoryContract(addresses.factory);
    const rebalancerContract = await contractService.getRebalancerContract(addresses.rebalancerController);
    
    // Verify contracts are deployed
    try {
      const factoryCode = await contractService.getProvider().getCode(addresses.factory);
      const rebalancerCode = await contractService.getProvider().getCode(addresses.rebalancerController);
      
      if (factoryCode === '0x' || rebalancerCode === '0x') {
        throw new Error('Contracts not deployed at provided addresses');
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify contract deployment',
        timestamp: Date.now()
      } as ApiResponse<null>, { status: 400 });
    }
    
    // Set up event listeners
    const blockNumber = await contractService.getBlockNumber();
    
    // Listen for PairCreated events
    factoryContract.on('PairCreated', async (token0, token1, pair, pairIndex) => {
      console.log(`New pair created: ${pair} for tokens ${token0}/${token1}`);
      
      try {
        // Get token information
        const token0Contract = await contractService.getERC20Contract(token0);
        const token1Contract = await contractService.getERC20Contract(token1);
        const pairContract = await contractService.getPairContract(pair);
        
        const [token0Symbol, token1Symbol, reserve0, reserve1, totalSupply] = await Promise.all([
          token0Contract.symbol(),
          token1Contract.symbol(),
          pairContract.reserve0(),
          pairContract.reserve1(),
          pairContract.totalSupply()
        ]);
        
        // Add pool to database
        const pool = {
          address: pair,
          tokenA: {
            address: token0,
            symbol: token0Symbol
          },
          tokenB: {
            address: token1,
            symbol: token1Symbol
          },
          reserveA: reserve0.toString(),
          reserveB: reserve1.toString(),
          totalSupply: totalSupply.toString(),
          currentRatio: parseFloat(contractService.formatUnits(reserve0)) / parseFloat(contractService.formatUnits(reserve1)),
          targetRatio: 1.0, // Default target ratio
          needsRebalancing: false,
          isActive: true,
          lastRebalance: 0,
          rebalanceCount: 0,
          createdAt: Date.now(),
          tvl: 0,
          volume24h: 0,
          fees24h: 0,
          apy: 0
        };
        
        database.addPool(pool);
        
        // Initialize pool metrics
        database.addPoolMetrics({
          address: pair,
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
        
      } catch (error) {
        console.error('Error processing PairCreated event:', error);
      }
    });
    
    // Listen for Rebalance events
    rebalancerContract.on('Rebalance', async (pair, oldRatio, newRatio, targetRatio, event) => {
      console.log(`Rebalance event for pair ${pair}: ${oldRatio} -> ${newRatio} (target: ${targetRatio})`);
      
      const rebalanceEvent = {
        txHash: event.transactionHash,
        timestamp: Date.now(),
        poolAddress: pair,
        fromRatio: parseFloat(contractService.formatUnits(oldRatio, 4)) / 10000,
        toRatio: parseFloat(contractService.formatUnits(newRatio, 4)) / 10000,
        targetRatio: parseFloat(contractService.formatUnits(targetRatio, 4)) / 10000,
        gasUsed: '0',
        gasPrice: '0',
        status: 'confirmed' as const,
        swapAmount0: '0',
        swapAmount1: '0',
        slippage: 0
      };
      
      database.addRebalanceEvent(rebalanceEvent);
    });
    
    // Initialize pool monitoring
    const allPairsLength = await factoryContract.allPairsLength();
    console.log(`Found ${allPairsLength} existing pairs`);
    
    // Store system status
    const systemStatus: SystemStatus = {
      isInitialized: true,
      contractsDeployed: true,
      eventListenersActive: true,
      totalPools: Number(allPairsLength),
      activeRebalances: 0,
      lastUpdate: Date.now(),
      networkId: 31, // Rootstock testnet
      blockNumber
    };
    
    const response: ApiResponse<SystemStatus> = {
      success: true,
      data: systemStatus,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('System initialization error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current system status
    const stats = database.getDashboardStats();
    
    const systemStatus: SystemStatus = {
      isInitialized: true,
      contractsDeployed: true,
      eventListenersActive: true,
      totalPools: stats.activePools,
      activeRebalances: stats.imbalancedPools,
      lastUpdate: Date.now(),
      networkId: 31,
      blockNumber: 0 // Would need to fetch from provider
    };
    
    const response: ApiResponse<SystemStatus> = {
      success: true,
      data: systemStatus,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get system status error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
