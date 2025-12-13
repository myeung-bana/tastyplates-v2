import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { ReviewService } from '@/services/Reviews/reviewService';
import { FollowService } from '@/services/follow/followService';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
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
  const { user } = useFirebaseSession();
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
  
  // Helper to get Firebase ID token for API calls
  const getFirebaseToken = useCallback(async () => {
    if (!user?.firebase_uuid) return null;
    try {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return null;
  }, [user]);

  // Fetch following user IDs
  const fetchFollowingUserIds = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      // Use new Hasura API endpoint that accepts UUIDs
      const userIdStr = String(user.id);
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUIDFormat = UUID_REGEX.test(userIdStr);
      
      if (isUUIDFormat) {
        // Use new Hasura API endpoint for UUIDs
        const followingResult = await restaurantUserService.getFollowingList(userIdStr);
        
        if (followingResult.success && followingResult.data) {
          // The API returns user objects with UUID ids
          // Since fetchUserReviews expects numeric IDs, we need to look them up
          // For now, return empty array as the review service doesn't support UUIDs yet
          // TODO: Update review service to accept UUIDs or add UUID-to-numeric-ID lookup
          console.warn('Following list returned UUIDs, but review service requires numeric IDs. Skipping following reviews.');
          return [];
        }
        return [];
      } else {
        // Fallback to legacy endpoint for numeric IDs
        const numericUserId = Number(userIdStr);
        if (isNaN(numericUserId) || numericUserId <= 0) {
          console.warn('Invalid numeric user ID:', userIdStr);
          return [];
        }
        
        const followingList = await followService.current.getFollowingList(numericUserId);
        return followingList.map(user => {
          const id = user.id;
          return typeof id === 'number' ? id : Number(id);
        }).filter((id: number) => !isNaN(id) && id > 0);
      }
    } catch (error) {
      console.error('Error fetching following user IDs:', error);
      return [];
    }
  }, [user?.id]);

  const loadFollowingReviews = useCallback(async (append: boolean = false) => {
    const token = await getFirebaseToken();
    if (!token || followingUserIds.length === 0) {
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
            token
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
  }, [getFirebaseToken, followingUserIds, endCursor, currentUserIndex]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && user && !initialLoading) {
      loadFollowingReviews(true);
    }
  }, [loading, hasMore, user, initialLoading, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    setEndCursor(null);
    setHasMore(true);
    setCurrentUserIndex(0);
    await loadFollowingReviews(false);
  }, [loadFollowingReviews]);

  // Initialize following user IDs when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      setIsInitialized(true);
      fetchFollowingUserIds().then(setFollowingUserIds);
    }
  }, [user, isInitialized, fetchFollowingUserIds]);

  // Load reviews when following user IDs are available
  useEffect(() => {
    if (followingUserIds.length > 0 && isInitialized) {
      loadFollowingReviews(false);
    }
  }, [followingUserIds, isInitialized, loadFollowingReviews]);

  // Reset state when user is lost
  useEffect(() => {
    if (!user && isInitialized) {
      setReviews([]);
      setFollowingUserIds([]);
      setEndCursor(null);
      setHasMore(true);
      setInitialLoading(true);
      setCurrentUserIndex(0);
      setIsInitialized(false);
    }
  }, [user, isInitialized]);

  return {
    reviews,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    refreshFollowingReviews
  };
};