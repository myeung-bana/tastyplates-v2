import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_REVIEW_REPLIES, GET_REVIEW_BY_ID, CHECK_REVIEW_LIKES_BATCH } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import { ReviewV2 } from '@/app/api/v1/services/reviewV2Service';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parent_review_id = searchParams.get('parent_review_id');
    const user_id = searchParams.get('user_id'); // Optional: to check if user liked each reply

    if (!parent_review_id) {
      return NextResponse.json(
        { success: false, error: 'parent_review_id is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(parent_review_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parent_review_id format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Fetch replies from Hasura
    const result = await hasuraQuery(GET_REVIEW_REPLIES, {
      parentReviewId: parent_review_id
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch replies',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const replies = result.data?.restaurant_reviews || [];

    // Fetch parent review to get restaurant info for transformation
    let restaurantDatabaseId = 0;
    let restaurantUuid = '';
    try {
      const parentResult = await hasuraQuery(GET_REVIEW_BY_ID, {
        id: parent_review_id
      });
      if (parentResult.data?.restaurant_reviews_by_pk) {
        restaurantUuid = parentResult.data.restaurant_reviews_by_pk.restaurant_uuid || '';
        if (parentResult.data.restaurant_reviews_by_pk.restaurant) {
          // Extract numeric ID from restaurant UUID if needed
          const restUuid = parentResult.data.restaurant_reviews_by_pk.restaurant.uuid;
          restaurantDatabaseId = parseInt(restUuid.replace(/-/g, '').substring(0, 8), 16) % 2147483647;
        }
      }
    } catch (error) {
      console.warn('Could not fetch parent review for restaurant ID:', error);
    }

    // Fetch author data separately for all unique authors (similar to get-reviews-by-restaurant)
    const authorIds = [...new Set(replies.map((r: any) => r.author_id).filter(Boolean))];
    
    // Fetch all authors in parallel
    const authorPromises = authorIds.map(async (authorId: string) => {
      try {
        const authorResult = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, {
          id: authorId
        });

        if (!authorResult.errors && authorResult.data?.restaurant_users_by_pk) {
          const user = authorResult.data.restaurant_users_by_pk;
          return {
            id: authorId,
            author: {
              id: user.id,
              username: user.username || '',
              display_name: user.display_name || user.username || 'Unknown User',
              profile_image: user.profile_image || null,
              palates: user.palates || null,
            }
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch author ${authorId}:`, error);
      }
      return null;
    });

    const authorResults = await Promise.all(authorPromises);
    const authorMap = new Map(
      authorResults
        .filter(Boolean)
        .map((result: any) => [result.id, result.author])
    );

    // Fetch like status for all replies if user_id is provided
    const likedReviewIds = new Set<string>();
    if (user_id && replies.length > 0) {
      try {
        const reviewIds = replies.map((r: any) => r.id).filter(Boolean);
        if (reviewIds.length > 0) {
          const likesResult = await hasuraQuery(CHECK_REVIEW_LIKES_BATCH, {
            reviewIds,
            userId: user_id
          });
          
          if (!likesResult.errors && likesResult.data?.restaurant_review_likes) {
            likesResult.data.restaurant_review_likes.forEach((like: any) => {
              likedReviewIds.add(like.review_id);
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch like status:', error);
        // Continue without like status
      }
    }

    // Transform Hasura replies to GraphQLReview format using the transformer
    const transformedReplies = replies.map((reply: any): ReviewV2 => {
      // Check if user liked this reply
      const userLiked = user_id ? likedReviewIds.has(reply.id) : false;

      // Get author data from the map
      const authorData = authorMap.get(reply.author_id);

      // Build ReviewV2 format
      const reviewV2: ReviewV2 = {
        id: reply.id,
        restaurant_uuid: restaurantUuid, // Use restaurant_uuid from parent review
        author_id: reply.author_id,
        parent_review_id: parent_review_id,
        title: null,
        content: reply.content || '',
        rating: 0, // Replies don't have ratings
        images: null,
        palates: null,
        hashtags: null,
        mentions: null,
        recognitions: null,
        likes_count: reply.likes_count || 0,
        replies_count: 0,
        status: 'approved',
        is_pinned: false,
        is_featured: false,
        created_at: reply.created_at || new Date().toISOString(),
        updated_at: reply.updated_at || reply.created_at || new Date().toISOString(),
        published_at: reply.created_at || null,
        deleted_at: null,
        author: authorData ? {
          id: authorData.id,
          username: authorData.username || '',
          display_name: authorData.display_name || authorData.username || 'Unknown User',
          profile_image: authorData.profile_image || null,
          palates: authorData.palates || null,
        } : undefined,
        user_liked: userLiked,
      };

      return reviewV2;
    }).map((reviewV2: ReviewV2) => transformReviewV2ToGraphQLReview(reviewV2, restaurantDatabaseId));

    return NextResponse.json({
      success: true,
      data: transformedReplies
    });

  } catch (error) {
    console.error('Get Replies API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

