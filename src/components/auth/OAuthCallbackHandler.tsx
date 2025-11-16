"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

/**
 * Simplified OAuth callback handler
 * With unified authentication flow using JWT Auth plugin,
 * NextAuth should handle OAuth callbacks automatically.
 * This component only cleans up cookies and refreshes the router.
 */
export default function OAuthCallbackHandler() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Check if we're returning from OAuth
        const oauthFromModal = Cookies.get('oauth_from_modal');
        
        if (oauthFromModal === 'true') {
            // Wait for session to be ready (authenticated or unauthenticated)
            if (status === 'loading') {
                return;
            }

            // Clean up OAuth cookies
            Cookies.remove('oauth_from_modal');
            Cookies.remove('oauth_callback_url');
            
            // Refresh router to update server components with new session
            router.refresh();
        }
    }, [status, router]);

    return null;
}

