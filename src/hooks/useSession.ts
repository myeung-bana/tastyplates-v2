/**
 * Universal session hook - works with both Firebase and Nhost
 * Provides a unified interface during migration period
 * 
 * Set NEXT_PUBLIC_USE_NHOST=true in .env to use Nhost
 * Set NEXT_PUBLIC_USE_NHOST=false (or omit) to use Firebase
 */

import { useFirebaseSession } from './useFirebaseSession';
import { useNhostSession } from './useNhostSession';

// Check if we should use Nhost (default to true for new setup)
const USE_NHOST = process.env.NEXT_PUBLIC_USE_NHOST !== 'false';

interface UniversalUser {
  id?: string;
  user_id?: string; // Nhost uses user_id in user_profiles
  email?: string;
  username?: string;
  display_name?: string;
  profile_image?: any;
  firebase_uuid?: string; // Legacy Firebase field
  about_me?: string;
  palates?: any;
  onboarding_complete?: boolean;
}

interface UniversalAuthUser {
  uid?: string; // Firebase
  id?: string; // Nhost
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  avatarUrl?: string; // Nhost
  emailVerified?: boolean;
  getIdToken?: () => Promise<string>; // Firebase method
}

interface UniversalSession {
  user: UniversalUser | null;
  authUser: UniversalAuthUser | null; // firebaseUser or nhostUser
  loading: boolean;
  error: string | null;
}

/**
 * Universal session hook that works with both Firebase and Nhost
 * Use this during migration to switch between auth systems via env var
 */
export function useSession(): UniversalSession {
  if (USE_NHOST) {
    const { user, nhostUser, loading, error } = useNhostSession();
    return { 
      user: user as UniversalUser | null, 
      authUser: nhostUser as UniversalAuthUser | null,
      loading, 
      error 
    };
  } else {
    const { user, firebaseUser, loading, error } = useFirebaseSession();
    return { 
      user: user as UniversalUser | null, 
      authUser: firebaseUser as UniversalAuthUser | null,
      loading, 
      error 
    };
  }
}

/**
 * Helper hook to check if user is authenticated
 * Compatible with both Firebase and Nhost
 */
export function useAuth() {
  const { user, authUser, loading } = useSession();
  return {
    isAuthenticated: !!user && !!authUser,
    user,
    authUser,
    loading,
  };
}

/**
 * Get access token for API calls
 * Works with both Firebase and Nhost
 */
export async function getAccessToken(): Promise<string | null> {
  if (USE_NHOST) {
    const { auth } = await import('@/lib/nhost');
    return auth.getAccessToken();
  } else {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  }
}

/**
 * Universal sign out function
 * Works with both Firebase and Nhost
 */
export async function signOut(): Promise<void> {
  if (USE_NHOST) {
    const { nhostAuthService } = await import('@/services/auth/nhostAuthService');
    await nhostAuthService.signOut();
  } else {
    const { firebaseAuthService } = await import('@/services/auth/firebaseAuthService');
    await firebaseAuthService.signOut();
  }
}
