// cuisineService.ts - Frontend service for cuisines API

export interface Cuisine {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  flag_url?: string | null;
  created_at: string;
}

export interface CuisinesResponse {
  success: boolean;
  data: Cuisine[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}

export interface CuisineResponse {
  success: boolean;
  data: Cuisine;
  meta?: {
    fetchedAt?: string;
  };
}

class CuisineService {
  private baseUrl: string = '/api/v1/cuisines';

  async getAllCuisines(params?: {
    parentOnly?: boolean;
    parentId?: number | null;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<CuisinesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.parentOnly) queryParams.append('parentOnly', 'true');
    if (params?.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId.toString());
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/get-cuisines${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch cuisines: ${response.statusText}`);
    }

    return response.json();
  }

  async getCuisineById(id: number): Promise<CuisineResponse> {
    const response = await fetch(`${this.baseUrl}/get-cuisine-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch cuisine: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods
  async getParentCuisines(): Promise<CuisinesResponse> {
    return this.getAllCuisines({ parentOnly: true });
  }

  async getChildCuisines(parentId: number): Promise<CuisinesResponse> {
    return this.getAllCuisines({ parentId });
  }
}

export const cuisineService = new CuisineService();

