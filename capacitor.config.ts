import { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "co.tastyplates.app",
  appName: "TastyPlates",
  webDir: "out",
  bundledWebRuntime: false,
  // In dev, point at local Next.js dev server for live reload.
  // In production the native shell serves static files from `out/`.
  server: isDev
    ? { url: "http://YOUR_LOCAL_IP:3000", cleartext: true }
    : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#ff7c0a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#ff7c0a",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
