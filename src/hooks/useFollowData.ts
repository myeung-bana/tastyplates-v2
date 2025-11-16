import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FollowService } from '@/services/follow/followService';
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

export const useFollowData = (targetUserId: number): UseFollowDataReturn => {
  const { data: session } = useSession();
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
      return;
    }
    
    setFollowingLoading(true);
    setFollowersLoading(true);
    
    try {
      // Public endpoints - don't pass token as these endpoints don't require authentication
      // Passing a token causes the JWT plugin to validate it, which can fail and block the request
      // Use Promise.allSettled instead of Promise.all to prevent one failure from blocking
      const [followingResult, followersResult] = await Promise.allSettled([
        followService.getFollowingList(targetUserId), // No token for public endpoint
        followService.getFollowersList(targetUserId, []) // No token for public endpoint
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
      
      hasLoadedFollowData.current = true;
    } catch (error) {
      console.error("Error loading follow data:", error);
      // Ensure we set empty arrays on error
      setFollowing([]);
      setFollowers([]);
    } finally {
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
    if (!session?.accessToken) return;
    
    const userIdNum = Number(id);
    if (isNaN(userIdNum)) return;
    
    const response = await followService.followUser(userIdNum, session.accessToken);
    if (response.status === code.success) {
      localStorage.removeItem(FOLLOWING_KEY(targetUserId));
      localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
      localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
      await refreshFollowData();
    }
  }, [session?.accessToken, targetUserId, refreshFollowData]);

  const handleUnfollow = useCallback(async (id: string) => {
    if (!session?.accessToken) return;
    
    const userIdNum = Number(id);
    if (isNaN(userIdNum)) return;
    
    const response = await followService.unfollowUser(userIdNum, session.accessToken);
    if (response.status === code.success) {
      localStorage.removeItem(FOLLOWING_KEY(targetUserId));
      localStorage.removeItem(FOLLOWERS_KEY(targetUserId));
      localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
      await refreshFollowData();
    }
  }, [session?.accessToken, targetUserId, refreshFollowData]);

  // Load follow data when dependencies change
  // Public endpoints - no need to require session token
  useEffect(() => {
    if (!targetUserId || hasLoadedFollowData.current) return;
    loadFollowData();
  }, [targetUserId, loadFollowData]);

  // Reset follow data when targetUserId changes
  useEffect(() => {
    hasLoadedFollowData.current = false;
    setFollowers([]);
    setFollowing([]);
  }, [targetUserId]);

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
