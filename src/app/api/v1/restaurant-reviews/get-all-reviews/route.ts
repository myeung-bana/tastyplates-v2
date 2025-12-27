import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_REVIEWS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USERS_BY_IDS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '16');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Note: userId parameter removed - like status checking can be added later if needed

    const result = await hasuraQuery(GET_ALL_REVIEWS, {
      limit: Math.min(limit, 100), // Cap at 100
      offset
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch reviews',
          details: result.errors
        },
        { status: 500 }
      );
    }

    let reviews = result.data?.restaurant_reviews || [];
    const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

    // Get unique restaurant UUIDs and author IDs
    const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
    const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];

    // Fetch all restaurants in parallel
    const restaurantPromises = restaurantUuids.map(async (uuid: string) => {
      try {
        const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
          uuid
        });

        if (!restaurantResult.errors && restaurantResult.data?.restaurants_by_pk) {
          const restaurant = restaurantResult.data.restaurants_by_pk;
          return {
            uuid,
            restaurant: {
              uuid: restaurant.uuid,
              id: restaurant.id,
              title: restaurant.title || '',
              slug: restaurant.slug || '',
              featured_image_url: restaurant.featured_image_url || ''
            }
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch restaurant ${uuid}:`, error);
      }
      return null;
    });

    // Fetch all authors in a single batch query (more efficient)
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

    const restaurantResults = await Promise.all(restaurantPromises);

    const restaurantMap = new Map(
      restaurantResults
        .filter(Boolean)
        .map((result: any) => [result.uuid, result.restaurant])
    );

    // Attach author and restaurant data to all reviews
    reviews = reviews.map((review: any) => ({
      ...review,
      author: authorMap.get(review.author_id) || null,
      restaurant: restaurantMap.get(review.restaurant_uuid) || null
    }));

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
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
