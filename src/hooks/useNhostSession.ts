import { useEffect, useRef, useState } from 'react';
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
  /** From auth.users.locale; MVP: 'en' | 'zh' | 'ko', default 'en' */
  language_preference?: string;
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
  const fetchIdRef = useRef(0);

  // Stable primitive — avoids re-running the effect when Nhost refreshes
  // the session and returns a new nhostUser object with the same .id.
  const nhostUserId = nhostUser?.id ?? null;

  useEffect(() => {
    const id = ++fetchIdRef.current;

    async function fetchUserProfile() {
      if (isLoading) return;

      if (!isAuthenticated) {
        setUser(null);
        setError(null);
        setProfileLoading(false);
        return;
      }

      if (!nhostUserId) {
        setProfileLoading(false);
        return;
      }

      if (!nhost) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/restaurant-users/get-restaurant-user-by-id?id=${encodeURIComponent(nhostUserId)}`
        );

        // Stale response — a newer fetch superseded this one
        if (id !== fetchIdRef.current) return;

        const payload = await response.json().catch(() => ({} as any));

        if (!response.ok || !payload?.success) {
          console.error('[useNhostSession] API error fetching profile:', payload?.error || response.statusText);
          if (isAuthenticated) {
            setError('User profile temporarily unavailable');
          }
          setUser(null);
          return;
        }

        const profileData = payload?.data;
        const profile: UserProfile | null = profileData
          ? {
              user_id: profileData.user_id || profileData.id || nhostUserId,
              username: profileData.username,
              about_me: profileData.about_me,
              birthdate: profileData.birthdate,
              gender: profileData.gender,
              palates: profileData.palates,
              onboarding_complete: profileData.onboarding_complete,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
              language_preference: profileData.language_preference ?? 'en',
            }
          : null;

        if (!profile) {
          console.warn('[useNhostSession] User profile not found for user:', nhostUserId);
          if (isAuthenticated) {
            setError('User profile not found');
          }
          setUser(null);
          return;
        }

        setUser(profile);
        setError(null);
      } catch (err) {
        if (id !== fetchIdRef.current) return;
        console.error('[useNhostSession] Exception fetching profile:', err);
        if (isAuthenticated) {
          setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        }
        setUser(null);
      } finally {
        if (id === fetchIdRef.current) {
          setProfileLoading(false);
        }
      }
    }

    fetchUserProfile();
  }, [isAuthenticated, isLoading, nhostUserId]);

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
