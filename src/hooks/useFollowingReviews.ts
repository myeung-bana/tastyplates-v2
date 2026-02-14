import { useState, useEffect, useCallback, useRef } from 'react';
import { useNhostSession } from '@/hooks/useNhostSession';
import { nhost } from '@/lib/nhost';
import { FollowingReviewService } from '@/services/following/followingReviewService';
import { FollowingReview, SuggestedUser } from '@/repositories/http/following/followingReviewRepository';

interface UseFollowingReviewsReturn {
  reviews: FollowingReview[];
  suggestedUsers: SuggestedUser[];
  loading: boolean;
  initialLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshFollowingReviews: () => Promise<void>;
}

export const useFollowingReviews = (): UseFollowingReviewsReturn => {
  const { nhostUser } = useNhostSession();
  const [reviews, setReviews] = useState<FollowingReview[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const serviceRef = useRef(new FollowingReviewService());
  const isFirstLoad = useRef(true);

  const loadFollowingReviews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!nhostUser) return;
    
    // Get Nhost access token for authentication
    const accessToken = nhost.auth.getAccessToken();
    if (!accessToken) {
      console.error('No access token available');
      setInitialLoading(false);
      setLoading(false);
      return;
    }
    
    if (pageNum === 1) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await serviceRef.current.getFollowingReviews(pageNum, accessToken);
      
      if (append) {
        setReviews(prev => [...prev, ...response.reviews]);
      } else {
        setReviews(response.reviews);
      }
      
      setHasMore(response.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading following reviews:', error);
      // Set empty state on error
      if (!append) {
        setReviews([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [nhostUser]);

  const loadSuggestedUsers = useCallback(async () => {
    if (!nhostUser) return;
    
    try {
      // Get Nhost access token for authentication
      const accessToken = nhost.auth.getAccessToken();
      if (!accessToken) {
        console.error('No access token available');
        setSuggestedUsers([]);
        return;
      }

      const response = await serviceRef.current.getSuggestedUsers(accessToken);
      setSuggestedUsers(response.suggested_users);
    } catch (error) {
      console.error('Error loading suggested users:', error);
      setSuggestedUsers([]);
    }
  }, [nhostUser]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && nhostUser) {
      const nextPage = page + 1;
      loadFollowingReviews(nextPage, true);
    }
  }, [loading, hasMore, page, nhostUser, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    setPage(1);
    await loadFollowingReviews(1, false);
  }, [loadFollowingReviews]);

  // Initial load when session is available
  useEffect(() => {
    if (nhostUser && isFirstLoad.current) {
      isFirstLoad.current = false;
      loadFollowingReviews(1, false);
      loadSuggestedUsers();
    }
  }, [nhostUser, loadFollowingReviews, loadSuggestedUsers]);

  // Reset state when session changes
  useEffect(() => {
    if (!nhostUser) {
      setReviews([]);
      setSuggestedUsers([]);
      setPage(1);
      setHasMore(true);
      setInitialLoading(true);
      isFirstLoad.current = true;
    }
  }, [nhostUser]);

  return {
    reviews,
    suggestedUsers,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    refreshFollowingReviews
  };
};
