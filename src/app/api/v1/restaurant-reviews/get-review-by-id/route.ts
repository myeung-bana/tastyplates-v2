import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEW_BY_ID, GET_REVIEW_WITH_LIKE_STATUS, CHECK_REVIEW_LIKE } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

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

    // Fetch review data
    const query = userId && UUID_REGEX.test(userId)
      ? GET_REVIEW_WITH_LIKE_STATUS
      : GET_REVIEW_BY_ID;

    const variables = userId && UUID_REGEX.test(userId)
      ? { reviewId: id }
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

    const review = result.data?.restaurant_reviews_by_pk;

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user liked the review separately (if userId is provided)
    let userLiked: boolean | undefined = undefined;
    if (userId && UUID_REGEX.test(userId)) {
      try {
        const likeCheckResult = await hasuraQuery(CHECK_REVIEW_LIKE, {
          reviewId: id,
          userId: userId
        });

        if (!likeCheckResult.errors && likeCheckResult.data?.restaurant_review_likes) {
          userLiked = likeCheckResult.data.restaurant_review_likes.length > 0;
        }
      } catch (likeError) {
        console.error('Error checking review like status:', likeError);
        // Don't fail the request if like check fails, just set to undefined
        userLiked = undefined;
      }
    }

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

