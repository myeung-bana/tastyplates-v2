// firebaseAuthService.ts - Firebase Authentication Service
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

export interface FirebaseAuthResult {
  success: boolean;
  user?: FirebaseUser;
  firebase_uuid?: string;
  error?: string;
}

class FirebaseAuthService {
  /**
   * Register new user with email/password
   */
  async registerWithEmail(email: string, password: string): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user in Hasura and wait for it to complete
      try {
        console.log('[FirebaseAuth] Creating user in Hasura:', {
          firebase_uuid: firebaseUser.uid,
          email: firebaseUser.email,
          auth_method: this.getAuthMethod(firebaseUser)
        });
        
        const hasuraUser = await restaurantUserService.createUser({
          firebase_uuid: firebaseUser.uid,
          email: firebaseUser.email!,
          username: this.generateUsernameFromEmail(firebaseUser.email!),
          display_name: firebaseUser.displayName || undefined,
          profile_image: firebaseUser.photoURL ? {
            url: firebaseUser.photoURL,
            alt_text: `${firebaseUser.displayName || 'User'} profile picture`
          } : undefined,
          auth_method: this.getAuthMethod(firebaseUser), // Track authentication method
          onboarding_complete: false, // New users start with onboarding incomplete
        });

        console.log('[FirebaseAuth] Hasura user creation result:', {
          success: hasuraUser.success,
          userId: hasuraUser.data?.id
        });

        if (!hasuraUser.success) {
          // If Hasura creation fails, throw error so registration fails
          console.error('[FirebaseAuth] Failed to create user in Hasura:', hasuraUser);
          throw new Error('Failed to create user account. Please try again.');
        }

        // Verify user was created by fetching it back
        console.log('[FirebaseAuth] Verifying user creation...');
        let verifyUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
        if (!verifyUser.success || !verifyUser.data) {
          // Retry once after a short delay (handles race condition)
          console.log('[FirebaseAuth] User not found immediately, retrying after 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          verifyUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
          if (!verifyUser.success || !verifyUser.data) {
            console.error('[FirebaseAuth] User verification failed after retry:', {
              success: verifyUser.success,
              hasData: !!verifyUser.data
            });
            throw new Error('User account created but verification failed. Please try signing in.');
          }
        }
        
        console.log('[FirebaseAuth] User verified successfully:', {
          userId: verifyUser.data?.id,
          email: verifyUser.data?.email
        });
      } catch (hasuraError) {
        console.error('[FirebaseAuth] Error creating user in Hasura:', {
          error: hasuraError instanceof Error ? hasuraError.message : String(hasuraError),
          stack: hasuraError instanceof Error ? hasuraError.stack : undefined
        });
        // If Hasura fails, we should still allow Firebase user creation
        // But log the error for debugging
        throw new Error(hasuraError instanceof Error ? hasuraError.message : 'Failed to create user account');
      }

      return {
        success: true,
        user: firebaseUser,
        firebase_uuid: firebaseUser.uid
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Sign in with email/password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user from Hasura
      try {
        console.log('[FirebaseAuth] Sign in - Checking user in Hasura:', {
          firebase_uuid: firebaseUser.uid,
          email: firebaseUser.email
        });

        let hasuraUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);

        if (!hasuraUser.success || !hasuraUser.data) {
          // User doesn't exist in Hasura - create them
          console.log('[FirebaseAuth] User not found in Hasura, creating user...');
          
          const createResult = await restaurantUserService.createUser({
            firebase_uuid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: this.generateUsernameFromEmail(firebaseUser.email!),
            display_name: firebaseUser.displayName || undefined,
            profile_image: firebaseUser.photoURL ? {
              url: firebaseUser.photoURL,
              alt_text: `${firebaseUser.displayName || 'User'} profile picture`
            } : undefined,
            auth_method: this.getAuthMethod(firebaseUser), // Track authentication method
            onboarding_complete: false, // New users start with onboarding incomplete
          });

          console.log('[FirebaseAuth] Hasura user creation result:', {
            success: createResult.success,
            userId: createResult.data?.id
          });

          if (!createResult.success) {
            console.error('[FirebaseAuth] Failed to create user in Hasura:', createResult);
            throw new Error('Failed to create user account in database. Please try again.');
          }

          // Verify user was created by fetching it back
          console.log('[FirebaseAuth] Verifying user creation...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for data propagation
          
          hasuraUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
          if (!hasuraUser.success || !hasuraUser.data) {
            // Retry once after a short delay (handles race condition)
            console.log('[FirebaseAuth] User not found immediately, retrying after 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            hasuraUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
            if (!hasuraUser.success || !hasuraUser.data) {
              console.error('[FirebaseAuth] User verification failed after retry:', {
                success: hasuraUser.success,
                hasData: !!hasuraUser.data
              });
              throw new Error('User account created but verification failed. Please try signing in again.');
            }
          }

          console.log('[FirebaseAuth] User verified successfully:', {
            userId: hasuraUser.data?.id,
            email: hasuraUser.data?.email
          });
        } else {
          console.log('[FirebaseAuth] User found in Hasura:', {
            userId: hasuraUser.data?.id,
            email: hasuraUser.data?.email
          });
        }
      } catch (hasuraError) {
        console.error('[FirebaseAuth] Error in Hasura user lookup/creation:', {
          error: hasuraError instanceof Error ? hasuraError.message : String(hasuraError),
          stack: hasuraError instanceof Error ? hasuraError.stack : undefined
        });
        // If Hasura fails, we can't proceed with login
        throw new Error(hasuraError instanceof Error ? hasuraError.message : 'Failed to access user account. Please try again.');
      }

      return {
        success: true,
        user: firebaseUser,
        firebase_uuid: firebaseUser.uid
      };
    } catch (error: any) {
      console.error('[FirebaseAuth] Sign in error:', {
        error: error.message,
        code: error.code
      });
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  }

  /**
   * Sign in/up with Google
   */
  async signInWithGoogle(): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      // Check if user exists in Hasura
      let hasuraUser;
      try {
        hasuraUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
      } catch (error) {
        // User doesn't exist - will create below
        hasuraUser = { success: false };
      }

      if (!hasuraUser.success || !hasuraUser.data) {
        // Create user in Hasura
        try {
          const createResult = await restaurantUserService.createUser({
            firebase_uuid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: this.generateUsernameFromEmail(firebaseUser.email!),
            display_name: firebaseUser.displayName || undefined,
            profile_image: firebaseUser.photoURL ? {
              url: firebaseUser.photoURL,
              alt_text: `${firebaseUser.displayName || 'User'} profile picture`
            } : undefined,
            auth_method: this.getAuthMethod(firebaseUser), // Track authentication method (will be 'google.com')
          });

          if (!createResult.success) {
            console.error('Failed to create user in Hasura:', createResult);
            throw new Error('Failed to create user account. Please try again.');
          }

          // Verify user was created by fetching it back
          const verifyUser = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
          if (!verifyUser.success || !verifyUser.data) {
            // Retry once after a short delay (handles race condition)
            await new Promise(resolve => setTimeout(resolve, 500));
            const retryVerify = await restaurantUserService.getUserByFirebaseUuid(firebaseUser.uid);
            if (!retryVerify.success || !retryVerify.data) {
              throw new Error('User account created but verification failed. Please try signing in.');
            }
          }
        } catch (createError) {
          console.error('Error creating user in Hasura:', createError);
          throw new Error(createError instanceof Error ? createError.message : 'Failed to create user account');
        }
      }

      return {
        success: true,
        user: firebaseUser,
        firebase_uuid: firebaseUser.uid
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Google sign in failed'
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Extract authentication method from Firebase user
   * Returns the primary provider ID (e.g., 'password', 'google.com', 'facebook.com')
   */
  private getAuthMethod(firebaseUser: FirebaseUser): string {
    // Get primary provider from providerData
    const providerData = firebaseUser.providerData;
    if (providerData && providerData.length > 0) {
      // providerId examples: 'google.com', 'facebook.com', 'password', 'twitter.com', etc.
      return providerData[0].providerId;
    }
    // Fallback: determine from how user was created
    // If email is verified and no providerData, it's likely password
    // Otherwise, default to 'unknown'
    return firebaseUser.emailVerified ? 'password' : 'unknown';
  }

  /**
   * Generate username from email
   */
  private generateUsernameFromEmail(email: string): string {
    let username = email.split('@')[0] || 'user';
    username = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (!username) {
      username = `user${Date.now()}`;
    }
    return username;
  }
}

export const firebaseAuthService = new FirebaseAuthService();

