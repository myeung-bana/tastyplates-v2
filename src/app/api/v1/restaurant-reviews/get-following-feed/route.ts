import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_FOLLOWING_LIST } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { GET_REVIEWS_BY_AUTHORS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USERS_BY_IDS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';
import { GRAPHQL_LIMITS } from '@/constants/graphql';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user_id format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Get version for this user's following feed
    const version = await getVersion(`v:reviews:following:${userId}`);
    const cacheKey = `reviews:following:${userId}:v${version}:limit=${limit}:offset=${offset}`;

    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      120, // shorter TTL: following feed changes more frequently
      async () => {
        // Fetch following list (ids only). We page through follows to avoid hard limits.
        const followingIds: string[] = [];
        const FOLLOW_PAGE = 500;
        let followOffset = 0;
        let hasMoreFollows = true;

        while (hasMoreFollows) {
          const followRes = await hasuraQuery(GET_FOLLOWING_LIST, {
            userId,
            limit: FOLLOW_PAGE,
            offset: followOffset,
          });

          if (followRes.errors) {
            // If follows table/relationship is missing in Hasura, return empty feed gracefully
            const hasTableError = followRes.errors.some((err: any) =>
              err.message?.includes('restaurant_user_follows') ||
              err.message?.includes('not found') ||
              err.message?.includes('relationship')
            );
            if (hasTableError) {
              return {
                success: true,
                data: [],
                meta: { total: 0, limit, offset, hasMore: false },
              };
            }
            throw new Error(followRes.errors[0]?.message || 'Failed to fetch following list');
          }

          const follows = followRes.data?.restaurant_user_follows || [];
          const ids = follows.map((f: any) => f.user_id).filter(Boolean);
          followingIds.push(...ids);

          followOffset += ids.length;
          hasMoreFollows = ids.length === FOLLOW_PAGE;

          // Safety: cap to 100 followed users for feed generation (free tier optimization)
          if (followingIds.length >= GRAPHQL_LIMITS.BATCH_FOLLOWING_MAX) {
            hasMoreFollows = false;
          }
        }

        // If user follows nobody, empty feed.
        if (followingIds.length === 0) {
          return {
            success: true,
            data: [],
            meta: { total: 0, limit, offset, hasMore: false },
          };
        }

        // Cap following IDs to prevent huge queries on free tier
        const cappedFollowingIds = followingIds.slice(0, GRAPHQL_LIMITS.BATCH_FOLLOWING_MAX);

        // Fetch reviews for followed authors
        const reviewsRes = await hasuraQuery(GET_REVIEWS_BY_AUTHORS, {
          authorIds: cappedFollowingIds,
          limit: Math.min(limit, GRAPHQL_LIMITS.API_MAX),
          offset,
        });

        if (reviewsRes.errors) {
          throw new Error(reviewsRes.errors[0]?.message || 'Failed to fetch following feed');
        }

        let reviews = reviewsRes.data?.restaurant_reviews || [];
        const total = reviewsRes.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

        // Enrich with restaurant + author data (batch)
        const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
        const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];

        let restaurantMap = new Map();
        if (restaurantUuids.length > 0) {
          try {
            const restaurantsResult = await hasuraQuery(GET_RESTAURANTS_BY_UUIDS, { 
              uuids: restaurantUuids,
              limit: GRAPHQL_LIMITS.BATCH_RESTAURANTS_MAX
            });
            if (!restaurantsResult.errors && restaurantsResult.data?.restaurants) {
              restaurantMap = new Map(
                restaurantsResult.data.restaurants.map((restaurant: any) => [
                  restaurant.uuid,
                  {
                    uuid: restaurant.uuid,
                    id: restaurant.id,
                    title: restaurant.title || '',
                    slug: restaurant.slug || '',
                    featured_image_url: restaurant.featured_image_url || '',
                  },
                ])
              );
            }
          } catch (e) {
            // Continue without restaurant map
          }
        }

        let authorMap = new Map();
        if (authorIds.length > 0) {
          try {
            const authorsResult = await hasuraQuery(GET_RESTAURANT_USERS_BY_IDS, { 
              ids: authorIds,
              limit: GRAPHQL_LIMITS.BATCH_USERS_MAX
            });
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
                    palates: user.palates,
                  },
                ])
              );
            }
          } catch (e) {
            // Continue without author map
          }
        }

        reviews = reviews.map((review: any) => ({
          ...review,
          author: authorMap.get(review.author_id) || null,
          restaurant: restaurantMap.get(review.restaurant_uuid) || null,
        }));

        return {
          success: true,
          data: reviews,
          meta: {
            total,
            limit,
            offset,
            hasMore: (offset + limit) < total,
          },
        };
      }
    );

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS',
        // keep caching conservative; this is personalized
        'Cache-Control': 'private, max-age=0, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Get Following Feed API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

