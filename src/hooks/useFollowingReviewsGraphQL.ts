import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ReviewService } from '@/services/Reviews/reviewService';
import { FollowService } from '@/services/follow/followService';
import { GraphQLReview, PageInfo } from '@/types/graphql';

interface UseFollowingReviewsGraphQLReturn {
  reviews: GraphQLReview[];
  loading: boolean;
  initialLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshFollowingReviews: () => Promise<void>;
}

export const useFollowingReviewsGraphQL = (): UseFollowingReviewsGraphQLReturn => {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const reviewService = useRef(new ReviewService());
  const followService = useRef(new FollowService());

  // Fetch following user IDs
  const fetchFollowingUserIds = useCallback(async () => {
    if (!session?.user?.userId) return [];
    
    try {
      // Public endpoint - don't pass token as it doesn't require authentication
      // Passing a token causes the JWT plugin to validate it, which can fail and block the request
      const followingList = await followService.current.getFollowingList(
        session.user.userId
        // No token for public endpoint
      );
      return followingList.map(user => user.id as number);
    } catch (error) {
      console.error('Error fetching following user IDs:', error);
      return [];
    }
  }, [session?.user?.userId]);

  const loadFollowingReviews = useCallback(async (append: boolean = false) => {
    if (!session?.accessToken || followingUserIds.length === 0) {
      if (!append) {
        setInitialLoading(false);
      }
      return;
    }
    
    if (!append) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const first = append ? 8 : 16;
      const allReviews: GraphQLReview[] = [];
      let hasNextPage = false;
      let lastEndCursor: string | null = null;

      // If this is the first load, fetch from all users
      // If loading more, continue from where we left off
      const startUserIndex = append ? currentUserIndex : 0;
      
      for (let i = startUserIndex; i < followingUserIds.length; i++) {
        const userId = followingUserIds[i];
        const cursor = (i === startUserIndex && append) ? endCursor : null;
        
        try {
          const { reviews: userReviews, pageInfo } = await reviewService.current.fetchUserReviews(
            userId,
            first,
            cursor,
            session.accessToken
          );
          
          allReviews.push(...userReviews);
          
          // If this user has more pages, we'll continue from here next time
          if (pageInfo.hasNextPage) {
            hasNextPage = true;
            lastEndCursor = pageInfo.endCursor;
            setCurrentUserIndex(i);
            break;
          }
          
          // If we've reached the end for this user, move to next user
          if (i === followingUserIds.length - 1) {
            hasNextPage = false;
            setCurrentUserIndex(0); // Reset for next refresh
          }
        } catch (error) {
          console.error(`Error fetching reviews for user ${userId}:`, error);
          // Continue with next user
        }
      }

      // Sort reviews by date (most recent first)
      allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Remove duplicates based on review ID
      const uniqueReviews = allReviews.filter((review, index, self) => 
        index === self.findIndex(r => r.id === review.id)
      );

      if (append) {
        setReviews(prev => {
          const combined = [...prev, ...uniqueReviews];
          // Remove duplicates again after combining
          return combined.filter((review, index, self) => 
            index === self.findIndex(r => r.id === review.id)
          );
        });
      } else {
        setReviews(uniqueReviews);
      }
      
      setEndCursor(lastEndCursor);
      setHasMore(hasNextPage);
      
    } catch (error) {
      console.error('Error loading following reviews:', error);
      if (!append) {
        setReviews([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [session?.accessToken, followingUserIds, endCursor, currentUserIndex]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && session?.accessToken && !initialLoading) {
      loadFollowingReviews(true);
    }
  }, [loading, hasMore, session?.accessToken, initialLoading, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    setEndCursor(null);
    setHasMore(true);
    setCurrentUserIndex(0);
    await loadFollowingReviews(false);
  }, [loadFollowingReviews]);

  // Initialize following user IDs when session is available
  useEffect(() => {
    if (session?.accessToken && !isInitialized) {
      setIsInitialized(true);
      fetchFollowingUserIds().then(setFollowingUserIds);
    }
  }, [session?.accessToken, isInitialized, fetchFollowingUserIds]);

  // Load reviews when following user IDs are available
  useEffect(() => {
    if (followingUserIds.length > 0 && isInitialized) {
      loadFollowingReviews(false);
    }
  }, [followingUserIds, isInitialized]); // Removed loadFollowingReviews from dependencies

  // Reset state when session is lost
  useEffect(() => {
    if (!session?.accessToken && isInitialized) {
      setReviews([]);
      setFollowingUserIds([]);
      setEndCursor(null);
      setHasMore(true);
      setInitialLoading(true);
      setCurrentUserIndex(0);
      setIsInitialized(false);
    }
  }, [session?.accessToken, isInitialized]);

  return {
    reviews,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    refreshFollowingReviews
  };
};