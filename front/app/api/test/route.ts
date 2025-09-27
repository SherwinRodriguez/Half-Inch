import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API endpoints are working correctly!',
    timestamp: Date.now(),
    endpoints: [
      'POST /api/system/initialize',
      'GET /api/pools/discover',
      'GET /api/pools/status',
      'GET /api/pools/[address]/metrics',
      'POST /api/rebalance/[address]/estimate',
      'POST /api/rebalance/[address]/execute',
      'GET /api/rebalance/status/[txHash]'
    ]
  });
}
