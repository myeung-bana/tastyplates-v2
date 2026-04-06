import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

/**
 * GET /api/v1/restaurants-v2/get-preference-stats
 *
 * Computes per-restaurant preference stats for a palate set:
 * - avg: average rating across matching reviews
 * - count: number of matching reviews
 *
 * Query params:
 * - palates: comma-separated palate slugs (e.g. "korean,japanese")
 *
 * Notes:
 * - This endpoint is intentionally approximate and cached (Redis + CDN).
 * - Palate matching uses the reviewer's **user profile** palates (AuthorProfile.palates),
 *   mirroring the Search Score calculation on the restaurant detail page.
 */

const GET_REVIEWS_FOR_PREFERENCE = `
  query GetReviewsForPreference($where: restaurant_reviews_bool_exp, $limit: Int) {
    restaurant_reviews(where: $where, limit: $limit) {
      restaurant_uuid
      rating
      palates
      deleted_at
      parent_review_id
      AuthorProfile {
        palates
      }
    }
  }
`;

function normalizePalateList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function extractReviewPalates(palates: any): string[] {
  if (!palates) return [];
  if (Array.isArray(palates)) {
    // Most common case: ["korean","japanese"]
    if (palates.every((p) => typeof p === 'string')) return palates.map((p) => p.toLowerCase());
    // Fallback: [{slug:"korean"}] or [{name:"Korean"}]
    return palates
      .map((p: any) => (typeof p === 'string' ? p : (p?.slug || p?.name || '')))
      .filter(Boolean)
      .map((p: string) => p.toLowerCase());
  }
  if (typeof palates === 'string') {
    // Could be JSON string or pipe-delimited
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const palatesParam = (searchParams.get('palates') || '').trim();
    const palates = normalizePalateList(palatesParam);

    // Empty palates => empty stats (still cacheable)
    if (palates.length === 0) {
      return NextResponse.json(
        { success: true, data: {} },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    const version = await getVersion('v:reviews:all');
    const cacheKey = `restaurants:preference:v${version}:palates=${palates.join(',')}`;

    const { value: stats, hit } = await cacheGetOrSetJSON<Record<string, { avg: number; count: number }>>(
      cacheKey,
      600,
      async () => {
        // Fetch all non-deleted top-level reviews with their AuthorProfile palates.
        // Palate matching is done in JS on AuthorProfile.palates (the reviewer's profile),
        // mirroring how Search Score works on the detail page.
        const where: any = {
          _and: [
            { deleted_at: { _is_null: true } },
            { parent_review_id: { _is_null: true } },
          ],
        };

        let rows: any[] = [];
        try {
          const result = await hasuraQuery<{ restaurant_reviews: any[] }>(GET_REVIEWS_FOR_PREFERENCE, {
            where,
            limit: 5000,
          });
          if (result.errors) {
            throw new Error(result.errors[0]?.message || 'GraphQL error');
          }
          rows = result.data?.restaurant_reviews || [];
        } catch (e) {
          console.error('Preference stats query error:', e);
          rows = [];
        }

        const palateSet = new Set(palates);
        const acc = new Map<string, { sum: number; count: number }>();

        for (const r of rows) {
          const restaurantUuid = r.restaurant_uuid;
          if (!restaurantUuid) continue;

          const rating = Number(r.rating) || 0;
          if (rating <= 0) continue;

          // Use reviewer's profile palates first, fall back to review's own palates
          const authorPalates = extractReviewPalates(r.AuthorProfile?.palates);
          const reviewerPalates = authorPalates.length > 0
            ? authorPalates
            : extractReviewPalates(r.palates);
          const matches = reviewerPalates.some((p) => palateSet.has(p));
          if (!matches) continue;

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
    console.error('Get Preference Stats API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


