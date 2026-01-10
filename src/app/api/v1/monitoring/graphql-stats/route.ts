import { NextRequest, NextResponse } from 'next/server';
import { getQueryStats, isApproachingRateLimit } from '@/lib/hasura-monitor';

/**
 * GET /api/v1/monitoring/graphql-stats
 * 
 * Returns GraphQL query statistics for monitoring and debugging
 * Only available in development mode for security
 */
export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Stats endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const stats = getQueryStats();
    const approachingLimit = isApproachingRateLimit();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        approachingRateLimit: approachingLimit,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('GraphQL Stats API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
