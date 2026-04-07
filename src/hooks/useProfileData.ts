import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNhostSession } from '@/hooks/useNhostSession';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

/** Prevents hung API calls from blocking the profile UI forever (common on slow mobile networks). */
const FETCH_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

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
  const { user, nhostUser } = useNhostSession();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  // Start false: when targetUserIdentifier is empty (session not hydrated), we must not flash
  // full-screen "loading" until the effect runs — initial true caused stuck spinner on mobile.
  const [nameLoading, setNameLoading] = useState(false);
  const [aboutMeLoading, setAboutMeLoading] = useState(false);
  const [palatesLoading, setPalatesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isViewingOwnProfile = useMemo(() => {
    if (!targetUserIdentifier) return false;
    const identifierStr = String(targetUserIdentifier);
    if (user?.user_id && identifierStr === String(user.user_id)) return true;
    // Restaurant profile fetch can fail while Nhost session is valid — still "own" if ids match
    if (nhostUser?.id && identifierStr === String(nhostUser.id)) return true;
    return false;
  }, [user?.user_id, nhostUser?.id, targetUserIdentifier]);

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

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
        const identifierStr = String(targetUserIdentifier);
        
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifierStr);
        const isNumeric = /^\d+$/.test(identifierStr);
        const isUsername = !isUUID && !isNumeric && /^[a-zA-Z0-9._-]+$/.test(identifierStr);
        
        console.log('[useProfileData] Fetching user data:', {
          identifier: identifierStr,
          isUUID,
          isNumeric,
          isUsername,
        });
        
        let response;
        if (isUsername) {
          response = await withTimeout(
            restaurantUserService.getUserByUsername(identifierStr),
            FETCH_TIMEOUT_MS,
            'getUserByUsername'
          );
        } else if (isUUID || isNumeric) {
          response = await withTimeout(
            restaurantUserService.getUserById(identifierStr),
            FETCH_TIMEOUT_MS,
            'getUserById'
          );
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

        // Stale — a newer fetch has superseded this one
        if (currentFetchId !== fetchIdRef.current) return;
        
        if (response.success && response.data) {
          // Map Hasura user data to expected format
          const mappedUser = {
            id: response.data.id,
            username: response.data.username,
            display_name: response.data.username,
            email: response.data.email,
            avatarUrl: response.data.avatarUrl ?? null,
            about_me: response.data.about_me,
            palates: response.data.palates,
            profile_image: response.data.profile_image,
            birthdate: response.data.birthdate,
            gender: response.data.gender,
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

          const userId = mappedUser.id as string;
          const isUUIDFormat = userId
            ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                userId
              )
            : false;

          if (userId && !isUUIDFormat) {
            setFollowersCount(response.data.followers_count ?? 0);
            setFollowingCount(response.data.following_count ?? 0);
          }
          // UUID: load follower counts in the background so a hung count API cannot block
          // loading=false / profile edit form (fixes mobile "stuck on loading profile").
          if (userId && isUUIDFormat) {
            void Promise.allSettled([
              withTimeout(
                restaurantUserService.getFollowersCount(userId),
                FETCH_TIMEOUT_MS,
                'getFollowersCount'
              ),
              withTimeout(
                restaurantUserService.getFollowingCount(userId),
                FETCH_TIMEOUT_MS,
                'getFollowingCount'
              ),
            ]).then(([followersCountResult, followingCountResult]) => {
              if (
                followersCountResult.status === 'fulfilled' &&
                followersCountResult.value.success
              ) {
                setFollowersCount(followersCountResult.value.data.followersCount);
              } else {
                console.warn(
                  'Failed to load followers count:',
                  followersCountResult.status === 'rejected'
                    ? followersCountResult.reason
                    : followersCountResult.value.error
                );
                setFollowersCount(0);
              }
              if (
                followingCountResult.status === 'fulfilled' &&
                followingCountResult.value.success
              ) {
                setFollowingCount(followingCountResult.value.data.followingCount);
              } else {
                console.warn(
                  'Failed to load following count:',
                  followingCountResult.status === 'rejected'
                    ? followingCountResult.reason
                    : followingCountResult.value.error
                );
                setFollowingCount(0);
              }
            });
          }
        } else {
          const errorMsg = response.error || 'User not found';
          setError(errorMsg);
          setUserData(null);
          console.error("Failed to fetch user data:", response);
        }
      } catch (error) {
        if (currentFetchId !== fetchIdRef.current) return;
        console.error("Error fetching user data:", error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch user data';
        setError(errorMsg);
        setUserData(null);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setNameLoading(false);
          setAboutMeLoading(false);
          setPalatesLoading(false);
          setLoading(false);
        }
      }
    };

    fetchPublicUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserIdentifier]);
  
  // Update isViewingOwnProfile after userData is loaded (for username comparison)
  const actualIsViewingOwnProfile = useMemo(() => {
    if (!userData) return isViewingOwnProfile;

    if (user?.user_id && userData.id && String(user.user_id) === String(userData.id)) {
      return true;
    }
    if (nhostUser?.id && userData.id && String(nhostUser.id) === String(userData.id)) {
      return true;
    }
    if (user?.username && userData.username && user.username === userData.username) {
      return true;
    }
    return isViewingOwnProfile;
  }, [user?.user_id, user?.username, nhostUser?.id, userData?.id, userData?.username, isViewingOwnProfile]);

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
