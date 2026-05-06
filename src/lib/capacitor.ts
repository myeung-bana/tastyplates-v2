/**
 * Capacitor bridge helpers.
 *
 * Rules:
 * - Never import Capacitor plugins at the module level — always lazy-load inside
 *   async functions so SSR never crashes and the initial JS bundle stays lean.
 * - Every function must have a graceful web fallback so the web build works
 *   without any native wrapper.
 * - All functions guard against SSR with a `typeof window` check.
 */

// ---------------------------------------------------------------------------
// Platform guard
// ---------------------------------------------------------------------------

function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (
      window as unknown as {
        Capacitor?: { isNativePlatform: () => boolean };
      }
    ).Capacitor;
    return cap?.isNativePlatform() ?? false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

export interface ShareOptions {
  title: string;
  text?: string;
  url: string;
}

/**
 * Open the native share sheet on device, or fall back to the Web Share API /
 * clipboard on desktop.
 */
export async function shareContent(options: ShareOptions): Promise<void> {
  if (typeof window === "undefined") return;

  if (isNativePlatform()) {
    const { Share } = await import("@capacitor/share");
    await Share.share(options);
    return;
  }

  if ("share" in navigator) {
    await navigator.share({ title: options.title, text: options.text, url: options.url });
  } else {
    await navigator.clipboard.writeText(options.url);
  }
}

// ---------------------------------------------------------------------------
// Browser (external links)
// ---------------------------------------------------------------------------

/**
 * Open a URL in the native in-app browser (Capacitor) or a new tab (web).
 * Use this instead of `<a target="_blank">` to avoid opening the system browser
 * on iOS/Android.
 */
export async function openUrl(url: string): Promise<void> {
  if (typeof window === "undefined") return;

  if (isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

// ---------------------------------------------------------------------------
// Geolocation
// ---------------------------------------------------------------------------

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Get the device's current GPS position.
 * Uses @capacitor/geolocation on native for better accuracy and permission UX;
 * falls back to the browser Geolocation API on web.
 */
export async function getLocation(): Promise<GeoPosition> {
  if (typeof window === "undefined") {
    throw new Error("Geolocation is not available in SSR context");
  }

  if (isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation" as never) as {
      Geolocation: {
        getCurrentPosition: (opts: object) => Promise<{
          coords: { latitude: number; longitude: number; accuracy: number };
        }>;
      };
    };
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  }

  // Web fallback
  return new Promise<GeoPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// ---------------------------------------------------------------------------
// Haptics
// ---------------------------------------------------------------------------

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const VIBRATE_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 15,
  heavy: 30,
  success: [10, 30, 10],
  warning: [15, 20, 15],
  error: [20, 10, 20, 10, 20],
};

/**
 * Trigger haptic feedback.
 * Uses @capacitor/haptics on native; falls back to the Vibration API on web.
 */
export async function triggerHaptic(style: HapticStyle = "light"): Promise<void> {
  if (typeof window === "undefined") return;

  if (isNativePlatform()) {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success" || style === "warning" || style === "error") {
      const typeMap: Record<string, typeof NotificationType[keyof typeof NotificationType]> = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[style] });
    } else {
      const impactMap: Record<string, typeof ImpactStyle[keyof typeof ImpactStyle]> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: impactMap[style] ?? ImpactStyle.Light });
    }
    return;
  }

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(VIBRATE_PATTERNS[style] ?? 10);
    } catch {
      // no-op on browsers that block vibration
    }
  }
}
