import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

/**
 * GET /api/v1/restaurants-v2/get-rating-summary?uuid=<restaurant-uuid>
 *
 * Returns precomputed overall + authentic rating aggregates for a single restaurant
 * from `restaurant_rating_summary`. Fast single-row read — no review scanning.
 *
 * Used by /restaurants/[slug] to display Overall and Authentic scores without
 * iterating through all reviews client-side.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     restaurant_id: number,
 *     overall_rating_avg: number | null,
 *     overall_review_count: number,
 *     overall_rating_weighted: number | null,
 *     authentic_rating_avg: number | null,
 *     authentic_review_count: number,
 *     authentic_rating_weighted: number | null,
 *     updated_at: string,
 *   } | null   // null = no summary row yet (restaurant has no reviews or backfill pending)
 * }
 */

const GET_RESTAURANT_ID = `
  query GetRatingSummaryRestaurantId($uuid: uuid!) {
    restaurants(where: { uuid: { _eq: $uuid } }, limit: 1) {
      id
    }
  }
`;

const GET_RATING_SUMMARY_BY_ID = `
  query GetRatingSummaryById($restaurant_id: bigint!) {
    restaurant_rating_summary(
      where: { restaurant_id: { _eq: $restaurant_id } }
      limit: 1
    ) {
      restaurant_id
      overall_review_count
      overall_rating_avg
      overall_rating_weighted
      authentic_review_count
      authentic_rating_avg
      authentic_rating_weighted
      updated_at
    }
  }
`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'uuid query parameter is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(uuid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Cache per restaurant — invalidates when reviews version bumps (review mutations bump v:reviews:all)
    const reviewVersion = await getVersion('v:reviews:all');
    const cacheKey = `restaurant:rating-summary:${uuid}:rv${reviewVersion}`;

    const { value: summary, hit } = await cacheGetOrSetJSON(
      cacheKey,
      600,
      async () => {
        // Step 1: resolve UUID → integer id
        const idResult = await hasuraQuery<{ restaurants: Array<{ id: number }> }>(
          GET_RESTAURANT_ID,
          { uuid }
        );

        if (idResult.errors) {
          throw new Error(idResult.errors[0]?.message || 'Failed to resolve restaurant id');
        }

        const restaurantId = idResult.data?.restaurants?.[0]?.id;
        if (!restaurantId) {
          return null; // Restaurant not found
        }

        // Step 2: fetch rating summary
        const summaryResult = await hasuraQuery<{
          restaurant_rating_summary: Array<{
            restaurant_id: number;
            overall_review_count: number;
            overall_rating_avg: number | null;
            overall_rating_weighted: number | null;
            authentic_review_count: number;
            authentic_rating_avg: number | null;
            authentic_rating_weighted: number | null;
            updated_at: string;
          }>;
        }>(GET_RATING_SUMMARY_BY_ID, { restaurant_id: restaurantId });

        if (summaryResult.errors) {
          throw new Error(summaryResult.errors[0]?.message || 'Failed to fetch rating summary');
        }

        return summaryResult.data?.restaurant_rating_summary?.[0] ?? null;
      }
    );

    return NextResponse.json(
      { success: true, data: summary },
      {
        headers: {
          'X-Cache': hit ? 'HIT' : 'MISS',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('[get-rating-summary] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
