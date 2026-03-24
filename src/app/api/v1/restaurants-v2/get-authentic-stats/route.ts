import { NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';
import { hasMatchingPalates, normalizePalates } from '@/utils/palateUtils';

/**
 * GET /api/v1/restaurants-v2/get-authentic-stats
 *
 * Per-restaurant "authentic" score: average rating of reviews whose reviewer palates
 * overlap the restaurant's declared palates/cuisines (same idea as calculateAuthenticRating).
 *
 * Cached with Redis; invalidates when review or restaurant data version bumps.
 */

const GET_REVIEWS_FOR_AUTHENTIC = `
  query GetReviewsForAuthentic($where: restaurant_reviews_bool_exp, $limit: Int) {
    restaurant_reviews(where: $where, limit: $limit) {
      restaurant_uuid
      rating
      palates
      deleted_at
      parent_review_id
    }
  }
`;

const GET_RESTAURANTS_TAXONOMY = `
  query GetRestaurantsTaxonomyForAuthentic($limit: Int) {
    restaurants(where: { status: { _eq: "publish" } }, limit: $limit) {
      uuid
      palates
      cuisines
    }
  }
`;

function parseJsonb(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function extractReviewPalates(palates: unknown): string[] {
  if (!palates) return [];
  if (Array.isArray(palates)) {
    if (palates.every((p) => typeof p === 'string')) {
      return palates.map((p) => String(p).trim().toLowerCase()).filter(Boolean);
    }
    return palates
      .map((p: unknown) =>
        typeof p === 'string' ? p : (p as { slug?: string; name?: string })?.slug || (p as { name?: string })?.name || ''
      )
      .filter(Boolean)
      .map((p: string) => p.trim().toLowerCase());
  }
  if (typeof palates === 'string') {
    try {
      const parsed = JSON.parse(palates);
      return extractReviewPalates(parsed);
    } catch {
      return palates
        .split('|')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
  }
  return [];
}

/** Combined normalized palate labels from restaurant JSONB `palates` + `cuisines`. */
function restaurantTaxonomyStrings(palatesRaw: unknown, cuisinesRaw: unknown): string[] {
  const pal = normalizePalates(parseJsonb(palatesRaw) as Parameters<typeof normalizePalates>[0]);
  const cui = normalizePalates(parseJsonb(cuisinesRaw) as Parameters<typeof normalizePalates>[0]);
  return [...new Set([...pal, ...cui])];
}

export async function GET() {
  try {
    const reviewVersion = await getVersion('v:reviews:all');
    const restaurantVersion = await getVersion('v:restaurants:all');
    const cacheKey = `restaurants:authentic:v${reviewVersion}:r${restaurantVersion}`;

    const { value: stats, hit } = await cacheGetOrSetJSON<Record<string, { avg: number; count: number }>>(
      cacheKey,
      600,
      async () => {
        const where = {
          _and: [
            { deleted_at: { _is_null: true } },
            { parent_review_id: { _is_null: true } },
          ],
        };

        const [reviewsResult, restaurantsResult] = await Promise.all([
          hasuraQuery<{ restaurant_reviews: Array<Record<string, unknown>> }>(GET_REVIEWS_FOR_AUTHENTIC, {
            where,
            limit: 5000,
          }),
          hasuraQuery<{ restaurants: Array<{ uuid: string; palates: unknown; cuisines: unknown }> }>(
            GET_RESTAURANTS_TAXONOMY,
            { limit: 8000 }
          ),
        ]);

        if (reviewsResult.errors) {
          throw new Error(reviewsResult.errors[0]?.message || 'GraphQL error (reviews)');
        }
        if (restaurantsResult.errors) {
          throw new Error(restaurantsResult.errors[0]?.message || 'GraphQL error (restaurants)');
        }

        const taxonomyByUuid = new Map<string, string[]>();
        for (const row of restaurantsResult.data?.restaurants || []) {
          if (!row.uuid) continue;
          const labels = restaurantTaxonomyStrings(row.palates, row.cuisines);
          taxonomyByUuid.set(row.uuid, labels);
        }

        const acc = new Map<string, { sum: number; count: number }>();

        for (const r of reviewsResult.data?.restaurant_reviews || []) {
          const restaurantUuid = r.restaurant_uuid as string | undefined;
          if (!restaurantUuid) continue;

          const rating = Number(r.rating) || 0;
          if (rating <= 0) continue;

          const restTax = taxonomyByUuid.get(restaurantUuid);
          if (!restTax || restTax.length === 0) continue;

          const reviewPalates = extractReviewPalates(r.palates);
          if (!hasMatchingPalates(restTax, reviewPalates)) continue;

          const cur = acc.get(restaurantUuid) || { sum: 0, count: 0 };
          cur.sum += rating;
          cur.count += 1;
          acc.set(restaurantUuid, cur);
        }

        const out: Record<string, { avg: number; count: number }> = {};
        for (const [uuid, { sum, count }] of acc.entries()) {
          out[uuid] = { avg: sum / count, count };
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
