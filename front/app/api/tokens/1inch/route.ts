import { NextRequest, NextResponse } from 'next/server';
import { oneInchIntegration, tokenCache } from '@/lib/1inch-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chainId = searchParams.get('chainId');
    const symbol = searchParams.get('symbol');
    const address = searchParams.get('address');
    const query = searchParams.get('query');

    switch (action) {
      case 'chains':
        return await getSupportedChains();
      
      case 'tokens':
        if (chainId) {
          return await getTokensForChain(parseInt(chainId));
        }
        return await getAllTokens();
      
      case 'token-by-symbol':
        if (!symbol) {
          return NextResponse.json({ success: false, error: 'Symbol parameter required' }, { status: 400 });
        }
        return await getTokenBySymbol(symbol, chainId ? parseInt(chainId) : undefined);
      
      case 'token-by-address':
        if (!address) {
          return NextResponse.json({ success: false, error: 'Address parameter required' }, { status: 400 });
        }
        return await getTokenByAddress(address, chainId ? parseInt(chainId) : undefined);
      
      case 'search':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query parameter required' }, { status: 400 });
        }
        return await searchTokens(query, chainId ? parseInt(chainId) : undefined);
      
      case 'verified':
        return await getVerifiedTokens(chainId ? parseInt(chainId) : undefined);
      
      case 'popular':
        return await getPopularTokens(chainId ? parseInt(chainId) : undefined);
      
      case 'price':
        if (!address || !chainId) {
          return NextResponse.json({ success: false, error: 'Address and chainId parameters required' }, { status: 400 });
        }
        return await getTokenPrice(address, parseInt(chainId));
      
      case 'balance':
        const walletAddress = searchParams.get('walletAddress');
        if (!address || !chainId || !walletAddress) {
          return NextResponse.json({ success: false, error: 'Address, chainId, and walletAddress parameters required' }, { status: 400 });
        }
        return await getTokenBalance(address, walletAddress, parseInt(chainId));
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('1inch API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

async function getSupportedChains() {
  try {
    const chains = await oneInchIntegration.getSupportedChains();
    return NextResponse.json({
      success: true,
      data: chains,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error('Failed to fetch supported chains');
  }
}

async function getAllTokens() {
  try {
    const cacheKey = 'all-tokens';
    let tokens = tokenCache.get(cacheKey);
    
    if (!tokens) {
      tokens = await oneInchIntegration.getAllTokens();
      tokenCache.set(cacheKey, tokens);
    }
    
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error('Failed to fetch all tokens');
  }
}

async function getTokensForChain(chainId: number) {
  try {
    const cacheKey = `tokens-${chainId}`;
    let tokens = tokenCache.get(cacheKey);
    
    if (!tokens) {
      tokens = await oneInchIntegration.getTokensForChain(chainId);
      tokenCache.set(cacheKey, tokens);
    }
    
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to fetch tokens for chain ${chainId}`);
  }
}

async function getTokenBySymbol(symbol: string, chainId?: number) {
  try {
    const tokens = await oneInchIntegration.getTokenBySymbol(symbol, chainId);
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      symbol,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to fetch token by symbol ${symbol}`);
  }
}

async function getTokenByAddress(address: string, chainId?: number) {
  try {
    const token = await oneInchIntegration.getTokenByAddress(address, chainId);
    return NextResponse.json({
      success: true,
      data: token,
      address,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to fetch token by address ${address}`);
  }
}

async function searchTokens(query: string, chainId?: number) {
  try {
    const tokens = await oneInchIntegration.searchTokens(query, chainId);
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      query,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to search tokens with query ${query}`);
  }
}

async function getVerifiedTokens(chainId?: number) {
  try {
    const tokens = await oneInchIntegration.getVerifiedTokens(chainId);
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error('Failed to fetch verified tokens');
  }
}

async function getPopularTokens(chainId?: number) {
  try {
    const tokens = await oneInchIntegration.getPopularTokens(chainId);
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error('Failed to fetch popular tokens');
  }
}

async function getTokenPrice(address: string, chainId: number) {
  try {
    const price = await oneInchIntegration.getTokenPrice(address, chainId);
    return NextResponse.json({
      success: true,
      data: { price },
      address,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to fetch price for token ${address}`);
  }
}

async function getTokenBalance(address: string, walletAddress: string, chainId: number) {
  try {
    const balance = await oneInchIntegration.getTokenBalance(address, walletAddress, chainId);
    return NextResponse.json({
      success: true,
      data: { balance },
      address,
      walletAddress,
      chainId,
      timestamp: Date.now()
    });
  } catch (error) {
    throw new Error(`Failed to fetch balance for token ${address}`);
  }
}
