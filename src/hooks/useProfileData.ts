import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
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
}

// Support both UUID (string) and legacy numeric IDs
export const useProfileData = (targetUserId: string | number): UseProfileDataReturn => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [nameLoading, setNameLoading] = useState(true);
  const [aboutMeLoading, setAboutMeLoading] = useState(true);
  const [palatesLoading, setPalatesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isViewingOwnProfile = useMemo(() => {
    // Compare as strings to handle both UUID and numeric IDs
    return String(session?.user?.id) === String(targetUserId);
  }, [session?.user?.id, targetUserId]);

  useEffect(() => {
    const fetchPublicUserData = async () => {
      if (!targetUserId) {
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
        // Convert targetUserId to string for API call
        const userIdStr = String(targetUserId);
        
        // Validate ID format before making API call
        // Hasura uses UUID format, but we also support numeric IDs for legacy compatibility
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdStr);
        const isNumeric = /^\d+$/.test(userIdStr);
        
        if (!isUUID && !isNumeric) {
          console.error('useProfileData: Invalid user ID format:', userIdStr);
          setError('Invalid user ID format');
          setUserData(null);
          setLoading(false);
          setNameLoading(false);
          setAboutMeLoading(false);
          setPalatesLoading(false);
          return;
        }
        
        // Log ID format for debugging
        console.log('[useProfileData] Fetching user data:', {
          userId: userIdStr,
          isUUID: isUUID,
          isNumeric: isNumeric,
          targetUserId: targetUserId,
          targetUserIdType: typeof targetUserId
        });
        
        // Fetch user data from Hasura using restaurant_users API
        const response = await restaurantUserService.getUserById(userIdStr);
        
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
          
          // Extract follower and following counts
          setFollowersCount(response.data.followers_count ?? 0);
          setFollowingCount(response.data.following_count ?? 0);
          
          setUserData(mappedUser);
          setError(null);
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
  }, [targetUserId, isViewingOwnProfile, session?.user]);

  return {
    userData,
    nameLoading,
    aboutMeLoading,
    palatesLoading,
    loading,
    isViewingOwnProfile,
    error,
    followersCount,
    followingCount
  };
};
