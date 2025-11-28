import { useState, useEffect, useCallback } from 'react';
import { cuisineService, Cuisine } from '@/app/api/v1/services/cuisineService';
import { transformCuisinesToOptions, CuisineOption } from '@/utils/cuisineUtils';

interface UseCuisinesOptions {
  /**
   * If true, only fetch parent cuisines (no children)
   * If false, fetch all cuisines and group them hierarchically
   * @default false
   */
  parentOnly?: boolean;
  
  /**
   * If provided, only fetch children of this parent ID
   */
  parentId?: number | null;
  
  /**
   * Search term to filter cuisines by name or slug
   */
  search?: string;
  
  /**
   * Enable caching of results
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Cache duration in milliseconds
   * @default 5 minutes
   */
  cacheDuration?: number;
  
  /**
   * Limit number of results
   */
  limit?: number;
  
  /**
   * Offset for pagination
   */
  offset?: number;
}

interface UseCuisinesReturn {
  /** Formatted cuisine options ready for CustomMultipleSelect */
  cuisineOptions: CuisineOption[];
  /** Raw cuisine data from API */
  cuisines: Cuisine[];
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Total count of cuisines (for pagination) */
  total: number;
  /** Whether there are more results */
  hasMore: boolean;
  /** Manually refresh the data */
  refresh: () => Promise<void>;
}

const CACHE_KEY_PREFIX = 'cuisines_cache_';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook to fetch and format cuisines for selectors
 * Ensures consistent format across the entire application
 * 
 * @example
 * // Basic usage - fetch all cuisines hierarchically
 * const { cuisineOptions, loading } = useCuisines();
 * 
 * @example
 * // Fetch only parent cuisines
 * const { cuisineOptions } = useCuisines({ parentOnly: true });
 * 
 * @example
 * // Search cuisines
 * const { cuisineOptions } = useCuisines({ search: 'italian' });
 * 
 * @example
 * // Fetch children of a specific parent
 * const { cuisineOptions } = useCuisines({ parentId: 1 });
 */
export const useCuisines = (options: UseCuisinesOptions = {}): UseCuisinesReturn => {
  const {
    parentOnly = false,
    parentId,
    search,
    enableCache = true,
    cacheDuration = DEFAULT_CACHE_DURATION,
    limit,
    offset = 0,
  } = options;

  const [cuisineOptions, setCuisineOptions] = useState<CuisineOption[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const getCacheKey = useCallback(() => {
    // Create unique cache key based on options
    const keyParts = [
      parentOnly ? 'parent' : 'all',
      parentId !== undefined ? `parentId_${parentId}` : '',
      search ? `search_${search}` : '',
      limit ? `limit_${limit}` : '',
      offset ? `offset_${offset}` : '',
    ].filter(Boolean);
    return `${CACHE_KEY_PREFIX}${keyParts.join('_')}`;
  }, [parentOnly, parentId, search, limit, offset]);

  const fetchCuisines = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (if enabled and not skipping)
      if (enableCache && !skipCache && typeof window !== 'undefined') {
        const cacheKey = getCacheKey();
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const { data, timestamp, total: cachedTotal, hasMore: cachedHasMore } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheDuration) {
              setCuisineOptions(data.options);
              setCuisines(data.raw);
              setTotal(cachedTotal);
              setHasMore(cachedHasMore);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
            console.warn('Failed to parse cached cuisines:', e);
          }
        }
      }

      // Fetch cuisines from API
      let response;
      
      if (parentOnly) {
        // Fetch only parent cuisines
        response = await cuisineService.getParentCuisines();
      } else if (parentId !== undefined) {
        // Fetch children of specific parent
        response = await cuisineService.getChildCuisines(parentId);
      } else {
        // Fetch all cuisines with optional search
        response = await cuisineService.getAllCuisines({
          search,
          limit,
          offset,
        });
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch cuisines');
      }

      const fetchedCuisines = response.data;
      setCuisines(fetchedCuisines);
      setTotal(response.meta?.total || fetchedCuisines.length);
      setHasMore(response.meta?.hasMore || false);

      // Transform to hierarchical format if needed
      let formattedOptions: CuisineOption[];
      
      if (parentOnly || parentId !== undefined) {
        // For parent-only or specific parent, return flat list
        formattedOptions = fetchedCuisines.map((cuisine: Cuisine) => ({
          key: cuisine.slug || cuisine.name.toLowerCase().replace(/\s+/g, '-'),
          label: cuisine.name,
          flag: cuisine.flag_url || undefined,
        }));
      } else {
        // For all cuisines, create hierarchical structure
        // First, fetch all cuisines (parents + children) to build hierarchy
        // Only do this if we don't have a search term (search already filters)
        if (search) {
          // If searching, use the fetched results directly (they're already filtered)
          formattedOptions = fetchedCuisines.map((cuisine: Cuisine) => ({
            key: cuisine.slug || cuisine.name.toLowerCase().replace(/\s+/g, '-'),
            label: cuisine.name,
            flag: cuisine.flag_url || undefined,
          }));
        } else {
          // Fetch all cuisines to build complete hierarchy
          const allCuisinesResponse = await cuisineService.getAllCuisines({
            limit: 1000, // Get all for hierarchy building
          });
          
          if (allCuisinesResponse.success && allCuisinesResponse.data) {
            formattedOptions = transformCuisinesToOptions(allCuisinesResponse.data);
          } else {
            // Fallback to flat structure if hierarchy building fails
            formattedOptions = fetchedCuisines.map((cuisine: Cuisine) => ({
              key: cuisine.slug || cuisine.name.toLowerCase().replace(/\s+/g, '-'),
              label: cuisine.name,
              flag: cuisine.flag_url || undefined,
            }));
          }
        }
      }

      setCuisineOptions(formattedOptions);

      // Cache the result (if enabled)
      if (enableCache && typeof window !== 'undefined') {
        const cacheKey = getCacheKey();
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: {
              options: formattedOptions,
              raw: fetchedCuisines,
            },
            timestamp: Date.now(),
            total: response.meta?.total || fetchedCuisines.length,
            hasMore: response.meta?.hasMore || false,
          }));
        } catch (e) {
          // Cache storage failed (e.g., quota exceeded), continue without caching
          console.warn('Failed to cache cuisines:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching cuisines:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cuisines');
      setCuisineOptions([]);
      setCuisines([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [parentOnly, parentId, search, limit, offset, enableCache, cacheDuration, getCacheKey]);

  useEffect(() => {
    fetchCuisines();
  }, [fetchCuisines]);

  const refresh = useCallback(() => {
    return fetchCuisines(true); // Skip cache on manual refresh
  }, [fetchCuisines]);

  return {
    cuisineOptions,
    cuisines,
    loading,
    error,
    total,
    hasMore,
    refresh,
  };
};

