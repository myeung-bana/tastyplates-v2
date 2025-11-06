"use client";
import { useState, useEffect } from "react";

/**
 * Hook to detect if the current device is mobile
 * Uses window width breakpoint of 768px
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") {
      return;
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}

