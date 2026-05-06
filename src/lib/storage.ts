/**
 * Platform-aware storage adapter.
 *
 * - Native (Capacitor): uses @capacitor/preferences, which is backed by the OS
 *   secure store (Keychain on iOS, SharedPreferences/EncryptedSharedPreferences
 *   on Android).
 * - Web: falls back to localStorage, guarded by a typeof window check so the
 *   module is safe to import in SSR context.
 *
 * All functions are async so call sites work identically on both platforms.
 */

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

export async function storageGet(key: string): Promise<string | null> {
  if (isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value;
  }
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
    return;
  }
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
    return;
  }
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export async function storageClear(): Promise<void> {
  if (isNativePlatform()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.clear();
    return;
  }
  if (typeof window === "undefined") return;
  localStorage.clear();
}
