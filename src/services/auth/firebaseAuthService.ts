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
   * Check if an error is an expected authentication error (user-facing)
   * vs an unexpected system error
   */
  private isExpectedAuthError(error: any): boolean {
    const errorCode = error?.code || '';
    
    // Expected authentication errors that users can fix
    const expectedErrorCodes = [
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-credential',
      'auth/invalid-email',
      'auth/too-many-requests',
      'auth/weak-password',
      'auth/email-already-in-use',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/popup-blocked',
      'auth/account-exists-with-different-credential',
    ];
    
    return expectedErrorCodes.includes(errorCode);
  }

  /**
   * Map Firebase error codes to user-friendly messages
   */
  private getFirebaseErrorMessage(error: any): string {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    // Map Firebase Auth error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      // Authentication errors
      'auth/user-not-found': 'No account found with this email address. Please check your email or sign up.',
      'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
      'auth/invalid-email': 'Invalid email address. Please enter a valid email.',
      'auth/user-disabled': 'This account has been disabled. Please contact support for assistance.',
      'auth/too-many-requests': 'Too many failed login attempts. Please try again later or reset your password.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
      'auth/weak-password': 'Password is too weak. Please use a stronger password.',
      'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
      'auth/requires-recent-login': 'For security reasons, please sign out and sign in again.',
      'auth/credential-already-in-use': 'This credential is already associated with another account.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
      'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',
    };

    // Check if we have a mapped message for this error code
    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }

    // If no specific mapping, try to extract a meaningful message from the error
    if (errorMessage) {
      // Remove Firebase error prefix if present
      const cleanMessage = errorMessage.replace(/^Firebase:?\s*/i, '');
      return cleanMessage;
    }

    // Fallback to generic message
    return 'An error occurred during sign in. Please try again.';
  }

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
        // If Hasura fails, return error directly instead of throwing
        const errorMessage = hasuraError instanceof Error ? hasuraError.message : 'Failed to create user account';
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        user: firebaseUser,
        firebase_uuid: firebaseUser.uid
      };
    } catch (error: any) {
      // Use console.debug for expected errors, console.error for unexpected ones
      const isExpected = this.isExpectedAuthError(error);
      const logMethod = isExpected ? console.debug : console.error;
      
      logMethod('[FirebaseAuth] Registration error:', {
        error: error.message,
        code: error.code,
        fullError: error
      });
      
      const userFriendlyMessage = this.getFirebaseErrorMessage(error);
      return {
        success: false,
        error: userFriendlyMessage
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
        // If Hasura fails, we can't proceed with login - return error directly
        const errorMessage = hasuraError instanceof Error ? hasuraError.message : 'Failed to access user account. Please try again.';
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        user: firebaseUser,
        firebase_uuid: firebaseUser.uid
      };
    } catch (error: any) {
      // Use console.debug for expected errors, console.error for unexpected ones
      const isExpected = this.isExpectedAuthError(error);
      const logMethod = isExpected ? console.debug : console.error;
      
      logMethod('[FirebaseAuth] Sign in error:', {
        error: error.message,
        code: error.code,
        fullError: error
      });
      
      const userFriendlyMessage = this.getFirebaseErrorMessage(error);
      return {
        success: false,
        error: userFriendlyMessage
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
      // Use console.debug for expected errors, console.error for unexpected ones
      const isExpected = this.isExpectedAuthError(error);
      const logMethod = isExpected ? console.debug : console.error;
      
      logMethod('[FirebaseAuth] Google sign in error:', {
        error: error.message,
        code: error.code,
        fullError: error
      });
      
      const userFriendlyMessage = this.getFirebaseErrorMessage(error);
      return {
        success: false,
        error: userFriendlyMessage
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
