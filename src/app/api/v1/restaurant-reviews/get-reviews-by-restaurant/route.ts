import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEWS_BY_RESTAURANT } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

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

    const result = await hasuraQuery(GET_REVIEWS_BY_RESTAURANT, {
      restaurantUuid: restaurant_uuid,
      limit: Math.min(limit, 100), // Cap at 100
      offset
      // Removed status parameter
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

    // Fetch restaurant data separately (all reviews are for the same restaurant)
    let restaurantData = null;
    if (restaurant_uuid) {
      try {
        const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
          uuid: restaurant_uuid
        });

        if (!restaurantResult.errors && restaurantResult.data?.restaurants_by_pk) {
          const restaurant = restaurantResult.data.restaurants_by_pk;
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

    // Fetch author data separately for all unique authors
    const authorIds = [...new Set(reviews.map((r: any) => r.author_id).filter(Boolean))];
    
    // Fetch all authors in parallel
    const authorPromises = authorIds.map(async (authorId: string) => {
      try {
        const authorResult = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, {
          id: authorId
        });

        if (!authorResult.errors && authorResult.data?.restaurant_users_by_pk) {
          const user = authorResult.data.restaurant_users_by_pk;
          return {
            id: authorId,
            author: {
              id: user.id,
              username: user.username || '',
              display_name: user.display_name || user.username || '',
              profile_image: user.profile_image,
              palates: user.palates || null
            }
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch author ${authorId}:`, error);
      }
      return null;
    });

    const authorResults = await Promise.all(authorPromises);
    const authorMap = new Map(
      authorResults
        .filter(Boolean)
        .map((result: any) => [result.id, result.author])
    );

    // Attach author and restaurant data to all reviews
    reviews = reviews.map((review: any) => ({
      ...review,
      author: authorMap.get(review.author_id) || null,
      restaurant: restaurantData
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

