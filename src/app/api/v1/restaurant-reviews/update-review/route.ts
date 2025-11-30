import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { UPDATE_REVIEW } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      rating,
      images,
      palates,
      hashtags,
      mentions,
      recognitions,
      status,
    } = body;

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

    // Build update object with only provided fields
    const changes: Record<string, any> = {};

    if (title !== undefined) {
      if (title === null || title === '') {
        changes.title = null;
      } else {
        if (title.length > 500) {
          return NextResponse.json(
            { success: false, error: 'Title must be 500 characters or less' },
            { status: 400 }
          );
        }
        changes.title = title;
      }
    }

    if (content !== undefined) {
      if (content.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Content must be at least 10 characters' },
          { status: 400 }
        );
      }
      changes.content = content;
    }

    if (rating !== undefined) {
      if (rating < 0 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Rating must be between 0 and 5' },
          { status: 400 }
        );
      }
      changes.rating = parseFloat(rating.toFixed(1));
    }

    if (images !== undefined) {
      if (images === null || images.length === 0) {
        changes.images = null;
      } else {
        // Validate images structure
        const invalidImages = images.some((img: any) => !img.url || !img.id);
        if (invalidImages) {
          return NextResponse.json(
            { success: false, error: 'Images must have id and url fields' },
            { status: 400 }
          );
        }
        changes.images = images;
      }
    }

    if (palates !== undefined) {
      changes.palates = palates === null || palates.length === 0 ? null : palates;
    }

    if (hashtags !== undefined) {
      if (hashtags === null || hashtags.length === 0) {
        changes.hashtags = null;
      } else {
        // Normalize hashtags (remove #, lowercase)
        const normalizedHashtags = hashtags
          .map((tag: string) => tag.replace(/^#/, '').toLowerCase().trim())
          .filter(Boolean);
        changes.hashtags = normalizedHashtags.length > 0 ? normalizedHashtags : null;
      }
    }

    if (mentions !== undefined) {
      changes.mentions = mentions === null || mentions.length === 0 ? null : mentions;
    }

    if (recognitions !== undefined) {
      changes.recognitions = recognitions === null || recognitions.length === 0 ? null : recognitions;
    }

    if (status !== undefined) {
      if (!['draft', 'pending', 'approved'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status. Must be draft, pending, or approved' },
          { status: 400 }
        );
      }
      changes.status = status;
    }

    // Check if there are any changes
    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await hasuraMutation(UPDATE_REVIEW, {
      id,
      changes
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to update review',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const updatedReview = result.data?.update_restaurant_reviews_by_pk;

    if (!updatedReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReview
    });

  } catch (error) {
    console.error('Update Review API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

