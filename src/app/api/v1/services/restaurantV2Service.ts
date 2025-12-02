// restaurantV2Service.ts - Service for Hasura-based restaurant API (v2)

export interface RestaurantV2 {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  status: string;
  content?: string;
  price_range_id?: number;
  price?: number;
  average_rating?: number;
  ratings_count?: number;
  listing_street?: string;
  phone?: string;
  menu_url?: string;
  longitude?: number;
  latitude?: number;
  google_zoom?: number;
  featured_image_url?: string;
  uploaded_images?: string[];
  opening_hours?: Record<string, any>;
  address?: {
    place_id?: string;
    street_address?: string;
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    state_short?: string;
    post_code?: string;
    country?: string;
    country_short?: string;
  };
  created_at: string;
  updated_at: string;
  published_at?: string;
  cuisines?: Array<{ id: number; name: string; slug: string }>;
  palates?: Array<{ id: number; name: string; slug: string }>;
  restaurant_price_range?: {
    id: number;
    display_name: string;
    name: string;
    symbol?: string;
    slug: string;
  };
}

export interface RestaurantsV2Response {
  data: RestaurantV2[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt: string;
  };
  error?: string;
}

export interface RestaurantV2Response {
  data: RestaurantV2;
  meta: {
    fetchedAt: string;
  };
  error?: string;
}

class RestaurantV2Service {
  private baseUrl: string = '/api/v1/restaurants-v2';

  async getAllRestaurants(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<RestaurantsV2Response> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const url = `${this.baseUrl}/get-restaurants${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: [],
          meta: {
            total: 0,
            limit: params?.limit || 100,
            offset: params?.offset || 0,
            hasMore: false,
            fetchedAt: new Date().toISOString()
          },
          error: errorData.error || `Failed to fetch restaurants: ${response.statusText}`
        };
      }

      return response.json();
    } catch (error) {
      console.error('Get all restaurants error:', error);
      return {
        data: [],
        meta: {
          total: 0,
          limit: params?.limit || 100,
          offset: params?.offset || 0,
          hasMore: false,
          fetchedAt: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : 'Failed to fetch restaurants'
      };
    }
  }

  async getRestaurantByUuid(uuid: string): Promise<RestaurantV2Response> {
    try {
      const response = await fetch(`${this.baseUrl}/get-restaurant-by-id?uuid=${uuid}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Failed to fetch restaurant: ${response.statusText}`) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      console.error('Get restaurant by UUID error:', error);
      if (error instanceof Error && !error.status) {
        const enhancedError = error as any;
        enhancedError.status = 500;
        throw enhancedError;
      }
      throw error;
    }
  }

  async getRestaurantBySlug(slug: string): Promise<RestaurantV2Response> {
    try {
      const response = await fetch(`${this.baseUrl}/get-restaurant-by-id?slug=${encodeURIComponent(slug)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Failed to fetch restaurant: ${response.statusText}`) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      console.error('Get restaurant by slug error:', error);
      if (error instanceof Error && !error.status) {
        const enhancedError = error as any;
        enhancedError.status = 500;
        throw enhancedError;
      }
      throw error;
    }
  }
}

export const restaurantV2Service = new RestaurantV2Service();

