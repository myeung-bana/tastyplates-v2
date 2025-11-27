// palateService.ts - Frontend service for palates API

export interface Palate {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  created_at: string;
}

export interface PalatesResponse {
  success: boolean;
  data: Palate[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}

export interface PalateResponse {
  success: boolean;
  data: Palate;
  meta?: {
    fetchedAt?: string;
  };
}

class PalateService {
  private baseUrl: string = '/api/v1/palates';

  async getAllPalates(params?: {
    parentOnly?: boolean;
    parentId?: number | null;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PalatesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.parentOnly) queryParams.append('parentOnly', 'true');
    if (params?.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId.toString());
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/get-palates${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch palates: ${response.statusText}`);
    }

    return response.json();
  }

  async getPalateById(id: number): Promise<PalateResponse> {
    const response = await fetch(`${this.baseUrl}/get-palate-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch palate: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods
  async getParentPalates(): Promise<PalatesResponse> {
    return this.getAllPalates({ parentOnly: true });
  }

  async getChildPalates(parentId: number): Promise<PalatesResponse> {
    return this.getAllPalates({ parentId });
  }
}

export const palateService = new PalateService();

