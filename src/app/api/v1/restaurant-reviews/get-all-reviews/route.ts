import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_REVIEWS_WITH_NHOST_AUTHORS, GET_ALL_REVIEWS_WITH_NHOST_AUTHORS_CURSOR } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/Restaurants/restaurantQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';
import { GRAPHQL_LIMITS } from '@/constants/graphql';
import { decodeReviewCursor, encodeReviewCursor } from '@/lib/cursor-pagination';

const isDev = process.env.NODE_ENV === 'development';

/** Derive a display name from an email address (part before @). */
function emailToDisplayName(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0];
  return local || null;
}

export async function GET(request: NextRequest) {
  try {
    const t0 = Date.now();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '16', 10) || 16, 100);
    const offsetParam = searchParams.get('offset');
    const cursorParam = searchParams.get('cursor');
    const decodedCursor = cursorParam ? decodeReviewCursor(cursorParam) : null;
    const useCursorPagination = !!decodedCursor;
    const offset = useCursorPagination ? undefined : (offsetParam !== null ? parseInt(offsetParam || '0', 10) : 0);

    const tVersion0 = Date.now();
    const version = await getVersion('v:reviews:all');
    const tVersion = Date.now() - tVersion0;

    // Cache key: include cursor when used (cursor-based is O(1), offset is O(n))
    const cacheKey = useCursorPagination && cursorParam
      ? `reviews:all:nhost:authorprofile_v3:v${version}:limit=${limit}:cursor=${cursorParam}`
      : `reviews:all:nhost:authorprofile_v3:v${version}:limit=${limit}:offset=${offset}`;

    let tHasura = 0;
    let tHasuraRestaurants = 0;

    const tCache0 = Date.now();
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      300,
      async () => {
        let reviews: any[];
        let total: number;

        if (useCursorPagination && decodedCursor) {
          const tQuery0 = Date.now();
          const result = await hasuraQuery(GET_ALL_REVIEWS_WITH_NHOST_AUTHORS_CURSOR, {
            limit,
            cursorCreatedAt: decodedCursor.created_at,
            cursorId: decodedCursor.id
          });
          tHasura = Date.now() - tQuery0;
          if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
          }
          reviews = result.data?.restaurant_reviews || [];
          total = result.data?.restaurant_reviews_aggregate?.aggregate?.count ?? 0;
        } else {
          const tQuery0 = Date.now();
          const result = await hasuraQuery(GET_ALL_REVIEWS_WITH_NHOST_AUTHORS, {
            limit,
            offset: offset ?? 0
          });
          tHasura = Date.now() - tQuery0;
          if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
          }
          reviews = result.data?.restaurant_reviews || [];
          total = result.data?.restaurant_reviews_aggregate?.aggregate?.count ?? 0;
        }

        // Batch-fetch restaurants by uuid
        const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
        let restaurantMap = new Map<string, any>();
        if (restaurantUuids.length > 0) {
          try {
            const tRestaurants0 = Date.now();
            const restaurantsResult = await hasuraQuery(GET_RESTAURANTS_BY_UUIDS, {
              uuids: restaurantUuids,
              limit: GRAPHQL_LIMITS.BATCH_RESTAURANTS_MAX
            });
            tHasuraRestaurants = Date.now() - tRestaurants0;
            if (!restaurantsResult.errors && restaurantsResult.data?.restaurants) {
              restaurantMap = new Map(
                restaurantsResult.data.restaurants.map((r: any) => [r.uuid, r])
              );
            }
          } catch (err) {
            console.error('[get-all-reviews] Error fetching restaurants:', err);
          }
        }

        const enrichedReviews = reviews.map((review: any) => {
          const authorProfile = review.AuthorProfile;
          const restaurant = restaurantMap.get(review.restaurant_uuid);

          // Prefer profile username; fall back to email prefix when user_profiles row is missing
          const username =
            authorProfile?.username ||
            emailToDisplayName(authorProfile?.user?.email) ||
            'Unknown';

          const profileImage = authorProfile?.user?.avatarUrl ?? null;

          return {
            ...review,
            author: {
              id: review.author_id,
              username,
              display_name: username,
              profile_image: profileImage,
              palates: Array.isArray(authorProfile?.palates) ? authorProfile.palates : []
            },
            restaurant: restaurant
              ? {
                  uuid: restaurant.uuid,
                  id: restaurant.id,
                  title: restaurant.title || '',
                  slug: restaurant.slug || '',
                  featured_image_url: restaurant.featured_image_url || null
                }
              : null
          };
        });

        const last = enrichedReviews[enrichedReviews.length - 1];
        const nextCursor = last ? encodeReviewCursor(last.created_at, last.id) : null;
        const hasMore = useCursorPagination ? enrichedReviews.length === limit : (offset ?? 0) + limit < total;

        return {
          success: true,
          data: enrichedReviews,
          meta: {
            total: useCursorPagination ? undefined : total,
            limit,
            ...(offset !== undefined && { offset }),
            cursor: nextCursor ?? undefined,
            hasMore
          }
        };
      }
    );
    const tCache = Date.now() - tCache0;
    const tTotal = Date.now() - t0;

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS',
        ...(isDev ? { 'X-Cache-Key': cacheKey } : {}),
        'Server-Timing': [
          `version;dur=${tVersion}`,
          `cache;dur=${tCache}`,
          `hasura_reviews;dur=${hit ? 0 : tHasura}`,
          `hasura_restaurants;dur=${hit ? 0 : tHasuraRestaurants}`,
          `total;dur=${tTotal}`
        ].join(', '),
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300'
      }
    });

  } catch (error) {
    console.error('Get All Reviews API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
