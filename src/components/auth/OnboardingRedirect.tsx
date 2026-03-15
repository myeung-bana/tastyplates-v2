"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNhostSession } from "@/hooks/useNhostSession";
import { ONBOARDING_ONE } from "@/constants/pages";

const ONBOARDING_JUST_COMPLETED_KEY = "onboarding_just_completed";

/**
 * OnboardingRedirect - Redirects users to /onboarding if onboarding_complete is false
 * Skips redirect when user just completed onboarding (session may still be stale).
 * This component should be placed in the root layout to check on every page load
 * Works with Nhost authentication
 */
export default function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, nhostUser, loading } = useNhostSession();
  const hasRedirectedToOnboarding = useRef(false);

  useEffect(() => {
    // Don't redirect while loading or if user is not authenticated
    if (loading || !user) {
      return;
    }
    // Don't redirect to onboarding if user is not yet email-verified (VerificationRedirect handles them)
    if (nhostUser && !nhostUser.emailVerified) {
      return;
    }

    // Don't redirect if already on onboarding page
    if (pathname === ONBOARDING_ONE || pathname?.startsWith("/onboarding")) {
      return;
    }

    // Never redirect to onboarding when we know onboarding is complete
    if (user.onboarding_complete === true) {
      hasRedirectedToOnboarding.current = false;
      return;
    }

    // User just completed onboarding - session may not have refetched yet. Skip redirect.
    if (typeof window !== "undefined" && sessionStorage.getItem(ONBOARDING_JUST_COMPLETED_KEY)) {
      console.log("[OnboardingRedirect] Just completed onboarding, skipping redirect");
      sessionStorage.removeItem(ONBOARDING_JUST_COMPLETED_KEY);
      hasRedirectedToOnboarding.current = false;
      return;
    }

    // Only redirect when explicitly onboarding_complete === false (not undefined)
    if (user.onboarding_complete === false && !hasRedirectedToOnboarding.current) {
      console.log("[OnboardingRedirect] User onboarding not complete, redirecting to /onboarding");
      hasRedirectedToOnboarding.current = true;
      router.replace(ONBOARDING_ONE);
    }
  }, [user, nhostUser, loading, pathname, router]);

  // Reset redirect ref when pathname changes so future navigations can redirect if needed
  useEffect(() => {
    hasRedirectedToOnboarding.current = false;
  }, [pathname]);

  return null; // This component doesn't render anything
}
