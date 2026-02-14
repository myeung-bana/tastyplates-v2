"use client";

import { useEffect } from "react";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

/**
 * OAuth callback handler for Nhost authentication
 * Handles OAuth redirect callbacks and manages user onboarding flow
 * 
 * Nhost OAuth Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google OAuth consent screen
 * 3. Google redirects back to: https://<subdomain>.auth.<region>.nhost.run/v1/signin/provider/google/callback
 * 4. Nhost processes the OAuth response and creates/authenticates user
 * 5. Nhost redirects to your app with auth tokens in URL hash
 * 6. This component detects auth tokens and handles post-auth flow
 */
export default function OAuthCallbackHandler() {
    const { user, nhostUser, loading } = useNhostSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if we're returning from OAuth (Nhost puts tokens in URL hash or query params)
        const isOAuthCallback = 
            window.location.hash.includes('access_token') || 
            searchParams?.get('type') === 'magicLink' ||
            Cookies.get('oauth_from_modal') === 'true';
        
        if (isOAuthCallback) {
            // Wait for Nhost session to be ready (authenticated or unauthenticated)
            if (loading) {
                console.log('[OAuthCallbackHandler] Waiting for Nhost session...');
                return;
            }

            console.log('[OAuthCallbackHandler] OAuth callback detected', {
                isAuthenticated: !!user && !!nhostUser,
                userId: user?.user_id,
                hasOnboarding: user?.onboarding_complete,
            });

            // Clean up OAuth cookies
            Cookies.remove('oauth_from_modal');
            
            // Get callback URL or default redirect
            const callbackUrl = Cookies.get('oauth_callback_url') || '/restaurants';
            Cookies.remove('oauth_callback_url');

            // Check if user needs onboarding
            if (user && !user.onboarding_complete) {
                console.log('[OAuthCallbackHandler] Redirecting to onboarding');
                router.push('/onboarding');
                return;
            }

            // User is authenticated and has completed onboarding
            if (user && user.onboarding_complete) {
                console.log('[OAuthCallbackHandler] Redirecting to:', callbackUrl);
                router.push(callbackUrl);
                router.refresh();
                return;
            }

            // If still not authenticated after OAuth, something went wrong
            if (!user && !nhostUser) {
                console.error('[OAuthCallbackHandler] OAuth callback but no user session');
                router.push('/');
                return;
            }
        }
    }, [user, nhostUser, loading, router, searchParams]);

    return null;
}

