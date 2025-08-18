import client from "@/app/graphql/client";
import { GET_ALL_RECENT_REVIEWS, GET_COMMENT_REPLIES, GET_RESTAURANT_REVIEWS, GET_REVIEWS_BY_RESTAURANT_ID, GET_USER_REVIEWS } from "@/app/graphql/Reviews/reviewsQueries";

const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;
export class ReviewRepository {
  private static async request(endpoint: string, options: RequestInit, jsonResponse = false): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    let data = null;

    if (jsonResponse) {
      try {
        data = await response.json();
      } catch (err) {
        console.error("Failed to parse JSON:", err);
      }
    }

    return {
      status: response.status,
      data,
    };
  }

  static async getAllReviews(first = 16, after: string | null = null, accessToken?: string) {
    const { data } = await client.query({
      query: GET_ALL_RECENT_REVIEWS,
      variables: { first, after },
      context: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
      fetchPolicy: "no-cache",
    });

    return {
      reviews: data.comments.nodes ?? [],
      pageInfo: data.comments.pageInfo ?? { endCursor: null, hasNextPage: false }
    };
  }

  static async getCommentReplies(id: string) {
    const { data } = await client.query({
      query: GET_COMMENT_REPLIES,
      variables: { id },
      fetchPolicy: "no-cache",
    });

    return data?.comment?.replies?.nodes || [];
  }

  static async createReview<T>(data: any, accessToken: string): Promise<{ status: number; data: T }> {
    return this.request('/wp-json/wp/v2/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }, true);
  }

  static async getReviewDrafts(accessToken?: string): Promise<any> {
    try {
      const response = await this.request('/wp-json/wp/v2/api/comments?type=listing_draft&status=hold', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      }, true);

      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch review drafts", error);
      throw new Error('Failed to fetch review drafts');
    }
  }

  static async deleteReviewDraft(draftId: number, accessToken?: string, force = false): Promise<void> {
    try {
      const query = force ? '?force=true' : '';
      await this.request(`/wp-json/wp/v2/api/comments/${draftId}${query}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      });
    } catch (error) {
      console.error("Failed to delete review draft", error);
      throw new Error('Failed to delete review draft');
    }
  }

  static async getUserReviews(userId: number, first = 16, after: string | null = null) {
    const { data } = await client.query({
      query: GET_USER_REVIEWS,
      variables: { userId, first, after },
    });

    return {
      userCommentCount: data.userCommentCount ?? 0,
      reviews: data.comments.nodes ?? [],
      pageInfo: data.comments.pageInfo ?? { endCursor: null, hasNextPage: false }
    };
  }

  static async likeComment(commentId: number, accessToken: string): Promise<any> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    return this.request('/wp-json/wp/v2/api/comments/comment-like', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }, true);
  }

  static async unlikeComment(commentId: number, accessToken: string): Promise<any> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    return this.request('/wp-json/wp/v2/api/comments/comment-unlike', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }, true);
  }

  static async getRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string) {
    const { data } = await client.query({
      query: GET_RESTAURANT_REVIEWS,
      variables: { restaurantId, first, after },
      context: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
      fetchPolicy: "no-cache",
    });

    return {
      reviews: data.comments.nodes ?? [],
      pageInfo: data.comments.pageInfo ?? { endCursor: null, hasNextPage: false }
    };
  }
  static async getRestaurantReviewsById(restaurantId: string | number) {
    if (!restaurantId) throw new Error('Missing restaurantId');
    try {
      const { data } = await client.query({
        query: GET_REVIEWS_BY_RESTAURANT_ID,
        variables: { restaurantId },
        fetchPolicy: "no-cache",
      });
      if (data?.reviews?.nodes?.length) {
        return { reviews: data.reviews.nodes };
      }
    } catch (e) {
    }
    const response = await fetch(`${API_BASE_URL}/wp-json/restaurant/v1/reviews/?restaurantId=${restaurantId}`);
    if (!response.ok) throw new Error('Failed to fetch from WordPress');
    return response.json();
  }
}