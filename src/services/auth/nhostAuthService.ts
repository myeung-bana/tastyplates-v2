// nhostAuthService.ts - Nhost Authentication Service
import { nhost } from '@/lib/nhost';
import type { NhostSession } from '@nhost/nextjs';

export interface NhostAuthResult {
  success: boolean;
  session?: NhostSession | null;
  user?: any;
  error?: string;
}

interface UserProfileData {
  user_id: string;
  username: string;
  about_me?: string;
  birthdate?: string;
  gender?: string;
  palates?: any;
  onboarding_complete: boolean;
}

type UserProfileLookupResult =
  | { status: 'ok'; profile: any }
  | { status: 'not_found'; profile: null }
  | { status: 'error'; profile: null; error: any };

class NhostAuthService {
  /**
   * Guard: ensure Nhost client is available (e.g. not during build/SSR).
   * Use at the start of any method that calls nhost.auth or nhost.graphql.
   */
  private guardNhost(): boolean {
    if (!nhost) {
      console.warn('[NhostAuth] Nhost client not ready (e.g. build/SSR). Skipping.');
      return false;
    }
    return true;
  }

  /**
   * Map Nhost error messages to user-friendly messages
   * Enhanced to handle various error structures and verification issues
   */
  private getNhostErrorMessage(error: any): string {
    // Handle null/undefined errors
    if (!error) {
      return 'An error occurred. Please try again.';
    }

    // Log the full error for debugging
    console.log('[NhostAuth] Processing error:', JSON.stringify(error, null, 2));

    // Try to extract error message from various possible properties
    const errorMessage = 
      error?.message || 
      error?.error?.message || 
      error?.error || 
      error?.msg || 
      error?.statusText || 
      '';

    // Check for error status codes
    const errorStatus = error?.status || error?.error?.status || null;

    // Handle empty error objects
    if (Object.keys(error).length === 0 || (!errorMessage && !errorStatus)) {
      return 'Authentication failed. Please ensure your account exists and email/password authentication is enabled.';
    }
    
    // Common Nhost error patterns with enhanced verification messages
    const errorMappings: Record<string, string> = {
      'Invalid email or password': 'Invalid email or password. Please check your credentials and try again.',
      'invalid-email-password': 'Invalid email or password. Please check your credentials and try again.',
      'invalid credentials': 'Invalid email or password. Please check your credentials and try again.',
      'unverified-user': 'Your email address has not been verified. Please check your email for a verification link.',
      'email-not-verified': 'Your email address has not been verified. Please check your email for a verification link.',
      'user-email-not-verified': 'Your email address has not been verified. Please check your email for a verification link.',
      'Email not verified': 'Your email address has not been verified. Please check your email for a verification link.',
      'email already in use': 'An account with this email already exists. Please sign in instead.',
      'email-already-in-use': 'An account with this email already exists. Please sign in instead.',
      'user not found': 'No account found with this email address. Please check your email or sign up.',
      'user-not-found': 'No account found with this email address. Please check your email or sign up.',
      'invalid email': 'Invalid email address. Please enter a valid email.',
      'invalid-email': 'Invalid email address. Please enter a valid email.',
      'weak password': 'Password is too weak. Please use a stronger password (at least 8 characters).',
      'password-too-short': 'Password is too weak. Please use a stronger password (at least 8 characters).',
      'too many requests': 'Too many failed attempts. Please try again later.',
      'rate-limit': 'Too many failed attempts. Please try again later.',
      'network error': 'Network error. Please check your internet connection and try again.',
      'disabled-user': 'This account has been disabled. Please contact support.',
      'user-disabled': 'This account has been disabled. Please contact support.',
      'already-signed-in': 'You are already signed in.',
      'already signed in': 'You are already signed in.',
    };

    // Check for pattern matches (case-insensitive)
    const lowerErrorMessage = errorMessage.toLowerCase();
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (lowerErrorMessage.includes(pattern.toLowerCase())) {
        return message;
      }
    }

    // Handle specific status codes
    if (errorStatus === 401) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (errorStatus === 403) {
      return 'Your email address has not been verified. Please check your email for a verification link.';
    }
    if (errorStatus === 429) {
      return 'Too many failed attempts. Please try again later.';
    }

    // Return original error message if no mapping found
    if (errorMessage) {
      return errorMessage;
    }

    // Final fallback
    return 'An error occurred during authentication. Please try again.';
  }

  /**
   * Create user profile in user_profiles table
   * Called after successful Nhost auth registration
   */
  private async createUserProfile(userData: UserProfileData): Promise<boolean> {
    if (!this.guardNhost()) return false;
    try {
      const mutation = `
        mutation InsertUserProfile($object: user_profiles_insert_input!) {
          insert_user_profiles_one(object: $object) {
            user_id
            username
          }
        }
      `;

      const result = await nhost.graphql.request(mutation, {
        object: userData
      });

      if (result.error) {
        console.error('[NhostAuth] Failed to create user profile:', result.error);
        return false;
      }

      console.log('[NhostAuth] User profile created successfully:', {
        user_id: userData.user_id,
        username: userData.username
      });

      return true;
    } catch (error) {
      console.error('[NhostAuth] Error creating user profile:', error);
      return false;
    }
  }

  /**
   * Check if user profile exists (uses list query; by_pk may not be exposed for user role).
   */
  private async getUserProfile(userId: string): Promise<UserProfileLookupResult> {
    if (!this.guardNhost()) {
      return {
        status: 'error',
        profile: null,
        error: new Error('Nhost client not ready'),
      };
    }
    try {
      const query = `
        query GetUserProfile($user_id: uuid!) {
          user_profiles(where: { user_id: { _eq: $user_id } }, limit: 1) {
            user_id
            username
            about_me
            birthdate
            gender
            palates
            onboarding_complete
          }
        }
      `;

      const result = await nhost.graphql.request(query, {
        user_id: userId
      });

      if (result.error) {
        console.warn('[NhostAuth] Error fetching user profile:', result.error);
        return {
          status: 'error',
          profile: null,
          error: result.error,
        };
      }

      const profile = result.data?.user_profiles?.[0] ?? null;
      if (!profile) {
        return {
          status: 'not_found',
          profile: null,
        };
      }

      return {
        status: 'ok',
        profile,
      };
    } catch (error) {
      console.error('[NhostAuth] Error fetching user profile:', error);
      return {
        status: 'error',
        profile: null,
        error,
      };
    }
  }

  /**
   * Register new user with email/password
   * Creates both auth.users (automatic) and user_profiles (manual)
   * Enhanced error handling for verification and registration issues
   */
  async registerWithEmail(
    email: string, 
    password: string,
    options?: {
      displayName?: string;
      username?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<NhostAuthResult> {
    if (!this.guardNhost()) {
      return { success: false, error: 'Authentication is not ready. Please refresh the page.' };
    }
    try {
      console.log('[NhostAuth] Registering user:', { email });

      // Sign up with Nhost (creates auth.users automatically)
      const { session, error } = await nhost.auth.signUp({
        email,
        password,
        options: {
          displayName: options?.displayName,
          metadata: options?.metadata,
        }
      });

      if (error) {
        // Enhanced error logging with full error object
        console.error('[NhostAuth] Registration error:', error);
        console.error('[NhostAuth] Error type:', typeof error);
        console.error('[NhostAuth] Error keys:', Object.keys(error));
        
        // Get user-friendly error message
        const userMessage = this.getNhostErrorMessage(error);
        console.log('[NhostAuth] User-facing error message:', userMessage);
        
        return {
          success: false,
          error: userMessage
        };
      }

      if (!session || !session.user) {
        console.error('[NhostAuth] Registration succeeded but no session/user returned');
        return {
          success: false,
          error: 'Registration successful but session not created. Please sign in.'
        };
      }

      console.log('[NhostAuth] User registered in Nhost:', {
        user_id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.emailVerified
      });

      // Create user profile in user_profiles table
      const username = options?.username || this.generateUsernameFromEmail(email);
      const profileCreated = await this.createUserProfile({
        user_id: session.user.id,
        username,
        onboarding_complete: false,
      });

      if (!profileCreated) {
        console.warn('[NhostAuth] User profile creation failed, but auth user exists');
        // Don't fail registration if profile creation fails - user can still log in
      }

      return {
        success: true,
        session,
        user: session.user
      };
    } catch (error: any) {
      console.error('[NhostAuth] Unexpected registration error:', error);
      console.error('[NhostAuth] Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during registration.'
      };
    }
  }

  /**
   * Sign in with email/password
   * Enhanced error handling for verification and authentication issues
   */
  async signInWithEmail(email: string, password: string): Promise<NhostAuthResult> {
    if (!this.guardNhost()) {
      return { success: false, error: 'Authentication is not ready. Please refresh the page.' };
    }
    try {
      console.log('[NhostAuth] Starting sign-in...', { 
        email, 
        emailValid: !!email && email.includes('@'),
        hasPassword: !!password,
        passwordLength: password?.length,
        nhostConfigured: !!nhost
      });

      // Validate inputs before sending
      if (!email || !email.trim()) {
        console.error('[NhostAuth] Email is empty');
        return {
          success: false,
          error: 'Email is required'
        };
      }

      if (!password) {
        console.error('[NhostAuth] Password is empty');
        return {
          success: false,
          error: 'Password is required'
        };
      }

      // Nhost email/password sign-in
      const signInPayload = {
        email: email.trim(),
        password: password
      };
      
      const { session, error } = await nhost.auth.signIn(signInPayload);

      if (error) {
        // SPECIAL CASE: User is already signed in - treat as success!
        if (error.error === 'already-signed-in' || error.message?.includes('already signed in')) {
          console.log('[NhostAuth] User already signed in, getting current session...');
          
          // Get the current session instead of treating as error
          const currentSession = nhost.auth.getSession();
          
          if (currentSession && currentSession.user) {
            console.log('[NhostAuth] Using existing session:', {
              user_id: currentSession.user.id,
              email: currentSession.user.email,
            });
            
            // Check if user profile exists, create if not
            const profileLookup = await this.getUserProfile(currentSession.user.id);
            if (profileLookup.status === 'not_found') {
              console.log('[NhostAuth] User profile not found, creating...');
              const username = this.generateUsernameFromEmail(currentSession.user.email || email);
              const created = await this.createUserProfile({
                user_id: currentSession.user.id,
                username,
                onboarding_complete: false,
              });
              
              if (!created) {
                console.warn('[NhostAuth] User profile creation failed, but auth succeeded');
              }
            } else if (profileLookup.status === 'error') {
              console.warn('[NhostAuth] Skipping profile creation because profile lookup failed:', profileLookup.error);
            }
            
            return {
              success: true,
              session: currentSession,
              user: currentSession.user
            };
          }
          
          // If no current session but error says already signed in,
          // this is an inconsistent state - sign out and retry
          console.warn('[NhostAuth] Inconsistent state: already-signed-in but no session, signing out...');
          await nhost.auth.signOut();
          return {
            success: false,
            error: 'Session inconsistency detected. Please try signing in again.'
          };
        }
        
        // For all OTHER sign-in errors, show a generic credential message
        return {
          success: false,
          error: 'Invalid username or password. Please try again.'
        };
      }

      if (!session || !session.user) {
        console.error('[NhostAuth] Sign in succeeded but no session/user returned');
        return {
          success: false,
          error: 'Sign in failed. Please check your credentials and try again.'
        };
      }

      console.log('[NhostAuth] User signed in successfully:', {
        user_id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.emailVerified
      });

      // Check if user profile exists, create if not
      const profileLookup = await this.getUserProfile(session.user.id);
      if (profileLookup.status === 'not_found') {
        console.log('[NhostAuth] User profile not found, creating...');
        const username = this.generateUsernameFromEmail(email);
        const created = await this.createUserProfile({
          user_id: session.user.id,
          username,
          onboarding_complete: false,
        });
        
        if (!created) {
          console.warn('[NhostAuth] User profile creation failed, but auth succeeded');
        }
      } else if (profileLookup.status === 'error') {
        console.warn('[NhostAuth] Skipping profile creation because profile lookup failed:', profileLookup.error);
      }

      return {
        success: true,
        session,
        user: session.user
      };
    } catch (error: any) {
      console.error('[NhostAuth] Unexpected sign in error:', error);
      console.error('[NhostAuth] Error stack:', error.stack);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign in.'
      };
    }
  }

  /**
   * Sign in/up with Google OAuth
   * Uses Nhost's built-in OAuth flow with redirect
   * Enhanced error handling
   */
  async signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
    if (!this.guardNhost()) return {};
    try {
      console.log('[NhostAuth] Initiating Google sign-in with redirect to:', redirectTo || window.location.origin);
      
      // Check if user is already signed in
      if (nhost.auth.isAuthenticated()) {
        console.log('[NhostAuth] User already authenticated, skipping Google OAuth');
        const currentSession = nhost.auth.getSession();
        if (currentSession?.user) {
          // Ensure profile exists
          const profileLookup = await this.getUserProfile(currentSession.user.id);
          if (profileLookup.status === 'not_found' && currentSession.user.email) {
            console.log('[NhostAuth] Creating missing user profile...');
            const username = this.generateUsernameFromEmail(currentSession.user.email);
            await this.createUserProfile({
              user_id: currentSession.user.id,
              username,
              onboarding_complete: false,
            });
          } else if (profileLookup.status === 'error') {
            console.warn('[NhostAuth] Skipping profile creation because profile lookup failed:', profileLookup.error);
          }
        }
        // Don't redirect, just return - user is already authenticated
        return {};
      }
      
      // Nhost handles the OAuth redirect flow automatically
      // User will be redirected to Google, then back to the app
      // The session will be established automatically on return
      const { error } = await nhost.auth.signIn({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.origin
        }
      });

      if (error) {
        // SPECIAL CASE: User is already signed in
        if (error.error === 'already-signed-in' || error.message?.includes('already signed in')) {
          console.log('[NhostAuth] Already signed in during Google OAuth, using current session');
          // Don't throw error - user is authenticated
          return {};
        }
        
        const userMessage = this.getNhostErrorMessage(error);
        return { error: userMessage };
      }

      // Note: This method initiates a redirect, so execution won't continue here
      // The user will be redirected to Google's OAuth page
      console.log('[NhostAuth] Google OAuth redirect initiated successfully');
      return {};
    } catch (error: any) {
      console.error('[NhostAuth] Unexpected Google sign-in error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.guardNhost()) return;
    try {
      console.log('[NhostAuth] Signing out');
      await nhost.auth.signOut();
    } catch (error) {
      console.error('[NhostAuth] Error signing out:', error);
      // Swallow the error — callers proceed with local cleanup regardless
    }
  }

  /**
   * Get current user session
   */
  getSession(): NhostSession | null {
    if (!this.guardNhost()) return null;
    return nhost.auth.getSession();
  }

  /**
   * Get current authenticated user
   */
  getUser() {
    if (!this.guardNhost()) return null;
    return nhost.auth.getUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.guardNhost()) return false;
    return nhost.auth.isAuthenticated();
  }

  /**
   * Generate username from email
   */
  private generateUsernameFromEmail(email: string): string {
    let username = email.split('@')[0] || 'user';
    // Remove non-alphanumeric characters except underscore
    username = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (!username) {
      username = `user${Date.now()}`;
    }
    return username;
  }

  /**
   * Resend verification email to user
   * Use this when user hasn't received or cannot find their verification email
   */
  async resendVerificationEmail(email: string): Promise<NhostAuthResult> {
    if (!this.guardNhost()) {
      return { success: false, error: 'Authentication is not ready. Please refresh the page.' };
    }
    console.log('[NhostAuth] Resending verification email to:', email);
    
    try {
      // Use Nhost's built-in method to resend verification email
      // This works for users who already have accounts but haven't verified
      const { error } = await nhost.auth.sendVerificationEmail({
        email: email,
      });
      
      if (error) {
        console.error('[NhostAuth] Resend verification error:', error);
        console.error('[NhostAuth] Error type:', typeof error);
        console.error('[NhostAuth] Error keys:', Object.keys(error));
        return {
          success: false,
          error: this.getNhostErrorMessage(error)
        };
      }
      
      console.log('[NhostAuth] Verification email resent successfully');
      return { 
        success: true,
        error: 'Verification email sent! Please check your inbox and spam folder.'
      };
    } catch (error) {
      console.error('[NhostAuth] Resend verification exception:', error);
      return {
        success: false,
        error: this.getNhostErrorMessage(error)
      };
    }
  }
}

export const nhostAuthService = new NhostAuthService();
