import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const poolAddress = searchParams.get('pool');
    
    // Get rebalance events
    let events = database.getRebalanceEvents(poolAddress);
    
    // Sort by timestamp (newest first)
    events = events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (limit > 0) {
      events = events.slice(0, limit);
    }
    
    const response: ApiResponse<typeof events> = {
      success: true,
      data: events,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get rebalance activity error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
