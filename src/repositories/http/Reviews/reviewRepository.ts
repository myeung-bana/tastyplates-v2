import { ReviewRepo } from "@/repositories/interface/user/review";
import { GraphQLReview, PageInfo } from "@/types/graphql";
import HttpMethods from "../requests";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";

const request = new HttpMethods();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReviewRepository implements ReviewRepo {
  async getAllReviews(first = 16, after: string | null = null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }> {
    try {
      const offset = after ? parseInt(after) || 0 : 0;
      
      const response = await reviewV2Service.getAllReviews({
        limit: first,
        offset: offset
      });

      // Transform to legacy format
      const pageInfo: PageInfo = {
        endCursor: response.hasMore ? (offset + first).toString() : null,
        hasNextPage: response.hasMore
      };

      return { 
        reviews: response.reviews as GraphQLReview[], 
        pageInfo 
      };
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return { 
        reviews: [], 
        pageInfo: { endCursor: null, hasNextPage: false } 
      };
    }
  }

  async getCommentReplies(id: string): Promise<GraphQLReview[]> {
    try {
      // Check if ID is a UUID (Hasura format)
      if (UUID_REGEX.test(id)) {
        const params = new URLSearchParams({ parent_review_id: id });
        const response = await fetch(`/api/v1/restaurant-reviews/get-replies?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error((errorData as any).error || `Failed to fetch replies: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch replies');
        }
        return result.data || [];
      } else {
        // Legacy numeric ID - return empty array or handle differently
        console.warn('Legacy numeric review ID not supported in V2 API:', id);
        return [];
      }
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  }

  async getUserReviews(userId: number, first = 16, after: string | null = null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo; userCommentCount: number }> {
    try {
      const offset = after ? parseInt(after) || 0 : 0;
      
      // Assume userId is now a UUID string
      const response = await reviewV2Service.getUserReviews(userId.toString(), {
        limit: first,
        offset: offset
      });

      const pageInfo: PageInfo = {
        endCursor: response.hasMore ? (offset + first).toString() : null,
        hasNextPage: response.hasMore
      };

      return { 
        reviews: response.reviews as GraphQLReview[], 
        pageInfo,
        userCommentCount: response.total
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return { 
        reviews: [], 
        pageInfo: { endCursor: null, hasNextPage: false },
        userCommentCount: 0
      };
    }
  }

  async getRestaurantReviews(restaurantId: string | number, first = 16, after: string | null = null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }> {
    try {
      const offset = after ? parseInt(after) || 0 : 0;
      
      // Convert restaurantId to UUID if it's a number
      const restaurantUuid = typeof restaurantId === 'string' && UUID_REGEX.test(restaurantId) 
        ? restaurantId 
        : restaurantId.toString();

      const response = await reviewV2Service.getReviewsByRestaurant(restaurantUuid, {
        limit: first,
        offset: offset
      });

      const pageInfo: PageInfo = {
        endCursor: response.hasMore ? (offset + first).toString() : null,
        hasNextPage: response.hasMore
      };

      return { 
        reviews: response.reviews as GraphQLReview[], 
        pageInfo 
      };
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error);
      return { 
        reviews: [], 
        pageInfo: { endCursor: null, hasNextPage: false } 
      };
    }
  }

  async likeComment(commentId: number | string, accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.POST(
        `/api/v1/restaurant-reviews/like-review`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            review_id: commentId.toString()
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  async unlikeComment(commentId: number | string, accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.POST(
        `/api/v1/restaurant-reviews/unlike-review`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            review_id: commentId.toString()
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  }

  async postReview(payload: Record<string, unknown>, accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.POST(
        `/api/v1/restaurant-reviews/create-review`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      return response;
    } catch (error) {
      console.error('Error posting review:', error);
      throw error;
    }
  }

  async updateReview(reviewId: string, payload: Record<string, unknown>, accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.POST(
        `/api/v1/restaurant-reviews/update-review`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            review_id: reviewId,
            ...payload
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: string, accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await request.DELETE(
        `/api/v1/restaurant-reviews/delete-review`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            review_id: reviewId
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}
