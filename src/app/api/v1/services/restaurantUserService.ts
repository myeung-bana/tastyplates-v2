// restaurantUserService.ts - Frontend service for restaurant_users API

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
  data: RestaurantUser;
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
}

export const restaurantUserService = new RestaurantUserService();

