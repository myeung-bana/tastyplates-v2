"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { ONBOARDING_ONE } from "@/constants/pages";

/**
 * OnboardingRedirect - Redirects users to /onboarding if onboarding_complete is false
 * This component should be placed in the root layout to check on every page load
 */
export default function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useFirebaseSession();

  useEffect(() => {
    // Don't redirect while loading or if user is not authenticated
    if (loading || !user) {
      return;
    }

    // Don't redirect if already on onboarding page
    if (pathname === ONBOARDING_ONE || pathname?.startsWith('/onboarding')) {
      return;
    }

    // Redirect to onboarding if onboarding_complete is false
    if (user.onboarding_complete === false) {
      console.log('[OnboardingRedirect] User onboarding not complete, redirecting to /onboarding');
      router.replace(ONBOARDING_ONE);
    }
  }, [user, loading, pathname, router]);

  return null; // This component doesn't render anything
}
