import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

interface UseProfileDataReturn {
  userData: Record<string, unknown> | null;
  nameLoading: boolean;
  aboutMeLoading: boolean;
  palatesLoading: boolean;
  loading: boolean;
  isViewingOwnProfile: boolean;
  error: string | null;
  followersCount: number;
  followingCount: number;
  refreshCounts: () => Promise<void>;
}

// Support username, UUID (string), and legacy numeric IDs
export const useProfileData = (targetUserIdentifier: string | number): UseProfileDataReturn => {
  const { user } = useFirebaseSession();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [nameLoading, setNameLoading] = useState(true);
  const [aboutMeLoading, setAboutMeLoading] = useState(true);
  const [palatesLoading, setPalatesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isViewingOwnProfile = useMemo(() => {
    if (!user || !targetUserIdentifier) return false;
    
    // Compare by ID (UUID) if available
    if (user.id) {
      const identifierStr = String(targetUserIdentifier);
      const userIdStr = String(user.id);
      
      // Direct ID match
      if (identifierStr === userIdStr) return true;
      
      // If identifier is username, check if it matches user's username
      // We'll need to fetch user data first to compare usernames, so this is a fallback
      // The actual comparison will happen after userData is loaded
    }
    
    return false;
  }, [user?.id, user?.username, targetUserIdentifier]);

  useEffect(() => {
    const fetchPublicUserData = async () => {
      if (!targetUserIdentifier) {
        setUserData(null);
        setLoading(false);
        setNameLoading(false);
        setAboutMeLoading(false);
        setPalatesLoading(false);
        setError(null);
        return;
      }

      setNameLoading(true);
      setAboutMeLoading(true);
      setPalatesLoading(true);
      setLoading(true);
      setError(null);
      
      try {
        // Convert targetUserIdentifier to string for API call
        const identifierStr = String(targetUserIdentifier);
        
        // Detect format: UUID, numeric ID, or username
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifierStr);
        const isNumeric = /^\d+$/.test(identifierStr);
        const isUsername = !isUUID && !isNumeric && /^[a-zA-Z0-9._-]+$/.test(identifierStr);
        
        // Log identifier format for debugging
        console.log('[useProfileData] Fetching user data:', {
          identifier: identifierStr,
          isUUID: isUUID,
          isNumeric: isNumeric,
          isUsername: isUsername,
          targetUserIdentifier: targetUserIdentifier,
          targetUserIdentifierType: typeof targetUserIdentifier
        });
        
        // Fetch user data based on identifier type
        let response;
        if (isUsername) {
          // Fetch by username
          response = await restaurantUserService.getUserByUsername(identifierStr);
        } else if (isUUID || isNumeric) {
          // Fetch by ID (UUID or numeric)
          response = await restaurantUserService.getUserById(identifierStr);
        } else {
          console.error('useProfileData: Invalid user identifier format:', identifierStr);
          setError('Invalid user identifier format');
          setUserData(null);
          setLoading(false);
          setNameLoading(false);
          setAboutMeLoading(false);
          setPalatesLoading(false);
          return;
        }
        
        if (response.success && response.data) {
          // Map Hasura user data to expected format
          const mappedUser = {
            id: response.data.id,
            username: response.data.username,
            display_name: response.data.display_name || response.data.username,
            email: response.data.email,
            about_me: response.data.about_me,
            palates: response.data.palates,
            profile_image: response.data.profile_image,
            birthdate: response.data.birthdate,
            gender: response.data.gender,
            custom_gender: response.data.custom_gender,
            pronoun: response.data.pronoun,
            address: response.data.address,
            zip_code: response.data.zip_code,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            language_preference: response.data.language_preference,
            firebase_uuid: response.data.firebase_uuid,
            auth_method: response.data.auth_method,
            onboarding_complete: response.data.onboarding_complete,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
          };
          
          setUserData(mappedUser);
          setError(null);
          
          // Fetch follower and following counts separately using new endpoints
          const userId = mappedUser.id as string;
          if (userId) {
            // Check if it's a UUID format
            const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
            
            if (isUUIDFormat) {
              // Fetch counts from new API endpoints
              const [followersCountResult, followingCountResult] = await Promise.allSettled([
                restaurantUserService.getFollowersCount(userId),
                restaurantUserService.getFollowingCount(userId)
              ]);
              
              // Handle followers count
              if (followersCountResult.status === 'fulfilled' && followersCountResult.value.success) {
                setFollowersCount(followersCountResult.value.data.followersCount);
              } else {
                console.warn('Failed to load followers count:', 
                  followersCountResult.status === 'rejected' 
                    ? followersCountResult.reason 
                    : followersCountResult.value.error
                );
                setFollowersCount(0);
              }
              
              // Handle following count
              if (followingCountResult.status === 'fulfilled' && followingCountResult.value.success) {
                setFollowingCount(followingCountResult.value.data.followingCount);
              } else {
                console.warn('Failed to load following count:', 
                  followingCountResult.status === 'rejected' 
                    ? followingCountResult.reason 
                    : followingCountResult.value.error
                );
                setFollowingCount(0);
              }
            } else {
              // For non-UUID IDs, use legacy counts from user data or set to 0
              setFollowersCount(response.data.followers_count ?? 0);
              setFollowingCount(response.data.following_count ?? 0);
            }
          }
        } else {
          const errorMsg = response.error || 'User not found';
          setError(errorMsg);
          setUserData(null);
          console.error("Failed to fetch user data:", response);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch user data';
        setError(errorMsg);
        setUserData(null);
      } finally {
        setNameLoading(false);
        setAboutMeLoading(false);
        setPalatesLoading(false);
        setLoading(false);
      }
    };

    fetchPublicUserData();
  }, [targetUserIdentifier, user]);
  
  // Update isViewingOwnProfile after userData is loaded (for username comparison)
  const actualIsViewingOwnProfile = useMemo(() => {
    if (!user || !userData) return isViewingOwnProfile;
    
    // Compare by ID
    if (user.id && userData.id && String(user.id) === String(userData.id)) {
      return true;
    }
    
    // Compare by username
    if (user.username && userData.username && user.username === userData.username) {
      return true;
    }
    
    return false;
  }, [user?.id, user?.username, userData?.id, userData?.username, isViewingOwnProfile]);

  // Function to refresh follower and following counts
  const refreshCounts = useCallback(async () => {
    if (!userData?.id) return;
    
    const userId = userData.id as string;
    const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (isUUIDFormat) {
      const [followersCountResult, followingCountResult] = await Promise.allSettled([
        restaurantUserService.getFollowersCount(userId),
        restaurantUserService.getFollowingCount(userId)
      ]);
      
      // Handle followers count
      if (followersCountResult.status === 'fulfilled' && followersCountResult.value.success) {
        setFollowersCount(followersCountResult.value.data.followersCount);
      }
      
      // Handle following count
      if (followingCountResult.status === 'fulfilled' && followingCountResult.value.success) {
        setFollowingCount(followingCountResult.value.data.followingCount);
      }
    }
  }, [userData?.id]);

  return {
    userData,
    nameLoading,
    aboutMeLoading,
    palatesLoading,
    loading,
    isViewingOwnProfile: actualIsViewingOwnProfile,
    error,
    followersCount,
    followingCount,
    refreshCounts
  };
};
