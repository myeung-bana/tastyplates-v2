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
  };
  firebase_uuid: string;
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
          
          // Fetch Hasura user data by firebase_uuid
          const response = await fetch('/api/user/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
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
          console.error('Error fetching user data:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch user data');
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
