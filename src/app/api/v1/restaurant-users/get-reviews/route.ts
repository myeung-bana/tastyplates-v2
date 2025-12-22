import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_REVIEWS, GET_USER_REVIEWS_BY_STATUS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // Optional status filter

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Map user_id to authorId for the GraphQL query
    // user_id (from restaurant_users) maps to author_id (in restaurant_reviews)
    // Use different query based on whether status filter is provided
    const queryVariables: any = {
      authorId: user_id, // user_id maps to author_id in restaurant_reviews table
      limit: Math.min(limit, 100), // Cap at 100
      offset
    };
    
    // Use status-filtered query if status is provided, otherwise use general query
    const query = status ? GET_USER_REVIEWS_BY_STATUS : GET_USER_REVIEWS;
    if (status) {
      queryVariables.status = status;
    }
    
    const result = await hasuraQuery(query, queryVariables);

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

    const reviews = result.data?.restaurant_reviews || [];
    const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

    // Fetch author data separately since the relationship isn't configured in Hasura
    // All reviews have the same author_id (user_id), so fetch once and attach to all reviews
    let authorData = null;
    try {
      const authorResult = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, {
        id: user_id
      });

      if (!authorResult.errors && authorResult.data?.restaurant_users_by_pk) {
        const user = authorResult.data.restaurant_users_by_pk;
        authorData = {
          id: user.id,
          username: user.username || '',
          display_name: user.display_name || user.username || '',
          profile_image: user.profile_image
        };
      }
    } catch (error) {
      console.warn('Failed to fetch author data:', error);
      // Continue without author data - will use defaults in transformer
    }

    // Fetch restaurant data for each unique restaurant_uuid
    // Collect unique restaurant UUIDs
    const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];
    
    // Fetch all restaurants in parallel
    const restaurantPromises = restaurantUuids.map(async (uuid: string) => {
      try {
        const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
          uuid: uuid
        });

        if (!restaurantResult.errors && restaurantResult.data?.restaurants?.[0]) {
          const restaurant = restaurantResult.data.restaurants[0];
          return {
            uuid: restaurant.uuid,
            id: restaurant.id,
            title: restaurant.title || '',
            slug: restaurant.slug || '',
            featured_image_url: restaurant.featured_image_url || ''
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch restaurant ${uuid}:`, error);
      }
      return null;
    });

    const restaurantResults = await Promise.all(restaurantPromises);
    const restaurantMap = new Map(
      restaurantResults
        .filter(Boolean)
        .map((r: any) => [r.uuid, r])
    );

    // Attach author and restaurant data to each review
    const reviewsWithData = reviews.map((review: any) => ({
      ...review,
      author: authorData || {
        id: user_id,
        username: '',
        display_name: '',
        profile_image: null
      },
      restaurant: restaurantMap.get(review.restaurant_uuid) || {
        uuid: review.restaurant_uuid || '',
        id: null,
        title: '',
        slug: '',
        featured_image_url: ''
      }
    }));

    return NextResponse.json({
      success: true,
      data: reviewsWithData,
      meta: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Get Reviews API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

