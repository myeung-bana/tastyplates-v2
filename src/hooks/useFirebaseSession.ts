import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface HasuraUser {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  profile_image?: {
    url: string;
    alt_text?: string;
  } | string | any; // Can be object, string, or JSONB
  firebase_uuid: string;
  about_me?: string;
  palates?: string | any[] | any; // Can be string, array, or JSONB
  onboarding_complete?: boolean;
}

interface FirebaseSession {
  user: HasuraUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for Firebase-based session management
 * Replaces NextAuth's useSession hook
 * 
 * This hook:
 * 1. Listens to Firebase auth state changes
 * 2. Fetches corresponding Hasura user data when authenticated
 * 3. Provides loading states and error handling
 * 
 * @returns {FirebaseSession} Session object with user data and loading state
 */
export function useFirebaseSession(): FirebaseSession {
  const [user, setUser] = useState<HasuraUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // Get Firebase ID token for authentication
          const idToken = await fbUser.getIdToken();
          
          // Use absolute URL for fetch to avoid issues with relative paths
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '');
          
          const apiUrl = `${baseUrl}/api/user/me`;
          
          // Fetch Hasura user data by firebase_uuid
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              // User not authenticated
              setUser(null);
              setError(null);
            } else if (response.status === 404) {
              // User not found in Hasura (might be a new user)
              setUser(null);
              setError('User account not found in database');
            } else {
              // Try to get error message from response
              let errorMessage = 'Failed to fetch user data';
              try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
              } catch {
                // If response is not JSON, use default message
              }
              throw new Error(errorMessage);
            }
          } else {
            const userData = await response.json();
            
            if (userData.success && userData.data) {
              setUser(userData.data);
              setError(null);
            } else {
              setUser(null);
              setError(userData.message || 'User data not found');
            }
          }
        } catch (err) {
          // Handle network errors gracefully
          if (err instanceof TypeError && err.message.includes('fetch')) {
            console.error('Network error fetching user data:', err);
            setError('Network error: Unable to connect to server');
          } else {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch user data');
          }
          setUser(null);
        }
      } else {
        // User signed out
        setUser(null);
        setError(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, firebaseUser, loading, error };
}

/**
 * Helper hook to check if user is authenticated
 */
export function useAuth() {
  const { user, firebaseUser, loading } = useFirebaseSession();
  return {
    isAuthenticated: !!user && !!firebaseUser,
    user,
    firebaseUser,
    loading,
  };
}
