import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEWS_BY_RESTAURANT } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurant_uuid = searchParams.get('restaurant_uuid');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || 'approved'; // Default to approved

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
      offset,
      status
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

    const reviews = result.data?.restaurant_reviews || [];
    const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total,
        limit,
        offset
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

