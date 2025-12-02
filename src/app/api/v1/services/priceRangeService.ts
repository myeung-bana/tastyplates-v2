// priceRangeService.ts - Frontend service for price ranges API

export interface PriceRange {
  id: number;
  name: string;
  display_name: string;
  slug: string;
  symbol?: string | null;
  description?: string | null;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PriceRangesResponse {
  success: boolean;
  data: PriceRange[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
  error?: string;
}

export interface PriceRangeResponse {
  success: boolean;
  data: PriceRange;
  meta?: {
    fetchedAt?: string;
  };
  error?: string;
}

class PriceRangeService {
  private baseUrl: string = '/api/v1/price-ranges';

  async getAllPriceRanges(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PriceRangesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/get-price-ranges${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch price ranges: ${response.statusText}`);
    }

    return response.json();
  }

  async getPriceRangeById(id: number): Promise<PriceRangeResponse> {
    const response = await fetch(`${this.baseUrl}/get-price-range-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch price range: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to get display name by ID
  async getDisplayNameById(id: number): Promise<string | null> {
    try {
      const response = await this.getPriceRangeById(id);
      return response.data?.display_name || null;
    } catch {
      return null;
    }
  }
}

export const priceRangeService = new PriceRangeService();

