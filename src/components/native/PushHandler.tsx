"use client";

import { useEffect } from "react";
import { useIsNative } from "@/hooks/usePlatform";

/**
 * Handles FCM/APNs push notification registration and foreground delivery.
 *
 * Mount this component once in the root layout. It is a no-op on web.
 *
 * Push permission is NOT requested at startup — it is requested contextually
 * (e.g. when the user opts in from Settings) to comply with App Store guidelines.
 * This handler only wires up the listeners so foreground notifications are
 * displayed when permission has already been granted.
 */
export default function PushHandler() {
  const isNative = useIsNative();

  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      const registrationListener = await PushNotifications.addListener(
        "registration",
        (token) => {
          console.log("[PushHandler] FCM/APNs token:", token.value);
          // TODO: send token.value to your backend to associate with the user
        }
      );

      const registrationErrorListener = await PushNotifications.addListener(
        "registrationError",
        (err) => {
          console.error("[PushHandler] Push registration error:", err);
        }
      );

      const pushReceivedListener = await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("[PushHandler] Push received (foreground):", notification);
          // TODO: show an in-app notification banner if desired
        }
      );

      const actionPerformedListener = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          console.log("[PushHandler] Push action performed:", action);
          // TODO: navigate to the relevant screen based on action.notification.data
        }
      );

      cleanup = () => {
        registrationListener.remove();
        registrationErrorListener.remove();
        pushReceivedListener.remove();
        actionPerformedListener.remove();
      };
    };

    init();
    return () => cleanup?.();
  }, [isNative]);

  return null;
}

/**
 * Call this function when the user explicitly opts in to push notifications
 * (e.g. from a Settings screen or a contextual prompt). Never call at startup.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return false;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === "prompt") {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== "granted") return false;
  } else if (permStatus.receive !== "granted") {
    return false;
  }

  await PushNotifications.register();
  return true;
}
