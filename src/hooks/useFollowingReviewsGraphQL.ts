import { useState, useEffect, useCallback } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import { GraphQLReview } from '@/types/graphql';

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
  const [offset, setOffset] = useState(0);
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]); // Changed to UUIDs
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch following user IDs (now returns UUIDs)
  const fetchFollowingUserIds = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      const userIdStr = String(user.id);
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUIDFormat = UUID_REGEX.test(userIdStr);
      
      if (isUUIDFormat) {
        // Use new Hasura API endpoint for UUIDs
        const followingResult = await restaurantUserService.getFollowingList(userIdStr);
        
        if (followingResult.success && followingResult.data) {
          // Extract UUIDs from the following list
          return followingResult.data.map((followedUser: any) => followedUser.id).filter(Boolean);
        }
        return [];
      } else {
        console.warn('User ID is not in UUID format. Cannot fetch following reviews.');
        return [];
      }
    } catch (error) {
      console.error('Error fetching following user IDs:', error);
      return [];
    }
  }, [user?.id]);

  const loadFollowingReviews = useCallback(async (append: boolean = false) => {
    if (followingUserIds.length === 0) {
      if (!append) {
        setInitialLoading(false);
      }
      return;
    }
    
    if (!append) {
      setInitialLoading(true);
      setOffset(0);
    } else {
      setLoading(true);
    }
    
    try {
      const limit = append ? 8 : 16;
      const currentOffset = append ? offset : 0;
      const allReviews: GraphQLReview[] = [];
      let hasMoreReviews = false;
      let totalFetched = 0;

      // If this is the first load, fetch from all users
      // If loading more, continue from where we left off
      const startUserIndex = append ? currentUserIndex : 0;
      
      for (let i = startUserIndex; i < followingUserIds.length; i++) {
        const userId = followingUserIds[i];
        const userOffset = (i === startUserIndex && append) ? currentOffset : 0;
        
        try {
          const response = await reviewV2Service.getUserReviews(userId, {
            limit,
            offset: userOffset
          });
          
          // Transform ReviewV2 to GraphQLReview
          const transformedReviews = response.reviews.map(review => 
            transformReviewV2ToGraphQLReview(review)
          );
          
          allReviews.push(...transformedReviews);
          totalFetched += transformedReviews.length;
          
          // If this user has more reviews, we'll continue from here next time
          if (response.hasMore) {
            hasMoreReviews = true;
            setCurrentUserIndex(i);
            setOffset(userOffset + transformedReviews.length);
            break;
          }
          
          // If we've reached the end for this user, move to next user
          if (i === followingUserIds.length - 1) {
            hasMoreReviews = false;
            setCurrentUserIndex(0); // Reset for next refresh
            setOffset(0);
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
      
      setHasMore(hasMoreReviews);
      
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
  }, [followingUserIds, offset, currentUserIndex]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && user && !initialLoading) {
      loadFollowingReviews(true);
    }
  }, [loading, hasMore, user, initialLoading, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    setOffset(0);
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
      setOffset(0);
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