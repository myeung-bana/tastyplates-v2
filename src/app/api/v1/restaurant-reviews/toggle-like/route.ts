import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery, hasuraMutation } from '@/app/graphql/hasura-server-client';
import { 
  CHECK_REVIEW_LIKE, 
  INSERT_REVIEW_LIKE, 
  DELETE_REVIEW_LIKE 
} from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { rateLimitOrThrow, likeRateLimit } from '@/lib/redis-ratelimit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Priority 4 (like-button-review-enhancements): minimize round-trips.
// We do 2 round-trips: (1) check + read count, (2) insert/delete. Count is computed from before + action (no 3rd read).

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { review_id, user_id } = body;

    // Rate limiting: 20 requests / 10s per user (prevent spam clicks)
    const rateLimitResult = await rateLimitOrThrow(user_id, likeRateLimit);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please slow down.',
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

    // Combined query: check if liked + read current denormalized likes_count (used to detect broken triggers)
    const checkResult = await hasuraQuery(
      `query CheckReviewLikeAndCount($reviewId: uuid!, $userId: uuid!) {
        user_like: restaurant_review_likes(
          where: { review_id: { _eq: $reviewId }, user_id: { _eq: $userId } }
          limit: 1
        ) { id }
        review: restaurant_reviews_by_pk(id: $reviewId) { likes_count }
      }`,
      { reviewId: review_id, userId: user_id }
    );

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

    const isLiked = (checkResult.data?.user_like?.length ?? 0) > 0;
    const beforeLikesCount = checkResult.data?.review?.likes_count ?? null;
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

    // Compute new count from before + action (Priority 4: avoid extra round-trip to read count).
    // Trigger still updates restaurant_reviews.likes_count in DB for other readers.
    const before = beforeLikesCount ?? 0;
    const likesCount = Math.max(0, isLiked ? before - 1 : before + 1);
    const action = isLiked ? 'unliked' : 'liked';

    return NextResponse.json({
      success: true,
      data: {
        liked: !isLiked,
        action,
        likesCount
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

    // Combined query: Get like status and denormalized likes_count
    const combinedQuery = await hasuraQuery(
      `query GetReviewLikeStatusAndCount($reviewId: uuid!, $userId: uuid!) {
        user_like: restaurant_review_likes(
          where: { review_id: { _eq: $reviewId }, user_id: { _eq: $userId } }
          limit: 1
        ) { id }
        review: restaurant_reviews_by_pk(id: $reviewId) { likes_count }
      }`,
      { reviewId: review_id, userId: user_id }
    );

    if (combinedQuery.errors) {
      console.error('GraphQL errors:', combinedQuery.errors);
      return NextResponse.json(
        {
          success: false,
          error: combinedQuery.errors[0]?.message || 'Failed to check like status',
          details: combinedQuery.errors
        },
        { status: 500 }
      );
    }

    const isLiked = (combinedQuery.data?.user_like?.length ?? 0) > 0;
    let likesCount = combinedQuery.data?.review?.likes_count ?? 0;

    // If user_like exists but likes_count is 0, triggers are likely broken. Fallback once.
    if (isLiked && likesCount === 0) {
      const aggQuery = await hasuraQuery(
        `query GetReviewLikesCountAgg($reviewId: uuid!) {
          restaurant_review_likes_aggregate(where: { review_id: { _eq: $reviewId } }) {
            aggregate { count }
          }
        }`,
        { reviewId: review_id }
      );
      const aggCount = aggQuery.data?.restaurant_review_likes_aggregate?.aggregate?.count ?? 0;
      likesCount = aggCount;

      // Best-effort self-heal
      try {
        await hasuraMutation(
          `mutation HealLikesCount($reviewId: uuid!, $likesCount: Int!) {
            update_restaurant_reviews_by_pk(
              pk_columns: { id: $reviewId }
              _set: { likes_count: $likesCount }
            ) { id }
          }`,
          { reviewId: review_id, likesCount: aggCount }
        );
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        liked: isLiked,
        likesCount: likesCount
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

