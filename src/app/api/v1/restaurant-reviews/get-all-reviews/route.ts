import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_REVIEWS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USERS_BY_IDS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '16');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Note: userId parameter removed - like status checking can be added later if needed

    // Get version for all reviews
    const version = await getVersion('v:reviews:all');
    
    // Cache key with version
    const cacheKey = `reviews:all:v${version}:limit=${limit}:offset=${offset}`;
    
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      300, // 300 seconds (5 minutes) TTL for better performance
      async () => {
        const result = await hasuraQuery(GET_ALL_REVIEWS, {
          limit: Math.min(limit, 100), // Cap at 100
          offset
        });

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
        }

        let reviews = result.data?.restaurant_reviews || [];
        const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

        // Get unique restaurant UUIDs and author IDs
        const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
        const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];

        // Fetch all restaurants in a SINGLE batch query (optimized from N+1)
        let restaurantMap = new Map();
        if (restaurantUuids.length > 0) {
          try {
            const restaurantsResult = await hasuraQuery(GET_RESTAURANTS_BY_UUIDS, {
              uuids: restaurantUuids
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
            const authorsResult = await hasuraQuery(GET_RESTAURANT_USERS_BY_IDS, {
              ids: authorIds
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
    );
    
    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS',
        'X-Cache-Key': cacheKey,
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
