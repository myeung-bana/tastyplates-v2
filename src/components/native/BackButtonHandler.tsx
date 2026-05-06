"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useIsNative } from "@/hooks/usePlatform";

const ROOT_ROUTES = ["/", "/restaurants", "/home"];

/**
 * Handles the Android hardware back button via @capacitor/app.
 *
 * Behaviour:
 * - On a root route: calls App.exitApp() to exit the app (Android convention).
 * - On any other route: calls router.back() to navigate up.
 *
 * This component is a no-op on iOS (swipe-back gesture handles navigation)
 * and on web (browser back button handles it natively).
 *
 * Mount once in the root layout, inside a Suspense boundary if needed.
 */
export default function BackButtonHandler() {
  const isNative = useIsNative();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { App } = await import("@capacitor/app");

      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        const isRootRoute = ROOT_ROUTES.includes(pathname ?? "");

        if (isRootRoute || !canGoBack) {
          App.exitApp();
        } else {
          router.back();
        }
      });

      cleanup = () => listener.remove();
    };

    init();
    return () => cleanup?.();
  }, [isNative, pathname, router]);

  return null;
}
