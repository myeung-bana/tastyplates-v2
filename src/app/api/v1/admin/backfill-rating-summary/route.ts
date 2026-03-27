import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { rebuildRatingSummary } from '@/lib/rebuildRatingSummary';
import { bumpVersion } from '@/lib/redis-versioning';

/**
 * POST /api/v1/admin/backfill-rating-summary
 *
 * One-time backfill that runs rebuildRatingSummary for every published restaurant.
 * Populates restaurant_rating_summary and restaurant_cuisine_rating_summary from
 * historical review data.
 *
 * Protection: requires the `x-admin-secret` header to match HASURA_GRAPHQL_ADMIN_SECRET.
 * After running, this route can be removed or left in place — it is idempotent.
 *
 * Example:
 *   curl -X POST https://yoursite.com/api/v1/admin/backfill-rating-summary \
 *        -H "x-admin-secret: <your-admin-secret>"
 */

const GET_ALL_RESTAURANT_UUIDS = `
  query BackfillGetRestaurants($limit: Int!, $offset: Int!) {
    restaurants(
      where: { status: { _eq: "publish" } }
      order_by: { id: asc }
      limit: $limit
      offset: $offset
    ) {
      uuid
      title
    }
    restaurants_aggregate(where: { status: { _eq: "publish" } }) {
      aggregate {
        count
      }
    }
  }
`;

const BATCH_SIZE = 20; // Process in small batches to avoid Hasura timeouts

export async function POST(request: NextRequest) {
  // Verify admin secret
  const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
  const provided = request.headers.get('x-admin-secret');

  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Count total restaurants first
    const countResult = await hasuraQuery<{
      restaurants: Array<{ uuid: string; title: string }>;
      restaurants_aggregate: { aggregate: { count: number } };
    }>(GET_ALL_RESTAURANT_UUIDS, { limit: 1, offset: 0 });

    if (countResult.errors) {
      throw new Error(countResult.errors[0]?.message || 'Failed to count restaurants');
    }

    const total = countResult.data?.restaurants_aggregate?.aggregate?.count ?? 0;
    console.log(`[backfill] Starting backfill for ${total} restaurants`);

    let rebuilt = 0;
    let failed = 0;
    const failures: string[] = [];

    // Process in batches
    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      const batchResult = await hasuraQuery<{
        restaurants: Array<{ uuid: string; title: string }>;
      }>(GET_ALL_RESTAURANT_UUIDS, { limit: BATCH_SIZE, offset });

      if (batchResult.errors) {
        console.error(`[backfill] Batch fetch error at offset ${offset}:`, batchResult.errors);
        failed += BATCH_SIZE;
        continue;
      }

      const restaurants = batchResult.data?.restaurants ?? [];

      // Rebuild each restaurant in the batch sequentially to avoid overwhelming Hasura
      for (const restaurant of restaurants) {
        try {
          await rebuildRatingSummary(restaurant.uuid);
          rebuilt++;
          if (rebuilt % 10 === 0) {
            console.log(`[backfill] Progress: ${rebuilt}/${total}`);
          }
        } catch (err) {
          failed++;
          failures.push(`${restaurant.title} (${restaurant.uuid}): ${err}`);
          console.error(`[backfill] Failed for ${restaurant.uuid}:`, err);
        }
      }
    }

    // Bump restaurant cache version so all cached list pages reflect the fresh scores
    await Promise.all([
      bumpVersion('v:restaurants:all'),
      bumpVersion('v:reviews:all'),
    ]);

    console.log(`[backfill] Complete. Rebuilt: ${rebuilt}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      total,
      rebuilt,
      failed,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    console.error('[backfill] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
