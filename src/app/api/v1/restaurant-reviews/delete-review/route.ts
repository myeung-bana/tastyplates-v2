import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { DELETE_REVIEW, DECREMENT_REPLIES_COUNT } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { bumpVersion } from '@/lib/redis-versioning';
import { rebuildRatingSummary } from '@/lib/rebuildRatingSummary';

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

    // If the deleted row was a comment (has parent), decrement parent's replies_count
    if (deletedReview.parent_review_id) {
      hasuraMutation(DECREMENT_REPLIES_COUNT, { id: deletedReview.parent_review_id }).catch((err) => {
        console.error('[delete-review] Failed to decrement replies_count:', err);
      });
    }

    // Recompute rating aggregates after soft-delete
    if (deletedReview.restaurant_uuid) {
      rebuildRatingSummary(deletedReview.restaurant_uuid).catch((e) =>
        console.error('[delete-review] rebuildRatingSummary failed:', e)
      );

      await Promise.all([
        bumpVersion(`v:restaurant:${deletedReview.restaurant_uuid}:reviews`),
        bumpVersion(`v:reviews:all`),
        bumpVersion(`v:restaurants:all`),
      ]);
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

