"use client";

import { useCallback, useRef } from "react";
import type { WebHaptics as WebHapticsType } from "web-haptics";

type HapticPreset = "light" | "medium" | "success" | "warning" | "error" | "selection";

const VIBRATE_PATTERNS: Record<HapticPreset, number | number[]> = {
  light: 8,
  medium: 15,
  success: [10, 30, 10],
  warning: [15, 20, 15],
  error: [20, 10, 20, 10, 20],
  selection: 5,
};

/**
 * Haptic feedback hook.
 * Lazily instantiates `WebHaptics` from `web-haptics` on first trigger.
 * Falls back to Vibration API; no-ops on unsupported browsers / desktop.
 */
export function useHaptic() {
  const instanceRef = useRef<WebHapticsType | null>(null);
  const initRef = useRef(false);

  const trigger = useCallback(async (preset: HapticPreset = "light") => {
    if (!initRef.current) {
      initRef.current = true;
      try {
        const { WebHaptics } = await import("web-haptics");
        instanceRef.current = new WebHaptics();
      } catch {
        instanceRef.current = null;
      }
    }

    if (instanceRef.current) {
      try {
        await instanceRef.current.trigger(preset);
        return;
      } catch {
        // fall through to vibration fallback
      }
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(VIBRATE_PATTERNS[preset] ?? 10);
      } catch {
        // no-op
      }
    }
  }, []);

  return { trigger };
}
