import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEW_BY_ID, GET_REVIEW_WITH_LIKE_STATUS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id'); // Optional: to check like status

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // If userId is provided, get review with like status
    const query = userId && UUID_REGEX.test(userId)
      ? GET_REVIEW_WITH_LIKE_STATUS
      : GET_REVIEW_BY_ID;

    const variables = userId && UUID_REGEX.test(userId)
      ? { reviewId: id, userId }
      : { id };

    const result = await hasuraQuery(query, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch review',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const review = userId && UUID_REGEX.test(userId)
      ? result.data?.restaurant_reviews_by_pk
      : result.data?.restaurant_reviews_by_pk;

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Add user_liked flag if userId was provided
    const userLiked = userId && UUID_REGEX.test(userId)
      ? (review.restaurant_review_likes?.length > 0 || false)
      : undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...review,
        user_liked: userLiked
      }
    });

  } catch (error) {
    console.error('Get Review by ID API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

