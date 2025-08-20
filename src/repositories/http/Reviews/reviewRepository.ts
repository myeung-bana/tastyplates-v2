import client from "@/app/graphql/client";
import { GET_ALL_RECENT_REVIEWS, GET_COMMENT_REPLIES, GET_RESTAURANT_REVIEWS, GET_REVIEWS_BY_RESTAURANT_ID, GET_USER_REVIEWS } from "@/app/graphql/Reviews/reviewsQueries";
import { ReviewRepo } from "@/repositories/interface/user/review";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class ReviewRepository implements ReviewRepo {
  async getAllReviews(first = 16, after: string | null = null, accessToken?: string) {
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

  async getCommentReplies(id: string) {
    const { data } = await client.query({
      query: GET_COMMENT_REPLIES,
      variables: { id },
      fetchPolicy: "no-cache",
    });

    return data?.comment?.replies?.nodes || [];
  }

  async createReview<T>(form: any, accessToken: string): Promise<any> {
    const response: Response = await request.POST('/wp-json/wp/v2/api/comments', {
      body: JSON.stringify(form),
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    const data = await response.json();
    return {
      status: response.status,
      data
    }
  }

  async getReviewDrafts(accessToken?: string): Promise<any> {
    try {
      const response = await request.GET('/wp-json/wp/v2/api/comments?type=listing_draft&status=hold', {
        headers: {

          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      }, true);

      return response || [];
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

  async getUserReviews(userId: number, first = 16, after: string | null = null) {
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

  async likeComment(commentId: number, accessToken: string): Promise<any> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    const response = await request.POST('/wp-json/wp/v2/api/comments/comment-like', {
      body,
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    const data = await response.json();
    return {
      status: response.status,
      data
    }
  }

  async unlikeComment(commentId: number, accessToken: string): Promise<any> {
    const body = JSON.stringify({
      comment_id: commentId,
    });
    const response: Response = await request.POST('/wp-json/wp/v2/api/comments/comment-unlike', {
      body,
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    const data = await response.json();
    return {
      status: response.status,
      data
    }
  }

  async getRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string) {
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

  async getRestaurantReviewsById(restaurantId: string | number) {
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
    const response: Response = await request.GET(`/wp-json/restaurant/v1/reviews/?restaurantId=${restaurantId}`);
    if (!response.ok) throw new Error('Failed to fetch from WordPress');
    return response.json();
  }
}