import { useState, useEffect, useRef } from 'react';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import { DEFAULT_USER_ICON } from '@/constants/images';

// Helper to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  
  if (typeof profileImage === 'string') {
    return profileImage;
  }
  
  if (typeof profileImage === 'object') {
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  
  return null;
};

export interface UserData {
  id: string;
  display_name: string;
  username: string;
  profile_image: string;
}

interface UseUserDataReturn {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

// Simple in-memory cache to avoid duplicate requests
const userDataCache = new Map<string, { data: UserData | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Lightweight hook to fetch basic user data from restaurant_users table
 * Used for review components that need display_name, username, and profile_image
 * 
 * @param userId - UUID string from restaurant_users.id or undefined
 * @returns UserData with display_name, username, and profile_image URL
 */
export const useUserData = (userId: string | undefined): UseUserDataReturn => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset state if userId is undefined
    if (!userId) {
      setUserData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cached = userDataCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setUserData(cached.data);
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

    const fetchUserData = async () => {
      try {
        const response = await restaurantUserService.getUserById(userId);
        
        if (response.success && response.data) {
          const profileImageUrl = getProfileImageUrl(response.data.profile_image) || DEFAULT_USER_ICON;
          
          const user: UserData = {
            id: response.data.id,
            display_name: response.data.display_name || response.data.username || 'Unknown User',
            username: response.data.username || 'Unknown User',
            profile_image: profileImageUrl,
          };

          // Update cache
          userDataCache.set(userId, { data: user, timestamp: Date.now() });
          
          // Only update state if request wasn't aborted
          if (!currentController.signal.aborted) {
            setUserData(user);
            setError(null);
          }
        } else {
          const errorMsg = response.error || 'User not found';
          if (!currentController.signal.aborted) {
            setError(errorMsg);
            setUserData(null);
          }
        }
      } catch (err) {
        if (!currentController.signal.aborted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user data';
          setError(errorMsg);
          setUserData(null);
          console.error('Error fetching user data:', err);
        }
      } finally {
        if (!currentController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    // Cleanup: abort request if component unmounts or userId changes
    return () => {
      if (currentController) {
        currentController.abort();
      }
    };
  }, [userId]);

  return {
    userData,
    loading,
    error,
  };
};

