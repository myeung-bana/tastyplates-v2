import { useState, useCallback, useRef } from 'react';
import { useNhostSession } from '@/hooks/useNhostSession';
import { nhost } from '@/lib/nhost';
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { ReviewService } from '@/services/Reviews/reviewService';
import toast from 'react-hot-toast';

const reviewService = new ReviewService();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UseReviewLikeOptions {
  reviewId: string | number;
  initialLiked?: boolean;
  initialCount?: number;
  onAuthRequired?: () => void;
}

interface UseReviewLikeReturn {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

/**
 * Unified hook for review like/unlike functionality
 * Handles both UUID (new API) and numeric (legacy) review IDs
 * Features: optimistic updates, caching, no success toasts
 */
export function useReviewLike({
  reviewId,
  initialLiked = false,
  initialCount = 0,
  onAuthRequired,
}: UseReviewLikeOptions): UseReviewLikeReturn {
  const { user, nhostUser } = useNhostSession();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const userUuidCache = useRef<string | null>(null);

  // Helper to get user UUID (cached for performance)
  const getUserUuid = useCallback(async (): Promise<string | null> => {
    if (userUuidCache.current) return userUuidCache.current;
    
    if (!user?.user_id || !nhostUser) return null;

    const userIdStr = String(user.user_id);
    if (UUID_REGEX.test(userIdStr)) {
      userUuidCache.current = userIdStr;
      return userIdStr;
    }

    try {
      const accessToken = nhost.auth.getAccessToken();
      if (!accessToken) {
        console.error("No access token available");
        return null;
      }

      const response = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.data?.id) {
          userUuidCache.current = userData.data.id;
          return userData.data.id;
        }
      }
    } catch (error) {
      console.error("Error fetching user UUID:", error);
    }

    return null;
  }, [user?.user_id, nhostUser]);

  const toggleLike = useCallback(async () => {
    if (isLoading) return;

    // Check authentication
    if (!user || !nhostUser) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        toast.error("Please sign in to like reviews");
      }
      return;
    }

    setIsLoading(true);

    // Store current state for potential revert
    const currentLiked = isLiked;
    const currentCount = likesCount;

    // Optimistic update
    setIsLiked(!currentLiked);
    setLikesCount(currentLiked ? currentCount - 1 : currentCount + 1);

    try {
      const reviewIdStr = String(reviewId);
      const isUUID = UUID_REGEX.test(reviewIdStr);

      if (isUUID) {
        // Use new API v1 endpoint (single toggle call)
        const userId = await getUserUuid();
        if (!userId) {
          throw new Error("Unable to get user ID");
        }

        const result = await reviewV2Service.toggleLike(reviewIdStr, userId);
        
        // Confirm the liked status + count from API
        setIsLiked(result.liked);
        setLikesCount(result.likesCount ?? 0);
        
        // If server disagrees with our optimistic flip, revert to server truth
        if (result.liked !== !currentLiked) {
          setIsLiked(result.liked);
          setLikesCount(result.likesCount ?? currentCount);
        }
      } else {
        // Legacy numeric ID - use old endpoint
        const accessToken = nhost.auth.getAccessToken();
        if (!accessToken) {
          throw new Error("No access token available");
        }
        
        if (currentLiked) {
          const response = await reviewService.unlikeComment(reviewIdStr, accessToken);
          setIsLiked(response.userLiked);
          setLikesCount(response.likesCount);
        } else {
          const response = await reviewService.likeComment(reviewIdStr, accessToken);
          setIsLiked(response.userLiked);
          setLikesCount(response.likesCount);
        }
      }

      // NO SUCCESS TOAST - smooth like modern social media
    } catch (error: any) {
      // Revert on error
      setIsLiked(currentLiked);
      setLikesCount(currentCount);
      
      console.error("Error toggling like:", error);
      
      // Only show toast on error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('JSON') || errorMessage.includes('<!DOCTYPE')) {
        toast.error("Failed to update like. Please try again.");
      } else {
        toast.error("Failed to update like");
      }
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, isLiked, likesCount, isLoading, user, nhostUser, getUserUuid, onAuthRequired]);

  return {
    isLiked,
    likesCount,
    isLoading,
    toggleLike,
  };
}

