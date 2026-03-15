import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_DRAFT_REVIEWS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { verifyNhostToken } from '@/lib/nhost-server-auth';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    // Verify Nhost token and get user ID directly
    const authHeader = request.headers.get('authorization');
    const tokenResult = await verifyNhostToken(authHeader);
    
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const author_id = tokenResult.userId!;

    if (!UUID_REGEX.test(author_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid author ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await hasuraQuery(GET_USER_DRAFT_REVIEWS, {
      authorId: author_id,
      limit: Math.min(limit, 100), // Cap at 100
      offset
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch draft reviews',
          details: result.errors
        },
        { status: 500 }
      );
    }

    let reviews = result.data?.restaurant_reviews || [];
    const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

    // Get unique restaurant UUIDs
    const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];

    // Fetch all restaurants in parallel
    const restaurantPromises = restaurantUuids.map(async (uuid: string) => {
      try {
        const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
          uuid
        });

        if (!restaurantResult.errors && restaurantResult.data?.restaurants && restaurantResult.data.restaurants.length > 0) {
          const restaurant = restaurantResult.data.restaurants[0];
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

    const restaurantResults = await Promise.all(restaurantPromises);
    const restaurantMap = new Map(
      restaurantResults
        .filter(Boolean)
        .map((result: any) => [result.uuid, result.restaurant])
    );

    // Fetch author data (all reviews have the same author_id)
    let authorData = null;
    try {
      const authorResult = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, {
        id: author_id
      });

      if (!authorResult.errors && authorResult.data?.restaurant_users_by_pk) {
        const user = authorResult.data.restaurant_users_by_pk;
        authorData = {
          id: user.id,
          username: user.username || '',
          display_name: user.username || '',
          profile_image: user.profile_image
        };
      }
    } catch (error) {
      console.warn('Failed to fetch author data:', error);
    }

    // Attach author and restaurant data to each review
    const reviewsWithData = reviews.map((review: any) => ({
      ...review,
      author: authorData || {
        id: author_id,
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
    console.error('Get Draft Reviews API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
