import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromTokenAddress = searchParams.get('fromTokenAddress');
    const toTokenAddress = searchParams.get('toTokenAddress');
    const amount = searchParams.get('amount');
    const chainId = searchParams.get('chainId') || '31'; // Default to Rootstock Testnet

    if (!fromTokenAddress || !toTokenAddress || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: fromTokenAddress, toTokenAddress, amount'
      }, { status: 400 });
    }

    // For Rootstock Testnet, we'll simulate quotes since 1inch doesn't support it yet
    // In production, you would integrate with actual DEX aggregators or use your own liquidity
    
    if (chainId === '31') {
      // Simulate a quote for Rootstock Testnet
      const mockQuote = await generateMockQuote(fromTokenAddress, toTokenAddress, amount);
      return NextResponse.json({
        success: true,
        data: mockQuote,
        timestamp: Date.now()
      });
    }

    // For other chains, integrate with 1inch API
    const oneInchQuote = await getOneInchQuote(fromTokenAddress, toTokenAddress, amount, chainId);
    
    return NextResponse.json({
      success: true,
      data: oneInchQuote,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Swap quote error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap quote'
    }, { status: 500 });
  }
}

async function generateMockQuote(fromTokenAddress: string, toTokenAddress: string, amount: string) {
  // Mock quote generation for Rootstock Testnet
  // In a real implementation, this would query your DEX contracts
  
  const fromAmount = parseFloat(amount);
  const toAmount = fromAmount * 0.95; // Simulate 5% slippage
  
  // Mock token info
  const fromToken = {
    address: fromTokenAddress,
    symbol: fromTokenAddress === '0x0000000000000000000000000000000000000000' ? 'RBTC' : 'TOKEN',
    decimals: 18
  };
  
  const toToken = {
    address: toTokenAddress,
    symbol: 'TOKEN',
    decimals: 18
  };

  return {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount: toAmount.toString(),
    priceImpact: 0.5,
    estimatedGas: '21000',
    slippage: 0.5,
    route: [
      {
        name: 'Mock DEX',
        percent: 100,
        swaps: [
          {
            fromToken,
            toToken,
            amount: amount,
            amountOut: toAmount.toString()
          }
        ]
      }
    ]
  };
}

async function getOneInchQuote(fromTokenAddress: string, toTokenAddress: string, amount: string, chainId: string) {
  try {
    const response = await fetch(
      `https://api.1inch.io/v5.2/${chainId}/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      fromToken: {
        address: data.fromToken.address,
        symbol: data.fromToken.symbol,
        decimals: data.fromToken.decimals
      },
      toToken: {
        address: data.toToken.address,
        symbol: data.toToken.symbol,
        decimals: data.toToken.decimals
      },
      fromAmount: data.fromAmount,
      toAmount: data.toAmount,
      priceImpact: parseFloat(data.estimatedGas) / 1000000, // Rough estimate
      estimatedGas: data.estimatedGas,
      slippage: 0.5,
      route: data.protocols || []
    };
  } catch (error) {
    console.error('1inch quote error:', error);
    // Fallback to mock quote
    return generateMockQuote(fromTokenAddress, toTokenAddress, amount);
  }
}
