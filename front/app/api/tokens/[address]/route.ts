import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/lib/contracts';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const rpcUrl = searchParams.get('rpcUrl');
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined);
    
    try {
      const tokenContract = await contractService.getERC20Contract(address);
      
      // Get token information
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name().catch(() => 'Unknown Token'),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18),
        tokenContract.totalSupply().catch(() => BigInt(0))
      ]);
      
      const tokenInfo = {
        address,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        isValid: true
      };
      
      const response: ApiResponse<typeof tokenInfo> = {
        success: true,
        data: tokenInfo,
        timestamp: Date.now()
      };
      
      return NextResponse.json(response);
      
    } catch (contractError) {
      // Token contract doesn't exist or is invalid
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid token address or contract not found',
        timestamp: Date.now()
      };
      
      return NextResponse.json(response, { status: 404 });
    }
    
  } catch (error) {
    console.error('Token info error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
