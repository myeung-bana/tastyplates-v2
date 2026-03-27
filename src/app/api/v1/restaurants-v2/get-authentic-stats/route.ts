import { NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

/**
 * GET /api/v1/restaurants-v2/get-authentic-stats
 *
 * Returns per-restaurant authentic rating data keyed by restaurant UUID:
 *   { [uuid]: { avg: authentic_rating_weighted, count: authentic_review_count } }
 *
 * Reads from the pre-computed `restaurant_rating_summary` table which is rebuilt
 * by `rebuildRatingSummary` after every review create / update / delete.
 * This replaces the previous full-table scan over all reviews (~5 000 rows).
 *
 * Cache: invalidated whenever `v:reviews:all` version bumps (i.e. any review mutation).
 */

const GET_RATING_SUMMARIES = `
  query GetAuthenticStatsSummaries {
    restaurant_rating_summary {
      restaurant_id
      authentic_rating_weighted
      authentic_review_count
    }
  }
`;

const GET_RESTAURANTS_ID_UUID = `
  query GetRestaurantsIdUuid($limit: Int) {
    restaurants(where: { status: { _eq: "publish" } }, limit: $limit) {
      id
      uuid
    }
  }
`;

export async function GET() {
  try {
    const reviewVersion = await getVersion('v:reviews:all');
    const cacheKey = `restaurants:authentic:v2:rv${reviewVersion}`;

    const { value: stats, hit } = await cacheGetOrSetJSON<Record<string, { avg: number; count: number }>>(
      cacheKey,
      600,
      async () => {
        const [summaryResult, restaurantsResult] = await Promise.all([
          hasuraQuery<{
            restaurant_rating_summary: Array<{
              restaurant_id: number;
              authentic_rating_weighted: number | null;
              authentic_review_count: number;
            }>;
          }>(GET_RATING_SUMMARIES),
          hasuraQuery<{ restaurants: Array<{ id: number; uuid: string }> }>(
            GET_RESTAURANTS_ID_UUID,
            { limit: 8000 }
          ),
        ]);

        if (summaryResult.errors) {
          throw new Error(summaryResult.errors[0]?.message || 'GraphQL error (summaries)');
        }
        if (restaurantsResult.errors) {
          throw new Error(restaurantsResult.errors[0]?.message || 'GraphQL error (restaurants)');
        }

        // Build a restaurant_id → uuid lookup
        const uuidById = new Map<number, string>();
        for (const { id, uuid } of restaurantsResult.data?.restaurants ?? []) {
          if (id && uuid) uuidById.set(id, uuid);
        }

        const out: Record<string, { avg: number; count: number }> = {};
        for (const row of summaryResult.data?.restaurant_rating_summary ?? []) {
          const uuid = uuidById.get(row.restaurant_id);
          if (!uuid) continue;
          if (row.authentic_review_count === 0) continue;

          out[uuid] = {
            avg: row.authentic_rating_weighted ?? 0,
            count: row.authentic_review_count,
          };
        }

        return out;
      }
    );

    return NextResponse.json(
      { success: true, data: stats },
      {
        headers: {
          'X-Cache': hit ? 'HIT' : 'MISS',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('Get authentic stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
