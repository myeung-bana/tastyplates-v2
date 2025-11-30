// restaurantUserService.ts - Frontend service for restaurant_users API

import { Restaurant } from '@/utils/restaurantTransformers';

export interface RestaurantUser {
  id: string;
  firebase_uuid: string;
  username: string;
  email: string;
  display_name?: string;
  user_nicename?: string;
  password_hash?: string;
  is_google_user?: boolean;
  google_auth?: boolean;
  google_token?: string;
  auth_method?: string; // Authentication method: 'password', 'google.com', 'facebook.com', etc.
  profile_image?: any; // JSONB
  about_me?: string;
  birthdate?: string;
  gender?: string;
  custom_gender?: string;
  pronoun?: string;
  address?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  palates?: any; // JSONB array
  language_preference?: string;
  onboarding_complete?: boolean;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface RestaurantUsersResponse {
  success: boolean;
  data: RestaurantUser[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}

export interface RestaurantUserResponse {
  success: boolean;
  data: RestaurantUser & {
    followers_count?: number;
    following_count?: number;
  };
}

export interface FollowerUser {
  id: string;
  name: string;
  cuisines: string[];
  image?: string | null;
  isFollowing: boolean;
}

export interface FollowListResponse {
  success: boolean;
  data: FollowerUser[];
  error?: string;
}

export interface CreateRestaurantUserRequest {
  firebase_uuid: string;
  username: string;
  email: string;
  display_name?: string;
  password_hash?: string;
  is_google_user?: boolean;
  google_auth?: boolean;
  google_token?: string;
  auth_method?: string; // Authentication method: 'password', 'google.com', 'facebook.com', 'twitter.com', 'github.com', 'apple.com', 'phone', etc.
  profile_image?: any;
  about_me?: string;
  birthdate?: string;
  gender?: string;
  custom_gender?: string;
  pronoun?: string;
  address?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  palates?: any;
  language_preference?: string;
  user_nicename?: string;
  onboarding_complete?: boolean;
}

export interface UpdateRestaurantUserRequest extends Partial<CreateRestaurantUserRequest> {
  id: string;
}

// Wishlist interfaces
export interface WishlistItem {
  favorite_id: string;
  created_at: string;
  restaurant: Restaurant;
}

export interface WishlistResponse {
  success: boolean;
  data: WishlistItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

// Check-ins interfaces
export interface CheckinItem {
  checkin_id: string;
  checked_in_at: string;
  restaurant: Restaurant;
}

export interface CheckinsResponse {
  success: boolean;
  data: CheckinItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

// Reviews interfaces
export interface ReviewItem {
  id: string;
  title?: string | null;
  content: string;
  rating: number;
  images: any;
  palates?: any;
  hashtags?: string[] | null;
  likes_count: number;
  status: string;
  created_at: string;
  published_at?: string | null;
  author?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image?: any;
  };
  restaurant?: {
    uuid: string;
    id?: number;
    title: string;
    slug: string;
    featured_image_url?: string;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: ReviewItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

class RestaurantUserService {
  private baseUrl: string = '/api/v1/restaurant-users';

  async getAllUsers(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    firebase_uuid?: string;
    email?: string;
    username?: string;
    include_deleted?: boolean;
  }): Promise<RestaurantUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.firebase_uuid) queryParams.append('firebase_uuid', params.firebase_uuid);
    if (params?.email) queryParams.append('email', params.email);
    if (params?.username) queryParams.append('username', params.username);
    if (params?.include_deleted) queryParams.append('include_deleted', 'true');

    const url = `${this.baseUrl}/get-restaurant-users${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserById(id: string): Promise<RestaurantUserResponse> {
    const response = await fetch(`${this.baseUrl}/get-restaurant-user-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch user: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserByFirebaseUuid(firebase_uuid: string): Promise<RestaurantUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get-restaurant-user-by-firebase-uuid?firebase_uuid=${firebase_uuid}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Failed to fetch user: ${response.statusText}`) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // Re-throw with additional context
      if (error instanceof Error && !error.status) {
        const enhancedError = error as any;
        enhancedError.status = 500;
        throw enhancedError;
      }
      throw error;
    }
  }

  async createUser(data: CreateRestaurantUserRequest): Promise<RestaurantUserResponse> {
    const response = await fetch(`${this.baseUrl}/create-restaurant-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create user: ${response.statusText}`);
    }

    return response.json();
  }

  async updateUser(id: string, data: Omit<UpdateRestaurantUserRequest, 'id'>): Promise<RestaurantUserResponse> {
    const response = await fetch(`${this.baseUrl}/update-restaurant-user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update user: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteUser(id: string, hardDelete: boolean = false): Promise<RestaurantUserResponse> {
    const response = await fetch(`${this.baseUrl}/delete-restaurant-user?id=${id}${hardDelete ? '&hard_delete=true' : ''}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete user: ${response.statusText}`);
    }

    return response.json();
  }

  async checkUsernameExists(username: string): Promise<{ success: boolean; exists: boolean; message: string; status: number }> {
    const response = await fetch(`${this.baseUrl}/check-username?username=${encodeURIComponent(username)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to check username: ${response.statusText}`);
    }

    return response.json();
  }

  async getFollowersList(userId: string): Promise<FollowListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get-followers-list?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          data: [],
          error: errorData.error || `Failed to fetch followers: ${response.statusText}`
        };
      }

      return response.json();
    } catch (error: any) {
      console.error('Get followers list error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch followers'
      };
    }
  }

  async getFollowingList(userId: string): Promise<FollowListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get-following-list?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          data: [],
          error: errorData.error || `Failed to fetch following: ${response.statusText}`
        };
      }

      return response.json();
    } catch (error: any) {
      console.error('Get following list error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch following'
      };
    }
  }

  // ============================================
  // FAVORITES (WISHLIST) METHODS
  // ============================================

  async toggleFavorite(params: {
    user_id: string;
    restaurant_slug?: string;
    restaurant_uuid?: string;
  }): Promise<{ success: boolean; data: { status: 'saved' | 'unsaved'; restaurant_uuid: string }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/toggle-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to toggle favorite: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Toggle favorite error:', error);
      return {
        success: false,
        data: { status: 'unsaved', restaurant_uuid: '' },
        error: error instanceof Error ? error.message : 'Failed to toggle favorite'
      };
    }
  }

  async checkFavoriteStatus(params: {
    user_id: string;
    restaurant_slug?: string;
    restaurant_uuid?: string;
  }): Promise<{ success: boolean; data: { status: 'saved' | 'unsaved'; restaurant_uuid: string }; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.restaurant_slug) queryParams.append('restaurant_slug', params.restaurant_slug);
      if (params.restaurant_uuid) queryParams.append('restaurant_uuid', params.restaurant_uuid);

      const response = await fetch(`${this.baseUrl}/toggle-favorite?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to check favorite status: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Check favorite status error:', error);
      return {
        success: false,
        data: { status: 'unsaved', restaurant_uuid: '' },
        error: error instanceof Error ? error.message : 'Failed to check favorite status'
      };
    }
  }

  // ============================================
  // CHECK-INS METHODS
  // ============================================

  async toggleCheckin(params: {
    user_id: string;
    restaurant_slug?: string;
    restaurant_uuid?: string;
  }): Promise<{ success: boolean; data: { status: 'checkedin' | 'uncheckedin'; restaurant_uuid: string }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/toggle-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to toggle check-in: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Toggle check-in error:', error);
      return {
        success: false,
        data: { status: 'uncheckedin', restaurant_uuid: '' },
        error: error instanceof Error ? error.message : 'Failed to toggle check-in'
      };
    }
  }

  async checkCheckinStatus(params: {
    user_id: string;
    restaurant_slug?: string;
    restaurant_uuid?: string;
  }): Promise<{ success: boolean; data: { status: 'checkedin' | 'uncheckedin'; restaurant_uuid: string }; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.restaurant_slug) queryParams.append('restaurant_slug', params.restaurant_slug);
      if (params.restaurant_uuid) queryParams.append('restaurant_uuid', params.restaurant_uuid);

      const response = await fetch(`${this.baseUrl}/toggle-checkin?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to check check-in status: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Check check-in status error:', error);
      return {
        success: false,
        data: { status: 'uncheckedin', restaurant_uuid: '' },
        error: error instanceof Error ? error.message : 'Failed to check check-in status'
      };
    }
  }

  // ============================================
  // WISHLIST METHODS
  // ============================================

  async getWishlist(params: {
    user_id: string;
    limit?: number;
    offset?: number;
  }): Promise<WishlistResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response = await fetch(`${this.baseUrl}/get-wishlist?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch wishlist: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Get wishlist error:', error);
      return {
        success: false,
        data: [],
        meta: { total: 0, limit: params.limit || 20, offset: params.offset || 0, hasMore: false },
        error: error instanceof Error ? error.message : 'Failed to fetch wishlist'
      };
    }
  }

  // ============================================
  // CHECK-INS METHODS
  // ============================================

  async getCheckins(params: {
    user_id: string;
    limit?: number;
    offset?: number;
  }): Promise<CheckinsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response = await fetch(`${this.baseUrl}/get-checkins?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch check-ins: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Get check-ins error:', error);
      return {
        success: false,
        data: [],
        meta: { total: 0, limit: params.limit || 20, offset: params.offset || 0, hasMore: false },
        error: error instanceof Error ? error.message : 'Failed to fetch check-ins'
      };
    }
  }

  // ============================================
  // REVIEWS METHODS
  // ============================================

  async getReviews(params: {
    user_id: string;
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ReviewsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('user_id', params.user_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(`${this.baseUrl}/get-reviews?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch reviews: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Get reviews error:', error);
      return {
        success: false,
        data: [],
        meta: { total: 0, limit: params.limit || 20, offset: params.offset || 0, hasMore: false },
        error: error instanceof Error ? error.message : 'Failed to fetch reviews'
      };
    }
  }
}

export const restaurantUserService = new RestaurantUserService();

