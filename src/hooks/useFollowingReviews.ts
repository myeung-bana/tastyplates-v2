import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<FollowingReview[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const serviceRef = useRef(new FollowingReviewService());
  const isFirstLoad = useRef(true);

  const loadFollowingReviews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!session?.accessToken) return;
    
    if (pageNum === 1) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await serviceRef.current.getFollowingReviews(pageNum, session.accessToken);
      
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
  }, [session?.accessToken]);

  const loadSuggestedUsers = useCallback(async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await serviceRef.current.getSuggestedUsers(session.accessToken);
      setSuggestedUsers(response.suggested_users);
    } catch (error) {
      console.error('Error loading suggested users:', error);
      setSuggestedUsers([]);
    }
  }, [session?.accessToken]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && session?.accessToken) {
      const nextPage = page + 1;
      loadFollowingReviews(nextPage, true);
    }
  }, [loading, hasMore, page, session?.accessToken, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    setPage(1);
    await loadFollowingReviews(1, false);
  }, [loadFollowingReviews]);

  // Initial load when session is available
  useEffect(() => {
    if (session?.accessToken && isFirstLoad.current) {
      isFirstLoad.current = false;
      loadFollowingReviews(1, false);
      loadSuggestedUsers();
    }
  }, [session?.accessToken, loadFollowingReviews, loadSuggestedUsers]);

  // Reset state when session changes
  useEffect(() => {
    if (!session?.accessToken) {
      setReviews([]);
      setSuggestedUsers([]);
      setPage(1);
      setHasMore(true);
      setInitialLoading(true);
      isFirstLoad.current = true;
    }
  }, [session?.accessToken]);

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
