import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const chainId = searchParams.get('chainId') || '1';
    const limit = searchParams.get('limit') || '20';
    const onlyPositiveRating = searchParams.get('onlyPositiveRating') || 'false';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters long'
      }, { status: 400 });
    }

    // Get 1inch API key from environment
    const apiKey = process.env.ONE_INCH_API_KEY;
    if (!apiKey) {
      console.warn('ONE_INCH_API_KEY not found, using mock data');
      return getMockSearchResults(query, chainId, limit);
    }

    try {
      const response = await fetch(
        `https://api.1inch.dev/token/v1.4/${chainId}/search?query=${encodeURIComponent(query)}&only_positive_rating=${onlyPositiveRating}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`1inch API error: ${response.status} ${response.statusText}`);
        return getMockSearchResults(query, chainId, limit);
      }

      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        data: {
          tokens: data.tokens || [],
          total: data.tokens?.length || 0,
          query,
          chainId,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });

    } catch (apiError) {
      console.error('1inch API request failed:', apiError);
      return getMockSearchResults(query, chainId, limit);
    }

  } catch (error) {
    console.error('Token search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search tokens'
    }, { status: 500 });
  }
}

// Mock search results for when 1inch API is not available
async function getMockSearchResults(query: string, chainId: string, limit: string) {
  const mockTokens = generateMockTokens(query, chainId, parseInt(limit));
  
  return NextResponse.json({
    success: true,
    data: {
      tokens: mockTokens,
      total: mockTokens.length,
      query,
      chainId,
      timestamp: Date.now(),
      source: 'mock'
    },
    timestamp: Date.now()
  });
}

function generateMockTokens(query: string, chainId: string, limit: number) {
  const commonTokens = [
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6c0B2C0', verified: true },
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', verified: true },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', verified: true },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', verified: true },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', verified: true },
    { symbol: 'LINK', name: 'Chainlink Token', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', verified: true },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', verified: true },
    { symbol: 'AAVE', name: 'Aave Token', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', verified: true },
    { symbol: 'COMP', name: 'Compound', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', verified: true },
    { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', verified: true },
  ];

  // Filter tokens based on query
  const filteredTokens = commonTokens.filter(token => 
    token.symbol.toLowerCase().includes(query.toLowerCase()) ||
    token.name.toLowerCase().includes(query.toLowerCase())
  );

  // Add some dynamic tokens based on query
  const dynamicTokens = [];
  for (let i = 0; i < Math.min(3, limit - filteredTokens.length); i++) {
    const queryUpper = query.toUpperCase();
    dynamicTokens.push({
      symbol: `${queryUpper}${i + 1}`,
      name: `${query} Token ${i + 1}`,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      verified: false
    });
  }

  return [...filteredTokens, ...dynamicTokens].slice(0, limit).map(token => ({
    ...token,
    chainId: parseInt(chainId),
    decimals: 18,
    logoURI: `https://tokens.1inch.io/${token.address}.png`,
    tags: token.verified ? ['verified'] : []
  }));
}
