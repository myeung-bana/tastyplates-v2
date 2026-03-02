import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEWS_BY_RESTAURANT } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

/** Derive a display name from an email address (part before @). */
function emailToDisplayName(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0];
  return local || null;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurant_uuid = searchParams.get('restaurant_uuid');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Removed status filter - fetch all non-deleted, top-level reviews

    if (!restaurant_uuid) {
      return NextResponse.json(
        { success: false, error: 'Restaurant UUID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(restaurant_uuid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid restaurant UUID format' },
        { status: 400 }
      );
    }

    // Get version for this restaurant's reviews
    const version = await getVersion(`v:restaurant:${restaurant_uuid}:reviews`);
    
    // Cache key with restaurant UUID and version
    const cacheKey = `reviews:restaurant:${restaurant_uuid}:authorprofile_v1:v${version}:limit=${limit}:offset=${offset}`;
    
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      300, // 300 seconds (5 minutes) TTL for better performance
      async () => {
        const result = await hasuraQuery(GET_REVIEWS_BY_RESTAURANT, {
          restaurantUuid: restaurant_uuid,
          limit: Math.min(limit, 100), // Cap at 100
          offset
          // Removed status parameter
        });

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
        }

        let reviews = result.data?.restaurant_reviews || [];
        const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

        // Fetch restaurant data separately (all reviews are for the same restaurant)
        let restaurantData = null;
        if (restaurant_uuid) {
          try {
            const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
              uuid: restaurant_uuid
            });

            if (!restaurantResult.errors && restaurantResult.data?.restaurants && restaurantResult.data.restaurants.length > 0) {
              const restaurant = restaurantResult.data.restaurants[0];
              restaurantData = {
                uuid: restaurant.uuid,
                id: restaurant.id,
                title: restaurant.title || '',
                slug: restaurant.slug || '',
                featured_image_url: restaurant.featured_image_url || ''
              };
            }
          } catch (error) {
            console.warn('Failed to fetch restaurant data:', error);
            // Continue without restaurant data - will use defaults in transformer
          }
        }

        // Map author data directly from the AuthorProfile relationship (user_profiles → auth.users)
        reviews = reviews.map((review: any) => {
          const authorProfile = review.AuthorProfile;

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
            restaurant: restaurantData
          };
        });

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
    console.error('Get Reviews by Restaurant API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

