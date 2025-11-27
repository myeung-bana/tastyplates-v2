// categoryService.ts - Frontend service for categories API

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  created_at: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
  meta?: {
    fetchedAt?: string;
  };
}

class CategoryService {
  private baseUrl: string = '/api/v1/categories';

  async getAllCategories(params?: {
    parentOnly?: boolean;
    parentId?: number | null;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.parentOnly) queryParams.append('parentOnly', 'true');
    if (params?.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId.toString());
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/get-categories${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  }

  async getCategoryById(id: number): Promise<CategoryResponse> {
    const response = await fetch(`${this.baseUrl}/get-category-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch category: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods
  async getParentCategories(): Promise<CategoriesResponse> {
    return this.getAllCategories({ parentOnly: true });
  }

  async getChildCategories(parentId: number): Promise<CategoriesResponse> {
    return this.getAllCategories({ parentId });
  }
}

export const categoryService = new CategoryService();

