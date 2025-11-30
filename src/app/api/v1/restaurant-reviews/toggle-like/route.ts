import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery, hasuraMutation } from '@/app/graphql/hasura-server-client';
import { 
  CHECK_REVIEW_LIKE, 
  INSERT_REVIEW_LIKE, 
  DELETE_REVIEW_LIKE 
} from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { review_id, user_id } = body;

    if (!review_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Review ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(review_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Check if user already liked the review
    const checkResult = await hasuraQuery(CHECK_REVIEW_LIKE, {
      reviewId: review_id,
      userId: user_id
    });

    if (checkResult.errors) {
      console.error('GraphQL errors:', checkResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: checkResult.errors[0]?.message || 'Failed to check like status',
          details: checkResult.errors
        },
        { status: 500 }
      );
    }

    const isLiked = checkResult.data?.restaurant_review_likes?.length > 0;
    let result;

    if (isLiked) {
      // Unlike: Delete the like
      result = await hasuraMutation(DELETE_REVIEW_LIKE, {
        reviewId: review_id,
        userId: user_id
      });
    } else {
      // Like: Insert the like
      result = await hasuraMutation(INSERT_REVIEW_LIKE, {
        reviewId: review_id,
        userId: user_id
      });
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to toggle like',
          details: result.errors
        },
        { status: 500 }
      );
    }

    // Get updated likes count (trigger should have updated it)
    // We'll need to fetch the review to get the updated count
    // For now, return success - the frontend can refetch if needed

    return NextResponse.json({
      success: true,
      data: {
        liked: !isLiked, // New like status
        action: isLiked ? 'unliked' : 'liked'
      }
    });

  } catch (error) {
    console.error('Toggle Like API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check like status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const review_id = searchParams.get('review_id');
    const user_id = searchParams.get('user_id');

    if (!review_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Review ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(review_id) || !UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(CHECK_REVIEW_LIKE, {
      reviewId: review_id,
      userId: user_id
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to check like status',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const isLiked = result.data?.restaurant_review_likes?.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        liked: isLiked
      }
    });

  } catch (error) {
    console.error('Check Like Status API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

