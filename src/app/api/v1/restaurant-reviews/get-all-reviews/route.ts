import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_REVIEWS_BASIC } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_USER_PROFILES_BY_IDS } from '@/app/graphql/UserProfiles/userProfilesQueries';
import { GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/Restaurants/restaurantQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';
import { GRAPHQL_LIMITS } from '@/constants/graphql';

const isDev = process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
  try {
    const t0 = Date.now();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '16');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get version for all reviews
    const tVersion0 = Date.now();
    const version = await getVersion('v:reviews:all');
    const tVersion = Date.now() - tVersion0;
    
    // Cache key with version
    const cacheKey = `reviews:all:nhost:v${version}:limit=${limit}:offset=${offset}`;
    
    let tHasuraReviews = 0;
    let tHasuraProfiles = 0;
    let tHasuraRestaurants = 0;

    const tCache0 = Date.now();
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      300, // 300 seconds (5 minutes) TTL for better performance
      async () => {
        const tQuery0 = Date.now();
        
        // Fetch reviews without relationships (works immediately)
        const result = await hasuraQuery(GET_ALL_REVIEWS_BASIC, {
          limit: Math.min(limit, 100),
          offset
        });
        
        tHasuraReviews = Date.now() - tQuery0;

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
        }

        let reviews = result.data?.restaurant_reviews || [];
        const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

        // Get unique author IDs and restaurant UUIDs
        const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];
        const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];

        // Batch fetch user profiles with auth data (using existing relationship)
        let profilesMap = new Map();
        if (authorIds.length > 0) {
          try {
            const tProfiles0 = Date.now();
            const profilesResult = await hasuraQuery(GET_USER_PROFILES_BY_IDS, {
              user_ids: authorIds,
              limit: GRAPHQL_LIMITS.BATCH_USERS_MAX
            });
            tHasuraProfiles = Date.now() - tProfiles0;

            if (!profilesResult.errors && profilesResult.data?.user_profiles) {
              profilesMap = new Map(
                profilesResult.data.user_profiles.map((profile: any) => [
                  profile.user_id,
                  {
                    username: profile.username,
                    palates: profile.palates,
                    avatarUrl: profile.user?.avatarUrl,
                    displayName: profile.user?.displayName
                  }
                ])
              );
            }
          } catch (error) {
            console.error('Error fetching user profiles:', error);
          }
        }

        // Batch fetch restaurants
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
                  restaurant
                ])
              );
            }
          } catch (error) {
            console.error('Error fetching restaurants:', error);
          }
        }

        // Enrich reviews with author and restaurant data
        const enrichedReviews = reviews.map((review: any) => {
          const profile = profilesMap.get(review.author_id);
          const restaurant = restaurantMap.get(review.restaurant_uuid);

          return {
            ...review,
            author: {
              id: review.author_id,
              username: profile?.username || 'Unknown',
              display_name: profile?.displayName || profile?.username || 'Unknown',
              profile_image: profile?.avatarUrl || null,
              palates: profile?.palates || []
            },
            restaurant: restaurant ? {
              uuid: restaurant.uuid,
              id: restaurant.id,
              title: restaurant.title || '',
              slug: restaurant.slug || '',
              featured_image_url: restaurant.featured_image_url || null
            } : null
          };
        });

        return {
          success: true,
          data: enrichedReviews,
          meta: {
            total,
            limit,
            offset,
            hasMore: (offset + limit) < total
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
          `hasura_reviews;dur=${hit ? 0 : tHasuraReviews}`,
          `hasura_profiles;dur=${hit ? 0 : tHasuraProfiles}`,
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
