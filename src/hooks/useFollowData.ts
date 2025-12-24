import { useState, useEffect, useRef, useCallback } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { FollowService } from '@/services/follow/followService';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import { responseStatusCode as code } from '@/constants/response';
import { FOLLOW_SYNC_KEY, FOLLOWERS_KEY, FOLLOWING_KEY } from '@/constants/session';

interface UseFollowDataReturn {
  followers: Record<string, unknown>[];
  following: Record<string, unknown>[];
  followersLoading: boolean;
  followingLoading: boolean;
  handleFollow: (id: string) => Promise<void>;
  handleUnfollow: (id: string) => Promise<void>;
  refreshFollowData: () => Promise<void>;
}

// Helper to check if a value is a UUID
const isUUID = (value: string | number | null): boolean => {
  if (!value) return false;
  if (typeof value === 'number') return false;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(value);
};

export const useFollowData = (targetUserId: string | number | null): UseFollowDataReturn => {
  const { firebaseUser } = useFirebaseSession();
  const [followers, setFollowers] = useState<Record<string, unknown>[]>([]);
  const [following, setFollowing] = useState<Record<string, unknown>[]>([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const hasLoadedFollowData = useRef(false);

  const followService = useRef(new FollowService()).current;

  const loadFollowData = useCallback(async () => {
    if (!targetUserId) {
      // Set loading to false immediately if no targetUserId
      setFollowingLoading(false);
      setFollowersLoading(false);
      setFollowing([]);
      setFollowers([]);
      return;
    }
    
    setFollowingLoading(true);
    setFollowersLoading(true);
    
    // Add timeout to ensure loading states are cleared
    const timeoutId = setTimeout(() => {
      setFollowingLoading(false);
      setFollowersLoading(false);
      setFollowing([]);
      setFollowers([]);
    }, 10000); // 10 second timeout
    
    try {
      const userIdStr = String(targetUserId);
      const isUUIDFormat = isUUID(userIdStr);
      
      if (isUUIDFormat) {
        // Use new Hasura API endpoints for UUIDs
        const [followingResult, followersResult] = await Promise.allSettled([
          restaurantUserService.getFollowingList(userIdStr),
          restaurantUserService.getFollowersList(userIdStr)
        ]);
        
        // Handle following list result
        if (followingResult.status === 'fulfilled' && followingResult.value.success) {
          setFollowing(followingResult.value.data as unknown as Record<string, unknown>[]);
        } else {
          console.warn('Failed to load following list:', followingResult.status === 'rejected' ? followingResult.reason : followingResult.value.error);
          setFollowing([]);
        }
        
        // Handle followers list result
        if (followersResult.status === 'fulfilled' && followersResult.value.success) {
          setFollowers(followersResult.value.data as unknown as Record<string, unknown>[]);
        } else {
          console.warn('Failed to load followers list:', followersResult.status === 'rejected' ? followersResult.reason : followersResult.value.error);
          setFollowers([]);
        }
      } else {
        // Use legacy WordPress API endpoints for numeric IDs
        const numericUserId = typeof targetUserId === 'number' ? targetUserId : Number(targetUserId);
        
        if (isNaN(numericUserId) || numericUserId <= 0) {
          setFollowing([]);
          setFollowers([]);
          return;
        }
        
      const [followingResult, followersResult] = await Promise.allSettled([
          followService.getFollowingList(numericUserId),
          followService.getFollowersList(numericUserId, [])
      ]);
      
      // Handle following list result
      if (followingResult.status === 'fulfilled') {
        setFollowing(followingResult.value);
      } else {
        console.warn('Failed to load following list:', followingResult.reason);
        setFollowing([]);
      }
      
      // Handle followers list result
      if (followersResult.status === 'fulfilled') {
        setFollowers(followersResult.value);
      } else {
        console.warn('Failed to load followers list:', followersResult.reason);
        setFollowers([]);
        }
      }
      
      hasLoadedFollowData.current = true;
    } catch (error) {
      console.error("Error loading follow data:", error);
      // Ensure we set empty arrays on error
      setFollowing([]);
      setFollowers([]);
    } finally {
      clearTimeout(timeoutId);
      // Always set loading to false, even if there's an error
      setFollowingLoading(false);
      setFollowersLoading(false);
    }
  }, [targetUserId, followService]);

  const refreshFollowData = useCallback(async () => {
    hasLoadedFollowData.current = false;
    await loadFollowData();
  }, [loadFollowData]);

  const handleFollow = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    
    // Get Firebase ID token for authentication
    const idToken = await firebaseUser.getIdToken();
    
    // Check if ID is UUID format
    const isUUIDFormat = isUUID(id);
    
    if (isUUIDFormat) {
      // Use new Hasura API endpoint
      try {
        const response = await fetch('/api/v1/restaurant-users/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ user_id: id })
        });
        
        // Check if response is OK before parsing JSON
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to follow user' }));
          console.error('Failed to follow user:', errorData.error || `HTTP ${response.status}`);
          throw new Error(errorData.error || 'Failed to follow user');
        }
        
        const result = await response.json();
        if (result.success) {
          localStorage.removeItem(FOLLOWING_KEY(targetUserId));
          localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
          localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
          // Add a small delay to ensure database is updated before refreshing
          await new Promise(resolve => setTimeout(resolve, 300));
          await refreshFollowData();
        } else {
          console.error('Failed to follow user:', result.error);
          throw new Error(result.error || 'Failed to follow user');
        }
      } catch (error) {
        console.error('Error following user:', error);
        throw error;
      }
    } else {
      // Use legacy WordPress endpoint for numeric IDs
      const userIdNum = Number(id);
      if (isNaN(userIdNum)) return;
      
      const response = await followService.followUser(userIdNum, idToken);
      if (response.status === code.success) {
        localStorage.removeItem(FOLLOWING_KEY(targetUserId));
        localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
        localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
        // Add a small delay to ensure database is updated before refreshing
        await new Promise(resolve => setTimeout(resolve, 300));
        await refreshFollowData();
      }
    }
  }, [firebaseUser, targetUserId, refreshFollowData]);

  const handleUnfollow = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    
    // Get Firebase ID token for authentication
    const idToken = await firebaseUser.getIdToken();
    
    // Check if ID is UUID format
    const isUUIDFormat = isUUID(id);
    
    if (isUUIDFormat) {
      // Use new Hasura API endpoint
      try {
        const response = await fetch('/api/v1/restaurant-users/unfollow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ user_id: id })
        });
        
        // Check if response is OK before parsing JSON
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to unfollow user' }));
          console.error('Failed to unfollow user:', errorData.error || `HTTP ${response.status}`);
          // Don't throw error for "Not following this user" - it's a valid state
          if (errorData.error?.includes('Not following')) {
            // User is already not following, just refresh the data
            await refreshFollowData();
            return;
          }
          throw new Error(errorData.error || 'Failed to unfollow user');
        }
        
        const result = await response.json();
        if (result.success) {
          localStorage.removeItem(FOLLOWING_KEY(targetUserId));
          localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
          localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
          // Add a small delay to ensure database is updated before refreshing
          await new Promise(resolve => setTimeout(resolve, 300));
          await refreshFollowData();
        } else {
          console.error('Failed to unfollow user:', result.error);
          // Don't throw error for "Not following this user" - it's a valid state
          if (result.error?.includes('Not following')) {
            await refreshFollowData();
            return;
          }
          throw new Error(result.error || 'Failed to unfollow user');
        }
      } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
      }
    } else {
      // Use legacy WordPress endpoint for numeric IDs
      const userIdNum = Number(id);
      if (isNaN(userIdNum)) return;
      
      const response = await followService.unfollowUser(userIdNum, idToken);
      if (response.status === code.success) {
        localStorage.removeItem(FOLLOWING_KEY(targetUserId));
        localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
        localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
        // Add a small delay to ensure database is updated before refreshing
        await new Promise(resolve => setTimeout(resolve, 300));
        await refreshFollowData();
      }
    }
  }, [firebaseUser, targetUserId, refreshFollowData]);

  // Reset follow data when targetUserId changes
  useEffect(() => {
    hasLoadedFollowData.current = false;
    setFollowers([]);
    setFollowing([]);
    setFollowingLoading(true);
    setFollowersLoading(true);
  }, [targetUserId]);

  // Load follow data when dependencies change
  // Public endpoints - no need to require session token
  useEffect(() => {
    if (!targetUserId || hasLoadedFollowData.current) return;
    loadFollowData();
  }, [targetUserId, loadFollowData]);

  return {
    followers,
    following,
    followersLoading,
    followingLoading,
    handleFollow,
    handleUnfollow,
    refreshFollowData
  };
};
