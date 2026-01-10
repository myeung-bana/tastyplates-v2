// Hasura Query Monitoring and Performance Tracking
// Helps identify slow queries and track usage for free tier optimization

import { hasuraQuery, GraphQLResponse } from '@/app/graphql/hasura-server-client';

interface QueryMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

// In-memory metrics storage (resets on server restart)
const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 queries
let totalQueries = 0;

/**
 * Monitored Hasura Query
 * Wraps hasuraQuery with performance tracking and logging
 */
export async function monitoredHasuraQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse<T>> {
  const startTime = Date.now();
  const operation = operationName || extractOperationName(query) || 'unknown';
  
  try {
    const result = await hasuraQuery<T>(query, variables);
    const duration = Date.now() - startTime;
    
    // Track metrics
    trackQuery({
      operation,
      duration,
      timestamp: Date.now(),
      success: !result.errors || result.errors.length === 0,
      error: result.errors?.[0]?.message,
    });
    
    // Log slow queries (>1 second)
    if (duration > 1000) {
      console.warn(`⚠️  SLOW QUERY (${duration}ms): ${operation}`, {
        variables: JSON.stringify(variables || {}).slice(0, 200),
        hasErrors: !!result.errors,
      });
    }
    
    // Log query count milestones
    if (totalQueries % 100 === 0 && totalQueries > 0) {
      console.log(`📊 Hasura queries this session: ${totalQueries}`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Track failed query
    trackQuery({
      operation,
      duration,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    console.error(`❌ Hasura query failed: ${operation}`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : error,
    });
    
    throw error;
  }
}

/**
 * Track query metrics
 */
function trackQuery(metric: QueryMetrics): void {
  totalQueries++;
  
  queryMetrics.push(metric);
  
  // Keep only last MAX_METRICS
  if (queryMetrics.length > MAX_METRICS) {
    queryMetrics.shift();
  }
}

/**
 * Extract operation name from GraphQL query string
 */
function extractOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Get query statistics
 * Useful for debugging and monitoring
 */
export function getQueryStats() {
  if (queryMetrics.length === 0) {
    return {
      total: totalQueries,
      recent: 0,
      avgDuration: 0,
      slowQueries: [],
      errorRate: 0,
    };
  }
  
  const recentMetrics = queryMetrics.slice(-100); // Last 100 queries
  const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
  const avgDuration = Math.round(totalDuration / recentMetrics.length);
  const errors = recentMetrics.filter(m => !m.success).length;
  const errorRate = ((errors / recentMetrics.length) * 100).toFixed(2);
  
  const slowQueries = queryMetrics
    .filter(m => m.duration > 1000)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .map(m => ({
      operation: m.operation,
      duration: m.duration,
      timestamp: new Date(m.timestamp).toISOString(),
    }));
  
  return {
    total: totalQueries,
    recent: recentMetrics.length,
    avgDuration,
    slowQueries,
    errorRate: parseFloat(errorRate),
  };
}

/**
 * Reset query metrics
 * Useful for testing or clearing memory
 */
export function resetQueryMetrics(): void {
  queryMetrics.length = 0;
  totalQueries = 0;
  console.log('🔄 Query metrics reset');
}

/**
 * Check if approaching rate limit
 * Hasura free tier: 60 requests/minute
 */
export function isApproachingRateLimit(): boolean {
  const oneMinuteAgo = Date.now() - 60000;
  const recentQueries = queryMetrics.filter(m => m.timestamp > oneMinuteAgo);
  
  // Warn if > 50 queries in last minute (approaching 60 limit)
  if (recentQueries.length > 50) {
    console.warn(`⚠️  Approaching Hasura rate limit: ${recentQueries.length}/60 queries in last minute`);
    return true;
  }
  
  return false;
}
