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

    const replies = data?.comment?.replies?.nodes ?? [];

    // Runtime validation - more lenient approach
    if (!Array.isArray(replies)) {
      throw new Error('Invalid replies data received from GraphQL - not an array');
    }

    return replies;
  }

  async getUserReviews(userId: number, first = 16, after: string | null = null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo; userCommentCount: number }> {
    const { data } = await client.query<{
      comments: {
        nodes: GraphQLReview[];
        pageInfo: PageInfo;
      };
      userCommentCount: number;
    }>({
      query: GET_USER_REVIEWS,
      variables: { userId: userId.toString(), first, after },
      context: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
      fetchPolicy: "no-cache",
    });

    const reviews = data?.comments?.nodes ?? [];
    const pageInfo = data?.comments?.pageInfo ?? { endCursor: null, hasNextPage: false };
    const userCommentCount = data?.userCommentCount ?? 0;

    // Runtime validation - more lenient approach
    if (!Array.isArray(reviews)) {
      throw new Error('Invalid review data received from GraphQL - not an array');
    }

    return { reviews, pageInfo, userCommentCount };
  }

  async likeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
    const response = await request.POST(
      `/wp-json/v1/like-comment`,
      {
        body: JSON.stringify({
          comment_id: commentId,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      userLiked: (response as any)?.userLiked ?? false,
      likesCount: (response as any)?.likesCount ?? 0
    };
  }

  async unlikeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
    const response = await request.POST(
      `/wp-json/v1/unlike-comment`,
      {
        body: JSON.stringify({
          comment_id: commentId,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      userLiked: (response as any)?.userLiked ?? false,
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
      variables: { restaurantId: restaurantId.toString(), first, after },
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

  async getRestaurantReviewsById(restaurantId: string | number): Promise<GraphQLReview | null> {
    try {
      const { data } = await client.query<{
        reviews: {
          nodes: GraphQLReview[];
        };
      }>({
        query: GET_REVIEWS_BY_RESTAURANT_ID,
        variables: { restaurantId: restaurantId.toString() },
        fetchPolicy: "no-cache",
      });

      const reviews = data?.reviews?.nodes ?? [];
      
      if (!Array.isArray(reviews) || reviews.length === 0) {
        return null;
      }

      return reviews[0] || null;
    } catch (error) {
      console.error('Error fetching restaurant reviews by ID:', error);
      return null;
    }
  }

  async postReview(payload: any, accessToken: string): Promise<any> {
    const response = await request.POST(
      `/wp-json/v1/review`,
      {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response;
  }

  // Placeholder implementations for missing interface methods
  async createReview<T>(data: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: T }> {
    throw new Error('Method not implemented');
  }

  async getReviewDrafts(accessToken?: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await request.GET('/wp-json/wp/v2/api/review-drafts', {
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      }
      
      // If response has a data property (common REST API pattern)
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray((response as { data: unknown }).data) 
          ? (response as { data: Record<string, unknown>[] }).data 
          : [];
      }
      
      // If response has a different structure, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching review drafts from API:', error);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  }

  async deleteReviewDraft(draftId: number, accessToken?: string, force?: boolean): Promise<void> {
    try {
      await request.DELETE(
        `/wp-json/wp/v2/api/review-drafts/${draftId}`,
        {
          headers: {
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          },
        }
      );
    } catch (error) {
      console.error('Error deleting review draft:', error);
      throw error;
    }
  }

  async updateReviewDraft(draftId: number, data: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: unknown }> {
    try {
      const response = await request.PUT(
        `/wp-json/wp/v2/api/review-drafts/${draftId}`,
        {
          body: JSON.stringify(data),
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response as { status: number; data: unknown };
    } catch (error) {
      console.error('Error updating review draft:', error);
      throw error;
    }
  }

  async getReviewById(reviewId: number, accessToken?: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.GET(`/wp-json/wp/v2/api/review-drafts/${reviewId}`, {
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      return response as Record<string, unknown>;
    } catch (error) {
      console.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  async likeReview(reviewId: number, accessToken?: string): Promise<Record<string, unknown>> {
    throw new Error('Method not implemented');
  }
}