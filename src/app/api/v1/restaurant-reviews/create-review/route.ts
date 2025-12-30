import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { CREATE_REVIEW } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { rateLimitOrThrow, createRateLimit } from '@/lib/redis-ratelimit';
import { bumpVersion } from '@/lib/redis-versioning';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurant_uuid,
      author_id,
      title,
      content,
      rating,
      images = [],
      palates = [],
      hashtags = [],
      mentions = [],
      recognitions = [],
      status = 'draft',
      parent_review_id,
    } = body;

    // Rate limiting: 5 requests / 30s per user (prevent spam)
    const rateLimitResult = await rateLimitOrThrow(author_id, createRateLimit);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before creating another review.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }

    // Validation
    if (!restaurant_uuid || !author_id || !content || rating === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: restaurant_uuid, author_id, content, rating' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(restaurant_uuid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid restaurant UUID format' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(author_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid author ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 0 and 5' },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (title && title.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Title must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (!['draft', 'pending', 'approved'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be draft, pending, or approved' },
        { status: 400 }
      );
    }

    // Normalize hashtags (remove #, lowercase)
    const normalizedHashtags = hashtags
      .map((tag: string) => tag.replace(/^#/, '').toLowerCase().trim())
      .filter(Boolean);

    // Validate images structure if provided
    if (images.length > 0) {
      const invalidImages = images.some((img: any) => !img.url || !img.id);
      if (invalidImages) {
        return NextResponse.json(
          { success: false, error: 'Images must have id and url fields' },
          { status: 400 }
        );
      }
    }

    const result = await hasuraMutation(CREATE_REVIEW, {
      object: {
        restaurant_uuid,
        author_id,
        title: title || null,
        content,
        rating: parseFloat(rating.toFixed(1)), // Ensure decimal format (e.g., 4.5)
        images: images.length > 0 ? images : null,
        palates: palates.length > 0 ? palates : null,
        hashtags: normalizedHashtags.length > 0 ? normalizedHashtags : null,
        mentions: mentions.length > 0 ? mentions : null,
        recognitions: recognitions.length > 0 ? recognitions : null,
        status,
        parent_review_id: parent_review_id && UUID_REGEX.test(parent_review_id) ? parent_review_id : null,
      },
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to create review',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const createdReview = result.data?.insert_restaurant_reviews_one;

    if (!createdReview) {
      return NextResponse.json(
        { success: false, error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Cache invalidation: Bump versions for affected caches
    await Promise.all([
      bumpVersion(`v:restaurant:${restaurant_uuid}:reviews`),
      bumpVersion(`v:reviews:all`),
      bumpVersion(`v:user:${author_id}:reviews`),
    ]);

    return NextResponse.json({
      success: true,
      data: createdReview
    });

  } catch (error) {
    console.error('Create Review API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

