import { useEffect, useState } from 'react';
import { useAuthenticationStatus, useUserData } from '@nhost/nextjs';
import { nhost } from '@/lib/nhost';

interface UserProfile {
  user_id: string;
  username: string;
  about_me?: string;
  birthdate?: string;
  gender?: string;
  palates?: any;
  onboarding_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NhostUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  defaultRole: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt?: string;
  lastSeen?: string;
  locale?: string;
  metadata?: Record<string, any>;
  disabled?: boolean;
  activeMfaType?: string;
}

interface NhostSession {
  user: UserProfile | null;
  nhostUser: NhostUser | null;
  loading: boolean;
  /** True as soon as Nhost has a session (no wait for profile). Use for instant logged-in UI. */
  authReady: boolean;
  error: string | null;
}

/**
 * Custom hook for Nhost-based session management
 * Replaces Firebase useFirebaseSession hook
 * 
 * This hook:
 * 1. Uses Nhost's built-in authentication hooks
 * 2. Fetches user profile data from user_profiles table
 * 3. Provides loading states and error handling
 * 
 * @returns {NhostSession} Session object with user data and loading state
 */
export function useNhostSession(): NhostSession {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const nhostUser = useUserData();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      // STEP 1: Log current auth state for debugging
      console.log('[useNhostSession] Auth state check:', { 
        isAuthenticated, 
        isLoading, 
        hasNhostUser: !!nhostUser,
        nhostUserId: nhostUser?.id 
      });

      // STEP 2: If still loading auth status, don't do anything yet
      if (isLoading) {
        console.log('[useNhostSession] Auth status loading, waiting...');
        return;
      }

      // STEP 3: If explicitly not authenticated, clear everything silently
      if (!isAuthenticated) {
        console.log('[useNhostSession] Not authenticated, clearing profile');
        setUser(null);
        setError(null);
        setProfileLoading(false);
        return;
      }

      // STEP 4: If authenticated but no user object yet, wait for it
      if (!nhostUser || !nhostUser.id) {
        console.log('[useNhostSession] Authenticated but no user object yet, waiting...');
        // Don't set error - just wait for user object to populate
        return;
      }

      // STEP 5: Only NOW fetch the profile (we're sure user is authenticated)
      if (!nhost) {
        setProfileLoading(false);
        return;
      }
      console.log('[useNhostSession] Fetching profile for authenticated user:', nhostUser.id);
      setProfileLoading(true);
      setError(null);

      try {
        // Fetch profile via server API (server can use Hasura admin access safely).
        const response = await fetch(
          `/api/v1/restaurant-users/get-restaurant-user-by-id?id=${encodeURIComponent(nhostUser.id)}`
        );
        const payload = await response.json().catch(() => ({} as any));

        if (!response.ok || !payload?.success) {
          console.error('[useNhostSession] API error fetching profile:', payload?.error || response.statusText);
          if (isAuthenticated && nhostUser) {
            setError('User profile temporarily unavailable');
          }
          setUser(null);
          return;
        }

        const profileData = payload?.data;
        const profile: UserProfile | null = profileData
          ? {
              user_id: profileData.user_id || profileData.id || nhostUser.id,
              username: profileData.username,
              about_me: profileData.about_me,
              birthdate: profileData.birthdate,
              gender: profileData.gender,
              palates: profileData.palates,
              onboarding_complete: profileData.onboarding_complete,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
            }
          : null;

        if (!profile) {
          // Profile doesn't exist - this might be a new user
          console.warn('[useNhostSession] User profile not found for user:', nhostUser.id);
          // Only set error if we're still authenticated
          if (isAuthenticated && nhostUser) {
            setError('User profile not found');
          }
          setUser(null);
          return;
        }

        console.log('[useNhostSession] Profile loaded successfully:', profile.username);
        setUser(profile);
        setError(null);
      } catch (err) {
        console.error('[useNhostSession] Exception fetching profile:', err);
        // Only set error if we're still authenticated
        if (isAuthenticated && nhostUser) {
          setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        }
        setUser(null);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchUserProfile();
  }, [isAuthenticated, isLoading, nhostUser]);

  const authReady = !isLoading && !!isAuthenticated && !!nhostUser?.id;

  return {
    user,
    nhostUser: nhostUser as NhostUser | null,
    loading: isLoading || profileLoading,
    authReady,
    error
  };
}

/**
 * Helper hook to check if user is authenticated
 * Compatible with old useAuth hook from Firebase
 */
export function useAuth() {
  const { user, nhostUser, loading } = useNhostSession();
  const { isAuthenticated } = useAuthenticationStatus();

  return {
    isAuthenticated,
    user,
    nhostUser,
    loading,
  };
}
