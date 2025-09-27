import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ADDRESSES } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    config: {
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'Not configured',
      networkId: 31,
      contractAddresses: DEFAULT_ADDRESSES,
      hasEnvFile: !!process.env.NEXT_PUBLIC_RPC_URL,
    },
    timestamp: Date.now(),
  });
}
