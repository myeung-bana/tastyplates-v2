import { useState, useEffect, useCallback } from 'react';
import { priceRangeService, PriceRange } from '@/app/api/v1/services/priceRangeService';

interface UsePriceRangesOptions {
  /**
   * Search term to filter price ranges by name, display_name, or slug
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

interface UsePriceRangesReturn {
  /** Array of price ranges */
  priceRanges: PriceRange[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error message if fetch failed */
  error: string | null;
  
  /** Total count of price ranges */
  total: number;
  
  /** Whether there are more results */
  hasMore: boolean;
  
  /** Manually refresh the data */
  refresh: () => Promise<void>;
  
  /** Get display name by ID (with caching) */
  getDisplayNameById: (id: number) => string | null;
}

const CACHE_KEY_PREFIX = 'price_ranges_cache_';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook to fetch and manage price ranges
 * Ensures consistent access to price range data across the application
 * 
 * @example
 * // Basic usage - fetch all price ranges
 * const { priceRanges, loading } = usePriceRanges();
 * 
 * @example
 * // Search price ranges
 * const { priceRanges } = usePriceRanges({ search: 'budget' });
 * 
 * @example
 * // Get display name by ID
 * const { getDisplayNameById } = usePriceRanges();
 * const displayName = getDisplayNameById(1); // Returns display_name or null
 */
export const usePriceRanges = (options: UsePriceRangesOptions = {}): UsePriceRangesReturn => {
  const {
    search,
    enableCache = true,
    cacheDuration = DEFAULT_CACHE_DURATION,
    limit,
    offset = 0,
  } = options;

  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const getCacheKey = useCallback(() => {
    const keyParts = [
      search ? `search_${search}` : '',
      limit ? `limit_${limit}` : '',
      offset ? `offset_${offset}` : '',
    ].filter(Boolean);
    return `${CACHE_KEY_PREFIX}${keyParts.join('_') || 'all'}`;
  }, [search, limit, offset]);

  const fetchPriceRanges = useCallback(async (skipCache = false) => {
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
              setPriceRanges(data);
              setTotal(cachedTotal);
              setHasMore(cachedHasMore);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse cached price ranges:', e);
          }
        }
      }

      // Fetch price ranges from API
      const response = await priceRangeService.getAllPriceRanges({
        search,
        limit,
        offset,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch price ranges');
      }

      setPriceRanges(response.data);
      setTotal(response.meta?.total || response.data.length);
      setHasMore(response.meta?.hasMore || false);

      // Cache the results
      if (enableCache && typeof window !== 'undefined') {
        const cacheKey = getCacheKey();
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now(),
          total: response.meta?.total || response.data.length,
          hasMore: response.meta?.hasMore || false,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price ranges';
      setError(errorMessage);
      console.error('Error fetching price ranges:', err);
    } finally {
      setLoading(false);
    }
  }, [search, limit, offset, enableCache, cacheDuration, getCacheKey]);

  // Get display name by ID (from cached data)
  const getDisplayNameById = useCallback((id: number): string | null => {
    const priceRange = priceRanges.find(pr => pr.id === id);
    return priceRange?.display_name || null;
  }, [priceRanges]);

  useEffect(() => {
    fetchPriceRanges();
  }, [fetchPriceRanges]);

  const refresh = useCallback(async () => {
    await fetchPriceRanges(true); // Skip cache on refresh
  }, [fetchPriceRanges]);

  return {
    priceRanges,
    loading,
    error,
    total,
    hasMore,
    refresh,
    getDisplayNameById,
  };
};

