"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsNative } from "@/hooks/usePlatform";

const ALLOWED_HOSTS = ["tastyplates.co", "www.tastyplates.co"];

/**
 * Handles deep links (universal links / custom URL schemes) via @capacitor/app.
 *
 * Security: only processes URLs whose host matches ALLOWED_HOSTS.
 * All other URLs are silently ignored.
 *
 * Mount once in the root layout.
 */
export default function DeepLinkHandler() {
  const isNative = useIsNative();
  const router = useRouter();

  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { App } = await import("@capacitor/app");

      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const parsed = new URL(url);

          // Validate host to prevent open-redirect via deep link
          if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
            console.warn("[DeepLinkHandler] Ignoring deep link from unknown host:", parsed.hostname);
            return;
          }

          const path = parsed.pathname + parsed.search + parsed.hash;
          console.log("[DeepLinkHandler] Navigating to:", path);
          router.push(path);
        } catch (err) {
          console.error("[DeepLinkHandler] Failed to parse deep link URL:", url, err);
        }
      });

      cleanup = () => listener.remove();
    };

    init();
    return () => cleanup?.();
  }, [isNative, router]);

  return null;
}
