// Service layer for restaurant reviews (Hasura V2 API)

export interface ReviewImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  display_order: number;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
}

export interface ReviewMention {
  user_id: string;
  username: string;
  start_pos: number;
  end_pos: number;
}

export interface ReviewAuthor {
  id: string;
  username: string;
  display_name?: string;
  profile_image?: any;
}

export interface ReviewRestaurant {
  uuid: string;
  id?: number; // Database ID for compatibility
  title: string;
  slug: string;
  featured_image_url?: string;
}

export interface ReviewV2 {
  id: string;
  restaurant_uuid: string;
  author_id: string;
  parent_review_id?: string | null;
  title?: string | null;
  content: string;
  rating: number;
  images: ReviewImage[] | null;
  palates?: string[] | null;
  hashtags?: string[] | null;
  mentions?: ReviewMention[] | null;
  recognitions?: string[] | null;
  likes_count: number;
  replies_count: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  deleted_at?: string | null;
  author?: ReviewAuthor;
  restaurant?: ReviewRestaurant;
  user_liked?: boolean;
}

export interface CreateReviewInput {
  restaurant_uuid: string;
  author_id: string;
  title?: string;
  content: string;
  rating: number;
  images?: ReviewImage[];
  palates?: string[];
  hashtags?: string[];
  mentions?: ReviewMention[];
  recognitions?: string[];
  status?: 'draft' | 'pending';
  parent_review_id?: string;
}

export interface UpdateReviewInput {
  title?: string | null;
  content?: string;
  rating?: number;
  images?: ReviewImage[] | null;
  palates?: string[] | null;
  hashtags?: string[] | null;
  mentions?: ReviewMention[] | null;
  recognitions?: string[] | null;
  status?: 'draft' | 'pending' | 'approved';
}

export interface ReviewsResponse {
  reviews: ReviewV2[];
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

export interface ToggleLikeResponse {
  liked: boolean;
  action: 'liked' | 'unliked';
}

class ReviewV2Service {
  private baseUrl = '/api/v1/restaurant-reviews';

  async getReviewById(reviewId: string, userId?: string): Promise<ReviewV2> {
    const params = new URLSearchParams({ id: reviewId });
    if (userId) {
      params.append('user_id', userId);
    }
    const response = await fetch(`${this.baseUrl}/get-review-by-id?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch review' }));
      throw new Error(error.error || 'Failed to fetch review');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch review');
    }
    return result.data;
  }

  async getReviewsByRestaurant(
    restaurantUuid: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams({ restaurant_uuid: restaurantUuid });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    // Removed status parameter

    const response = await fetch(`${this.baseUrl}/get-reviews-by-restaurant?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch reviews' }));
      throw new Error(error.error || 'Failed to fetch reviews');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch reviews');
    }
    
    // Transform response to match ReviewsResponse interface
    return {
      reviews: result.data || [],
      total: result.meta?.total || 0,
      limit: result.meta?.limit || 0,
      offset: result.meta?.offset || 0,
      hasMore: result.meta?.hasMore || false
    };
  }

  async getUserReviews(
    authorId: string,
    options?: { limit?: number; offset?: number; status?: string }
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams({ author_id: authorId });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);

    const response = await fetch(`${this.baseUrl}/get-user-reviews?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch user reviews' }));
      throw new Error(error.error || 'Failed to fetch user reviews');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user reviews');
    }
    return result.data;
  }

  async createReview(input: CreateReviewInput): Promise<ReviewV2> {
    const response = await fetch(`${this.baseUrl}/create-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create review' }));
      throw new Error(error.error || 'Failed to create review');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create review');
    }
    return result.data;
  }

  async updateReview(reviewId: string, input: UpdateReviewInput): Promise<ReviewV2> {
    const response = await fetch(`${this.baseUrl}/update-review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reviewId, ...input }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update review' }));
      throw new Error(error.error || 'Failed to update review');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update review');
    }
    return result.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/delete-review?id=${reviewId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete review' }));
      throw new Error(error.error || 'Failed to delete review');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete review');
    }
  }

  async toggleLike(reviewId: string, userId: string): Promise<ToggleLikeResponse> {
    const response = await fetch(`${this.baseUrl}/toggle-like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, user_id: userId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to toggle like' }));
      throw new Error(error.error || 'Failed to toggle like');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to toggle like');
    }
    return result.data;
  }

  async checkLikeStatus(reviewId: string, userId: string): Promise<boolean> {
    const params = new URLSearchParams({
      review_id: reviewId,
      user_id: userId,
    });
    const response = await fetch(`${this.baseUrl}/toggle-like?${params}`);
    if (!response.ok) {
      return false; // Default to false on error
    }
    const result = await response.json();
    return result.success ? result.data?.liked || false : false;
  }
}

export const reviewV2Service = new ReviewV2Service();

