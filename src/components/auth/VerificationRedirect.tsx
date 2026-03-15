"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNhostSession } from "@/hooks/useNhostSession";
import { USER_VERIFICATION } from "@/constants/pages";

/**
 * VerificationRedirect - Redirects authenticated but unverified users to /user-verification.
 * Runs on every page load so that unverified users cannot access the rest of the app.
 * Place in root layout; runs before OnboardingRedirect.
 */
export default function VerificationRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { nhostUser, loading } = useNhostSession();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!nhostUser) return;
    if (pathname === USER_VERIFICATION) return;
    if (nhostUser.emailVerified) {
      hasRedirected.current = false;
      return;
    }
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(USER_VERIFICATION);
    }
  }, [nhostUser, loading, pathname, router]);

  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  return null;
}
