"use client";

import { useMemo } from "react";

export type Platform = "web" | "android" | "ios";

/**
 * Single source of truth for platform detection.
 * Returns 'web' during SSR and on the web browser.
 * Returns 'android' or 'ios' when running inside a Capacitor native shell.
 */
export function usePlatform(): Platform {
  return useMemo(() => {
    if (typeof window === "undefined") return "web";
    try {
      // Capacitor injects this global at runtime — dynamic import keeps SSR safe
      const cap = (window as unknown as { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } }).Capacitor;
      if (!cap?.isNativePlatform()) return "web";
      return cap.getPlatform() as Platform;
    } catch {
      return "web";
    }
  }, []);
}

/**
 * Convenience boolean — true when running inside the Capacitor native shell.
 */
export function useIsNative(): boolean {
  return usePlatform() !== "web";
}
