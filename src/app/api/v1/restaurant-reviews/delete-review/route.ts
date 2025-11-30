import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { DELETE_REVIEW } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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

    const result = await hasuraMutation(DELETE_REVIEW, { id });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to delete review',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const deletedReview = result.data?.update_restaurant_reviews_by_pk;

    if (!deletedReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedReview
    });

  } catch (error) {
    console.error('Delete Review API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

