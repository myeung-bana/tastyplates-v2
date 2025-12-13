"use client";

import { useEffect } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

/**
 * OAuth callback handler for Firebase authentication
 * Cleans up OAuth cookies and refreshes the router after authentication
 * Firebase handles OAuth callbacks automatically via popup/redirect
 */
export default function OAuthCallbackHandler() {
    const { loading } = useFirebaseSession();
    const router = useRouter();

    useEffect(() => {
        // Check if we're returning from OAuth
        const oauthFromModal = Cookies.get('oauth_from_modal');
        
        if (oauthFromModal === 'true') {
            // Wait for Firebase session to be ready (authenticated or unauthenticated)
            if (loading) {
                return;
            }

            // Clean up OAuth cookies
            Cookies.remove('oauth_from_modal');
            Cookies.remove('oauth_callback_url');
            
            // Refresh router to update server components with new session
            router.refresh();
        }
    }, [loading, router]);

    return null;
}

