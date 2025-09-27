import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const targetRatio = parseFloat(searchParams.get('targetRatio') || '1.0');
    
    console.log(`🔍 Estimating rebalance for pool ${address} with target ratio ${targetRatio}`);
    
    // Get RPC URL from environment or use default
    const rpcUrl = 'https://public-node.testnet.rsk.co';
    const contractService = new ContractService(rpcUrl);
    
    // Get pair contract
    const pairContract = await contractService.getPairContract(address);
    
    // Get current reserves
    const [reserve0, reserve1] = await Promise.all([
      pairContract.reserve0(),
      pairContract.reserve1()
    ]);
    
    const reserve0Float = parseFloat(contractService.formatUnits(reserve0));
    const reserve1Float = parseFloat(contractService.formatUnits(reserve1));
    const currentRatio = reserve0Float / reserve1Float;
    
    // Get token information
    const [token0Address, token1Address] = await Promise.all([
      pairContract.token0(),
      pairContract.token1()
    ]);
    
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
    
    // Calculate rebalance requirements
    const ratioDifference = Math.abs(currentRatio - targetRatio);
    const isRebalanceNeeded = ratioDifference > 0.01; // 1% threshold
    
    let swapAmount0 = '0';
    let swapAmount1 = '0';
    let swapDirection = '';
    
    if (currentRatio > targetRatio) {
      // Need to sell token0 for token1
      const excessRatio = currentRatio - targetRatio;
      const swapAmount = excessRatio * reserve0Float * 0.5;
      swapAmount0 = swapAmount > 0 ? contractService.parseUnits(swapAmount.toFixed(18)).toString() : '0';
      swapDirection = `Sell ${token0Symbol} for ${token1Symbol}`;
    } else if (currentRatio < targetRatio) {
      // Need to sell token1 for token0
      const deficitRatio = targetRatio - currentRatio;
      const swapAmount = deficitRatio * reserve1Float * 0.5;
      swapAmount1 = swapAmount > 0 ? contractService.parseUnits(swapAmount.toFixed(18)).toString() : '0';
      swapDirection = `Sell ${token1Symbol} for ${token0Symbol}`;
    }
    
    // Estimate gas costs
    let estimatedGas = '200000'; // Default estimate
    let estimatedCost = '0.001'; // Default cost estimate
    
    try {
      const gasPrice = await contractService.getGasPrice();
      const gasPriceFloat = parseFloat(contractService.formatUnits(gasPrice));
      estimatedCost = (parseInt(estimatedGas) * gasPriceFloat).toFixed(6);
    } catch (error) {
      console.warn('Gas price estimation failed:', error);
    }
    
    // Calculate price impact
    const swapAmountIn = swapAmount0 !== '0' ? swapAmount0 : swapAmount1;
    const reserveIn = swapAmount0 !== '0' ? reserve0 : reserve1;
    
    let priceImpact = 0;
    if (swapAmountIn !== '0' && reserveIn.toString() !== '0') {
      try {
        const swapAmountFloat = parseFloat(contractService.formatUnits(swapAmountIn));
        const reserveInFloat = parseFloat(contractService.formatUnits(reserveIn));
        priceImpact = reserveInFloat > 0 ? (swapAmountFloat / reserveInFloat) * 100 : 0;
      } catch (error) {
        console.warn('Price impact calculation failed:', error);
        priceImpact = 0;
      }
    }
    
    const estimate = {
      poolAddress: address,
      tokenA: {
        address: token0Address,
        symbol: token0Symbol
      },
      tokenB: {
        address: token1Address,
        symbol: token1Symbol
      },
      currentRatio,
      targetRatio,
      isRebalanceNeeded,
      ratioDifference,
      swapAmount0,
      swapAmount1,
      swapDirection,
      estimatedGas,
      estimatedCost,
      priceImpact,
      canRebalance: isRebalanceNeeded && priceImpact < 5, // 5% max price impact
      currentTVL: reserve0Float + reserve1Float,
      reserveA: reserve0Float,
      reserveB: reserve1Float
    };
    
    console.log(`✅ Rebalance estimate completed for ${token0Symbol}/${token1Symbol}`);
    
    const response: ApiResponse<typeof estimate> = {
      success: true,
      data: estimate,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Blockchain rebalance estimate error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
