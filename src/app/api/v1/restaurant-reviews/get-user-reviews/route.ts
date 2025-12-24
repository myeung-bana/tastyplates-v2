import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_REVIEWS, GET_USER_REVIEWS_BY_STATUS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const author_id = searchParams.get('author_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // Optional status filter

    if (!author_id) {
      return NextResponse.json(
        { success: false, error: 'Author ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(author_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid author ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Use status-filtered query if status is provided, otherwise use general query
    const query = status ? GET_USER_REVIEWS_BY_STATUS : GET_USER_REVIEWS;
    const queryVariables: any = {
      authorId: author_id,
      limit: Math.min(limit, 100), // Cap at 100
      offset
    };
    
    // Only include status if using the status-filtered query
    if (status) {
      queryVariables.status = status;
    }

    const result = await hasuraQuery(query, queryVariables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch user reviews',
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
    console.error('Get User Reviews API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

