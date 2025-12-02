import { useState, useEffect, useRef, useCallback } from 'react';
import { GraphQLReview } from '@/types/graphql';

interface UseReviewRepliesReturn {
  replies: GraphQLReview[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache to avoid duplicate requests
const repliesCache = new Map<string, { data: GraphQLReview[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter than user data since replies can change)

/**
 * Centralized hook to fetch review replies from /api/v1/restaurant-reviews/get-replies
 * Handles loading, error states, and caching
 * 
 * @param reviewId - UUID string of the parent review
 * @param userId - Optional UUID string to check if user liked each reply
 * @param enabled - Whether to fetch (defaults to true)
 * @returns Replies data, loading state, error, and refetch function
 */
export const useReviewReplies = (
  reviewId: string | undefined,
  userId?: string | undefined,
  enabled: boolean = true
): UseReviewRepliesReturn => {
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReplies = useCallback(async () => {
    if (!reviewId || !enabled) {
      setReplies([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = `${reviewId}${userId ? `-${userId}` : ''}`;
    const cached = repliesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setReplies(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({ parent_review_id: reviewId });
      if (userId) {
        params.append('user_id', userId);
      }

      const response = await fetch(`/api/v1/restaurant-reviews/get-replies?${params}`, {
        signal: currentController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch replies: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch replies');
      }

      const fetchedReplies = result.data || [];

      // Update cache
      repliesCache.set(cacheKey, { data: fetchedReplies, timestamp: Date.now() });

      // Only update state if request wasn't aborted
      if (!currentController.signal.aborted) {
        setReplies(fetchedReplies);
        setError(null);
      }
    } catch (err) {
      if (!currentController.signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch replies';
        setError(errorMsg);
        setReplies([]);
        console.error('Error fetching replies:', err);
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [reviewId, userId, enabled]);

  useEffect(() => {
    fetchReplies();

    // Cleanup: abort request if component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReplies]);

  return {
    replies,
    loading,
    error,
    refetch: fetchReplies,
  };
};

