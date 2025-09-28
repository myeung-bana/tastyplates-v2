import client from "@/app/graphql/client";
import { GET_ALL_RECENT_REVIEWS, GET_COMMENT_REPLIES, GET_RESTAURANT_REVIEWS, GET_REVIEWS_BY_RESTAURANT_ID, GET_USER_REVIEWS } from "@/app/graphql/Reviews/reviewsQueries";
import { ReviewRepo } from "@/repositories/interface/user/review";
import { GraphQLReview, PageInfo } from "@/types/graphql";
import { isGraphQLReviewArray } from "@/utils/typeGuards";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class ReviewRepository implements ReviewRepo {
  async getAllReviews(first = 16, after: string | null = null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }> {
    const { data } = await client.query<{
      comments: {
        nodes: GraphQLReview[];
        pageInfo: PageInfo;
      };
    }>({
      query: GET_ALL_RECENT_REVIEWS,
      variables: { first, after },
      context: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
      fetchPolicy: "no-cache",
    });

    const reviews = data?.comments?.nodes ?? [];
    const pageInfo = data?.comments?.pageInfo ?? { endCursor: null, hasNextPage: false };

    // Runtime validation - more lenient approach
    if (!Array.isArray(reviews)) {
      throw new Error('Invalid review data received from GraphQL - not an array');
    }

    // Validate that we have at least some basic structure
    if (reviews.length > 0) {
      const firstReview = reviews[0];
      if (!firstReview || typeof firstReview !== 'object' || !firstReview.id || !firstReview.databaseId) {
        console.warn('Review data structure may not match expected format:', firstReview);
        // Don't throw error, just log warning and continue
      }
    }

    return { reviews, pageInfo };
  }

  async getCommentReplies(id: string): Promise<GraphQLReview[]> {
    const { data } = await client.query<{
      comment: {
        replies: {
          nodes: GraphQLReview[];
        };
      };
    }>({
      query: GET_COMMENT_REPLIES,
      variables: { id },
      fetchPolicy: "no-cache",
    });

    console.log('🔍 GraphQL reply data:', data);
    const replies = data?.comment?.replies?.nodes || [];
    console.log('📝 Extracted replies:', replies);
    
    // Runtime validation - more lenient for replies since they have different structure
    if (!Array.isArray(replies)) {
      throw new Error('Invalid reply data received from GraphQL - not an array');
    }

    // Validate that we have at least some basic structure for replies
    if (replies.length > 0) {
      const firstReply = replies[0];
      if (!firstReply || typeof firstReply !== 'object' || !firstReply.id || !firstReply.databaseId) {
        console.warn('Reply data structure may not match expected format:', firstReply);
        // Don't throw error, just log warning and continue
      }
    }

    return replies;
  }

  async createReview<T>(form: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: T }> {
    const response = await request.POST('/wp-json/wp/v2/api/comments', {
      body: JSON.stringify(form),
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (response as any).status || 200;
    return {
      status,
      data: response as T
    }
  }

  async getReviewDrafts(accessToken?: string): Promise<GraphQLReview[]> {
    try {
      const response = await request.GET('/wp-json/wp/v2/api/comments?type=listing_draft&status=hold', {
        headers: {
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      });

      const drafts = response || [];
      
      // Runtime validation
      if (!isGraphQLReviewArray(drafts)) {
        throw new Error('Invalid draft data received from API');
      }

      return drafts;
    } catch (error) {
      console.error("Failed to fetch review drafts", error);
      throw new Error('Failed to fetch review drafts');
    }
  }

  async deleteReviewDraft(draftId: number, accessToken?: string, force = false): Promise<void> {
    try {
      const query = force ? '?force=true' : '';
      await request.DELETE(`/wp-json/wp/v2/api/comments/${draftId}${query}`, {
        headers: {

          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      });
    } catch (error) {
      console.error("Failed to delete review draft", error);
      throw new Error('Failed to delete review draft');
    }
  }

  async getUserReviews(userId: number, first = 16, after: string | null = null): Promise<{ userCommentCount: number; reviews: GraphQLReview[]; pageInfo: PageInfo }> {
    const { data } = await client.query<{
      userCommentCount: number;
      comments: {
        nodes: GraphQLReview[];
        pageInfo: PageInfo;
      };
    }>({
      query: GET_USER_REVIEWS,
      variables: { userId, first, after },
    });

    const reviews = data?.comments?.nodes ?? [];
    const pageInfo = data?.comments?.pageInfo ?? { endCursor: null, hasNextPage: false };

    // Runtime validation - more lenient approach
    if (!Array.isArray(reviews)) {
      throw new Error('Invalid review data received from GraphQL - not an array');
    }

    return {
      userCommentCount: data?.userCommentCount ?? 0,
      reviews,
      pageInfo
    };
  }

  async likeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    const response = await request.POST('/wp-json/wp/v2/api/comments/comment-like', {
      body,
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userLiked: (response as any)?.userLiked ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      likesCount: (response as any)?.likesCount ?? 0
    };
  }

  async unlikeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    const response = await request.POST('/wp-json/wp/v2/api/comments/comment-unlike', {
      body,
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userLiked: (response as any)?.userLiked ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      likesCount: (response as any)?.likesCount ?? 0
    };
  }

  async getRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }> {
    const { data } = await client.query<{
      comments: {
        nodes: GraphQLReview[];
        pageInfo: PageInfo;
      };
    }>({
      query: GET_RESTAURANT_REVIEWS,
      variables: { restaurantId, first, after },
      context: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
      fetchPolicy: "no-cache",
    });

    const reviews = data?.comments?.nodes ?? [];
    const pageInfo = data?.comments?.pageInfo ?? { endCursor: null, hasNextPage: false };

    // Runtime validation - more lenient approach
    if (!Array.isArray(reviews)) {
      throw new Error('Invalid review data received from GraphQL - not an array');
    }

    return { reviews, pageInfo };
  }

  async getRestaurantReviewsById(restaurantId: string | number): Promise<GraphQLReview> {
    if (!restaurantId) throw new Error('Missing restaurantId');
    try {
      const { data } = await client.query<{
        reviews: {
          nodes: GraphQLReview[];
        };
      }>({
        query: GET_REVIEWS_BY_RESTAURANT_ID,
        variables: { restaurantId },
        fetchPolicy: "no-cache",
      });
      if (data?.reviews?.nodes?.length) {
        const review = data.reviews.nodes[0];
        // Basic validation - more lenient approach
        if (!review || typeof review !== 'object' || !review.id) {
          console.warn('Review data structure may not match expected format:', review);
        }
        return review;
      }
    } catch {
    }
    const response = await request.GET(`/wp-json/restaurant/v1/reviews/?restaurantId=${restaurantId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((response as any)?.error || (response as any)?.status >= 400) {
      throw new Error('Failed to fetch from WordPress');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (response as any)?.reviews?.[0] || response;
    // Basic validation - more lenient approach
    if (!data || typeof data !== 'object') {
      console.warn('Review data structure may not match expected format:', data);
    }
    return data;
  }

  async likeReview(reviewId: number, accessToken?: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.POST('/wp-json/wp/v2/api/like-review', {
        body: JSON.stringify({ review_id: reviewId }),
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      });
      return response as Record<string, unknown>;
    } catch (error) {
      console.error('Error liking review:', error);
      throw error;
    }
  }
}