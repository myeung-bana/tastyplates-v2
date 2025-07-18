"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Inactive } from "@/constants/messages";
import { HOME } from "@/constants/pages";

// const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;
const LAST_ACTIVE_KEY = "lastActive";

export default function InactivityLogout () {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const now = Date.now();
    const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY));

    if (lastActive && now - lastActive > INACTIVITY_TIMEOUT) {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      signOut({ redirect: true, callbackUrl: HOME });
      toast.error(Inactive);
      return;
    }

    const handleLogout = () => {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      signOut({ redirect: true, callbackUrl: HOME });
      toast.error(Inactive);
    };

    const resetInactivityTimer = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer(); // Start initial tracking

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
    };
  }, [session]);

  return null;
}
