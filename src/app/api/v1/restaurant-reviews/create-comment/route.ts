import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation, hasuraQuery } from '@/app/graphql/hasura-server-client';
import { CREATE_REVIEW, GET_REVIEW_BY_ID } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { rateLimitOrThrow, createRateLimit } from '@/lib/redis-ratelimit';
import { bumpVersion } from '@/lib/redis-versioning';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      parent_review_id,  // Required: UUID of the review being replied to
      author_id,         // Required: UUID of the user creating the comment
      content,           // Required: Comment text
      restaurant_uuid,   // Optional: Can be derived from parent review if not provided
    } = body;

    // Rate limiting: 5 requests / 30s per user (prevent spam)
    const rateLimitResult = await rateLimitOrThrow(author_id, createRateLimit);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait before posting another comment.',
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
    if (!parent_review_id || !author_id || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: parent_review_id, author_id, content' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(parent_review_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parent_review_id format. Expected UUID.' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(author_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid author_id format. Expected UUID.' },
        { status: 400 }
      );
    }

    if (content.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Content must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // If restaurant_uuid not provided, fetch it from parent review
    let finalRestaurantUuid = restaurant_uuid;
    if (!finalRestaurantUuid) {
      try {
        const parentResult = await hasuraQuery(GET_REVIEW_BY_ID, {
          id: parent_review_id
        });

        if (parentResult.errors || !parentResult.data?.restaurant_reviews_by_pk) {
          return NextResponse.json(
            { success: false, error: 'Parent review not found' },
            { status: 404 }
          );
        }

        finalRestaurantUuid = parentResult.data.restaurant_reviews_by_pk.restaurant_uuid;
      } catch (error) {
        console.error('Error fetching parent review:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch parent review. Please provide restaurant_uuid.' },
          { status: 400 }
        );
      }
    }

    if (!finalRestaurantUuid || !UUID_REGEX.test(finalRestaurantUuid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid restaurant_uuid format' },
        { status: 400 }
      );
    }

    // Create comment (reply) using the same mutation as reviews
    // Comments are reviews with parent_review_id set
    // Build object with only the fields we need (omit rating, title, etc. for comments)
    const commentObject: any = {
      restaurant_uuid: finalRestaurantUuid,
      author_id,
      content,
      status: 'approved', // Comments are auto-approved
      parent_review_id,   // This makes it a comment/reply
    };

    // Log the IDs being used for debugging
    console.log('Creating comment with:', {
      parent_review_id,
      author_id,
      restaurant_uuid: finalRestaurantUuid,
      content_length: content.length
    });

    // Only include optional fields if they have values (omit null fields)
    // Comments typically don't have title, rating, images, etc.
    
    const result = await hasuraMutation(CREATE_REVIEW, {
      object: commentObject,
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      console.error('Failed IDs:', {
        parent_review_id,
        author_id,
        restaurant_uuid: finalRestaurantUuid
      });
      
      // Check if error is about invalid ID
      const invalidIdError = result.errors.find((err: any) => 
        err.message?.includes('invalid') || 
        err.message?.includes('ID') ||
        err.message?.includes('not found')
      );
      
      if (invalidIdError) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid ID: ${invalidIdError.message}. Please check parent_review_id, author_id, and restaurant_uuid.`,
            details: result.errors
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to create comment',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const createdComment = result.data?.insert_restaurant_reviews_one;

    if (!createdComment) {
      return NextResponse.json(
        { success: false, error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Cache invalidation: Bump version for parent review's replies
    await bumpVersion(`v:review:${parent_review_id}:replies`);

    return NextResponse.json({
      success: true,
      data: createdComment
    });

  } catch (error) {
    console.error('Create Comment API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

