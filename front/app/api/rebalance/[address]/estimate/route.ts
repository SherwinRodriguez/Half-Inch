import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES, calculatePriceImpact } from '@/lib/contracts';
import database from '@/lib/database';
import { RebalanceEstimate, ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { targetRatio, rpcUrl, slippageTolerance = 0.5 } = await request.json();
    
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
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined);
    const pairContract = await contractService.getPairContract(address);
    const rebalancerContract = await contractService.getRebalancerContract();
    
    // Get current reserves
    const [reserve0, reserve1] = await Promise.all([
      pairContract.reserve0(),
      pairContract.reserve1()
    ]);
    
    const currentRatio = parseFloat(contractService.formatUnits(reserve0)) / 
                        parseFloat(contractService.formatUnits(reserve1));
    
    const finalTargetRatio = targetRatio || pool.targetRatio;
    
    // Calculate required swap amounts
    let swapAmount0 = '0';
    let swapAmount1 = '0';
    let route: string[] = [pool.tokenA.address, pool.tokenB.address];
    
    if (Math.abs(currentRatio - finalTargetRatio) > 0.001) { // Only if significant imbalance
      if (currentRatio > finalTargetRatio) {
        // Need to sell token0 for token1
        const excessRatio = currentRatio - finalTargetRatio;
        const reserve0Float = parseFloat(contractService.formatUnits(reserve0));
        swapAmount0 = contractService.parseUnits((excessRatio * reserve0Float * 0.5).toString()).toString();
        route = [pool.tokenA.address, pool.tokenB.address];
      } else {
        // Need to sell token1 for token0
        const deficitRatio = finalTargetRatio - currentRatio;
        const reserve1Float = parseFloat(contractService.formatUnits(reserve1));
        swapAmount1 = contractService.parseUnits((deficitRatio * reserve1Float * 0.5).toString()).toString();
        route = [pool.tokenB.address, pool.tokenA.address];
      }
    }
    
    // Estimate gas costs
    let estimatedGas = '0';
    try {
      if (swapAmount0 !== '0' || swapAmount1 !== '0') {
        const gasEstimate = await contractService.estimateGas(
          rebalancerContract,
          'rebalance',
          [address, Math.floor(finalTargetRatio * 10000)] // Convert to basis points
        );
        estimatedGas = gasEstimate.toString();
      }
    } catch (error) {
      console.warn('Gas estimation failed:', error);
      estimatedGas = '200000'; // Default gas estimate
    }
    
    // Get current gas price
    const gasPrice = await contractService.getGasPrice();
    const estimatedCost = contractService.formatUnits(
      BigInt(estimatedGas) * gasPrice
    );
    
    // Calculate slippage impact
    const swapAmountIn = swapAmount0 !== '0' ? swapAmount0 : swapAmount1;
    const reserveIn = swapAmount0 !== '0' ? reserve0.toString() : reserve1.toString();
    const reserveOut = swapAmount0 !== '0' ? reserve1.toString() : reserve0.toString();
    
    const priceImpact = swapAmountIn !== '0' ? 
      calculatePriceImpact(
        contractService.formatUnits(swapAmountIn),
        contractService.formatUnits(reserveIn),
        contractService.formatUnits(reserveOut)
      ) : 0;
    
    // Calculate minimum received with slippage
    const slippageMultiplier = (100 - slippageTolerance) / 100;
    const expectedOut = swapAmountIn !== '0' ? 
      (BigInt(swapAmountIn) * BigInt(reserveOut)) / (BigInt(reserveIn) + BigInt(swapAmountIn)) : 
      BigInt(0);
    const minimumReceived = contractService.formatUnits(
      BigInt(Math.floor(Number(expectedOut) * slippageMultiplier))
    );
    
    const estimate: RebalanceEstimate = {
      poolAddress: address,
      currentRatio,
      targetRatio: finalTargetRatio,
      swapAmount0,
      swapAmount1,
      estimatedGas,
      gasPrice: gasPrice.toString(),
      estimatedCost,
      slippageImpact: slippageTolerance,
      priceImpact,
      minimumReceived,
      route
    };
    
    const response: ApiResponse<RebalanceEstimate> = {
      success: true,
      data: estimate,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Rebalance estimation error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const targetRatio = parseFloat(searchParams.get('targetRatio') || '0');
    
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
    
    // Quick estimate without blockchain calls
    const finalTargetRatio = targetRatio || pool.targetRatio;
    const currentRatio = pool.currentRatio;
    
    const quickEstimate = {
      poolAddress: address,
      currentRatio,
      targetRatio: finalTargetRatio,
      isRebalanceNeeded: Math.abs(currentRatio - finalTargetRatio) > 0.01,
      estimatedImpact: Math.abs(currentRatio - finalTargetRatio) / currentRatio * 100,
      canRebalance: true // Would check cooldown period in real implementation
    };
    
    const response: ApiResponse<typeof quickEstimate> = {
      success: true,
      data: quickEstimate,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Quick rebalance estimate error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
