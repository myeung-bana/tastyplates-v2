import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_REVIEWS, GET_ALL_REVIEWS_CURSOR } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USERS_BY_IDS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';
import { GRAPHQL_LIMITS } from '@/constants/graphql';

const isDev = process.env.NODE_ENV === 'development';

// Helper to parse cursor (format: "2024-01-15T10:30:00Z_uuid123")
function parseCursor(cursor: string | null): { timestamp: string; id: string } | null {
  if (!cursor) return null;
  const parts = cursor.split('_');
  if (parts.length !== 2) return null;
  return { timestamp: parts[0], id: parts[1] };
}

// Helper to encode cursor from review
function encodeCursor(review: any): string {
  return `${review.created_at}_${review.id}`;
}

export async function GET(request: NextRequest) {
  try {
    const t0 = Date.now();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '16');
    
    // Support both cursor and offset pagination (backwards compatible)
    const cursor = searchParams.get('cursor');
    const offset = parseInt(searchParams.get('offset') || '0');
    const useCursor = !!cursor; // Use cursor pagination if cursor param exists

    // Get version for all reviews
    const tVersion0 = Date.now();
    const version = await getVersion('v:reviews:all');
    const tVersion = Date.now() - tVersion0;
    
    // Cache key with version (different keys for cursor vs offset)
    const cacheKey = useCursor 
      ? `reviews:all:v${version}:limit=${limit}:cursor=${cursor}`
      : `reviews:all:v${version}:limit=${limit}:offset=${offset}`;
    
    let tHasuraReviews = 0;
    let tHasuraRestaurants = 0;
    let tHasuraAuthors = 0;

    const tCache0 = Date.now();
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      300, // 300 seconds (5 minutes) TTL for better performance
      async () => {
        const tReviews0 = Date.now();
        
        let result;
        if (useCursor) {
          // Cursor-based pagination (Phase 2 - Fast!)
          const parsedCursor = parseCursor(cursor);
          result = await hasuraQuery(GET_ALL_REVIEWS_CURSOR, {
            limit: Math.min(limit + 1, 101), // Fetch limit+1 to check if more exist
            cursorTimestamp: parsedCursor?.timestamp || null,
            cursorId: parsedCursor?.id || null
          });
        } else {
          // Offset-based pagination (Legacy - slower for deep pagination)
          result = await hasuraQuery(GET_ALL_REVIEWS, {
            limit: Math.min(limit, 100), // Cap at 100
            offset
          });
        }
        tHasuraReviews = Date.now() - tReviews0;

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
        }

        let reviews = result.data?.restaurant_reviews || [];
        const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

        // For cursor pagination, check if we have more results
        let hasMore = false;
        let nextCursor = null;
        if (useCursor && reviews.length > limit) {
          hasMore = true;
          reviews = reviews.slice(0, limit); // Remove the extra item we fetched
          const lastReview = reviews[reviews.length - 1];
          nextCursor = encodeCursor(lastReview);
        } else if (useCursor) {
          hasMore = reviews.length === limit; // If we got exactly limit, there might be more
          if (reviews.length > 0) {
            const lastReview = reviews[reviews.length - 1];
            nextCursor = encodeCursor(lastReview);
          }
        }

        // Get unique restaurant UUIDs and author IDs
        const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
        const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];

        // Fetch all restaurants in a SINGLE batch query (optimized from N+1)
        let restaurantMap = new Map();
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
                restaurantsResult.data.restaurants.map((restaurant: any) => [
                  restaurant.uuid,
                  {
                    uuid: restaurant.uuid,
                    id: restaurant.id,
                    title: restaurant.title || '',
                    slug: restaurant.slug || '',
                    featured_image_url: restaurant.featured_image_url || ''
                  }
                ])
              );
            } else {
              console.warn('Failed to fetch restaurants:', restaurantsResult.errors);
            }
          } catch (error) {
            console.error('Error fetching restaurants batch:', error);
          }
        }

        // Fetch all authors in a single batch query (already optimized)
        let authorMap = new Map();
        if (authorIds.length > 0) {
          try {
            const tAuthors0 = Date.now();
            const authorsResult = await hasuraQuery(GET_RESTAURANT_USERS_BY_IDS, {
              ids: authorIds,
              limit: GRAPHQL_LIMITS.BATCH_USERS_MAX
            });
            tHasuraAuthors = Date.now() - tAuthors0;

            if (!authorsResult.errors && authorsResult.data?.restaurant_users) {
              const users = authorsResult.data.restaurant_users;
              authorMap = new Map(
                users.map((user: any) => [
                  user.id,
                  {
                    id: user.id,
                    username: user.username || '',
                    display_name: user.display_name || user.username || '',
                    profile_image: user.profile_image,
                    palates: user.palates
                  }
                ])
              );
            } else {
              console.warn('Failed to fetch authors:', authorsResult.errors);
            }
          } catch (error) {
            console.error('Error fetching authors batch:', error);
          }
        }

        // Attach author and restaurant data to all reviews
        reviews = reviews.map((review: any) => ({
          ...review,
          author: authorMap.get(review.author_id) || null,
          restaurant: restaurantMap.get(review.restaurant_uuid) || null
        }));

        // Return response with cursor or offset metadata
        if (useCursor) {
          return {
            success: true,
            data: reviews,
            meta: {
              total,
              limit,
              cursor: nextCursor,
              hasMore
            }
          };
        } else {
          return {
            success: true,
            data: reviews,
            meta: {
              total,
              limit,
              offset,
              hasMore: (offset + limit) < total
            }
          };
        }
      }
    );
    const tCache = Date.now() - tCache0;
    const tTotal = Date.now() - t0;
    
    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS',
        'X-Pagination-Type': useCursor ? 'cursor' : 'offset', // Track pagination type
        ...(isDev ? { 'X-Cache-Key': cacheKey } : {}),
        'Server-Timing': [
          `version;dur=${tVersion}`,
          `cache;dur=${tCache}`,
          `hasura_reviews;dur=${hit ? 0 : tHasuraReviews}`,
          `hasura_restaurants;dur=${hit ? 0 : tHasuraRestaurants}`,
          `hasura_authors;dur=${hit ? 0 : tHasuraAuthors}`,
          `total;dur=${tTotal}`
        ].join(', '),
        // HTTP caching for CDN and browsers (5 minutes, stale-while-revalidate for 10 minutes)
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
