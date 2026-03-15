"use client";

import { useEffect, useRef } from "react";
import { useAuthenticationStatus } from "@nhost/nextjs";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { USER_VERIFICATION } from "@/constants/pages";

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
    // Direct access to Nhost's raw auth status to detect the SDK loading cycle
    const { isLoading: nhostIsLoading, isAuthenticated } = useAuthenticationStatus();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Track whether Nhost has entered a loading state at least once since mount.
    // When the page loads with ?refreshToken=, the SDK may briefly report
    // isLoading=false before it starts processing the token. We must not
    // treat that initial false as "definitely unauthenticated".
    const hasSeenLoadingRef = useRef(false);

    useEffect(() => {
        if (nhostIsLoading) {
            hasSeenLoadingRef.current = true;
        }
    }, [nhostIsLoading]);

    useEffect(() => {
        const clearOAuthState = () => {
            sessionStorage.removeItem("oauth_pending");
            sessionStorage.removeItem("oauth_callback_url");
            sessionStorage.removeItem("post_oauth_redirect");
        };

        const pendingOAuth = sessionStorage.getItem("oauth_pending") === "true";
        const storedCallbackUrl = sessionStorage.getItem("oauth_callback_url");

        // Handle Nhost OAuth error redirects (e.g. ?error=internal-server-error)
        const oauthError = searchParams?.get('error');
        if (oauthError) {
            clearOAuthState();
            toast.error('Google sign-in failed. Please try again.');
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        // Per Nhost docs, on success the URL contains ?refreshToken=
        const hasRefreshToken = !!searchParams?.get('refreshToken');

        const isOAuthCallback =
            hasRefreshToken ||
            searchParams?.get('type') === 'magicLink' ||
            pendingOAuth;

        if (!isOAuthCallback) return;

        // Wait for the Nhost session to be fully resolved before acting.
        // `loading` covers both Nhost's internal isLoading and our profile fetch.
        if (loading) {
            return;
        }

        // Extra guard for the race condition: when ?refreshToken= is present
        // the SDK may not have started processing it yet on the first render.
        // Only proceed once the SDK has completed at least one loading cycle
        // OR once it has confirmed authentication.
        if (hasRefreshToken && !hasSeenLoadingRef.current && !isAuthenticated) {
            return;
        }

        if (hasRefreshToken) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        const callbackUrl = storedCallbackUrl || '/restaurants';

        // nhostUser is available (Nhost auth identity confirmed)
        if (nhostUser) {
            // Email not verified yet — send to verification page first
            if (!nhostUser.emailVerified) {
                clearOAuthState();
                router.push(USER_VERIFICATION);
                return;
            }

            // User needs to complete onboarding
            if (!user?.onboarding_complete) {
                clearOAuthState();
                router.push('/onboarding');
                return;
            }

            // Fully authenticated and onboarded
            clearOAuthState();
            const resolvedCallbackUrl =
                callbackUrl.startsWith('/onboarding') ? '/restaurants' : callbackUrl;
            router.push(resolvedCallbackUrl);
            router.refresh();
            return;
        }

        // Reach here only when the SDK has confirmed unauthenticated state
        // (loading=false, isAuthenticated=false, no nhostUser).
        // Only treat as a genuine failure after the SDK has cycled through loading.
        if (!nhostIsLoading && hasSeenLoadingRef.current) {
            clearOAuthState();
            toast.error('Google sign-in failed. Please try again.');
            router.push('/');
        }
    }, [user, nhostUser, loading, nhostIsLoading, isAuthenticated, router, searchParams]);

    return null;
}

