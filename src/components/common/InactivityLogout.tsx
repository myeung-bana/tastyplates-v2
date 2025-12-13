"use client";

import { useEffect, useRef } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { firebaseAuthService } from "@/services/auth/firebaseAuthService";
import { removeAllCookies } from "@/utils/removeAllCookies";
import toast from "react-hot-toast";
import { Inactive } from "@/constants/messages";
import { HOME } from "@/constants/pages";
import { LAST_ACTIVE_KEY } from "@/constants/session";

// const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export default function InactivityLogout() {
  const { user } = useFirebaseSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY);
    const lastActive = Number(lastActiveRaw);

    const handleLogout = async () => {
      try {
        // Sign out from Firebase first
        await firebaseAuthService.signOut();
        console.log('[InactivityLogout] Firebase sign out successful');
      } catch (error) {
        console.error('[InactivityLogout] Firebase sign out error:', error);
        // Continue with logout even if Firebase signout fails
      }
      
      // Clear all cookies and localStorage
      removeAllCookies();
      localStorage.clear();
      localStorage.removeItem(LAST_ACTIVE_KEY);
      
      // Redirect to home
      window.location.href = HOME;
      toast.error(Inactive);
    };

    const resetInactivityTimer = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    if (lastActiveRaw && now - lastActive > INACTIVITY_TIMEOUT) {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      return;
    }

    resetInactivityTimer();

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
    };
  }, [user]);

  return null;
}
