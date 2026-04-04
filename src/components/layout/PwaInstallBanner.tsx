"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { FiX, FiShare, FiCopy } from "react-icons/fi";
import toast from "react-hot-toast";
import { useHaptic } from "@/hooks/useHaptic";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-banner-dismissed";
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const PwaInstallBanner: React.FC = () => {
  const { trigger: haptic } = useHaptic();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const updateCssOffset = useCallback((show: boolean) => {
    const h = show && bannerRef.current ? bannerRef.current.offsetHeight : 0;
    document.documentElement.style.setProperty(
      "--pwa-banner-height",
      `${h}px`
    );
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const isSafari =
      /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
    setIsIos(ios);
    setIsIosSafari(ios && isSafari);
    setIsAndroid(/android/i.test(ua));

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Listen for native install prompt (Android Chrome/Edge)
  useEffect(() => {
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  // Show the banner on any mobile browser (not standalone) after checking dismiss state
  useEffect(() => {
    if (isStandalone || !isMobile) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return;
    }

    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [isStandalone, isMobile]);

  useEffect(() => {
    updateCssOffset(visible && isMobile && !isStandalone);
    return () => updateCssOffset(false);
  }, [visible, isMobile, isStandalone, updateCssOffset]);

  const handleInstall = useCallback(async () => {
    haptic("success");
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, haptic]);

  const handleDismiss = useCallback(() => {
    haptic("medium");
    setVisible(false);
    setShowInstallHelp(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, [haptic]);

  /**
   * No programmatic "Add to Home Screen" on iOS/WebKit — Web Share opens the
   * system sheet where users can pick "Add to Home Screen" (Safari) or share.
   * Android without beforeinstallprompt: share or instructions + copy link.
   */
  const handleAddToHomeWithoutPrompt = useCallback(async () => {
    haptic("success");

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setVisible(false);
      setDeferredPrompt(null);
      return;
    }

    const url = window.location.href;
    const title = "TastyPlates";
    const text = "Add TastyPlates to your home screen";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "AbortError") return;
      }
    }

    setShowInstallHelp(true);
  }, [deferredPrompt, haptic]);

  const handleCopyPageUrl = useCallback(async () => {
    haptic("light");
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied — open in Safari, then use Share → Add to Home Screen");
      setShowInstallHelp(false);
    } catch {
      toast.error("Could not copy link");
    }
  }, [haptic]);

  if (!isMobile || isStandalone || !visible) return null;

  const showNativeInstall = !!deferredPrompt;

  return (
    <div ref={bannerRef} className="fixed top-0 left-0 right-0 z-[100] md:hidden">
      <div
        className="flex items-center gap-3 px-3 py-2.5 font-neusans"
        style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}
      >
        {/* App Icon */}
        <Image
          src="/icons/Favicon_Orange_Circle.png"
          alt="TastyPlates"
          width={40}
          height={40}
          className="rounded-[10px] flex-shrink-0"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#31343F] leading-tight">
            TastyPlates
          </p>
          {showNativeInstall ? (
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Install the app for the best experience
            </p>
          ) : isIosSafari ? (
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Tap <span className="font-semibold text-[#ff7c0a]">Add</span>, then choose &quot;Add to Home Screen&quot; in the share sheet
            </p>
          ) : (
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Tap <span className="font-semibold text-[#ff7c0a]">Add</span> to install, or open the steps below
            </p>
          )}
        </div>

        {/* CTA */}
        {showNativeInstall ? (
          <button
            onClick={handleInstall}
            className="flex-shrink-0 rounded-full text-[13px] font-semibold px-4 py-1.5 transition-colors"
            style={{ backgroundColor: "#ff7c0a", color: "#fff" }}
          >
            Install
          </button>
        ) : (
          <button
            onClick={handleAddToHomeWithoutPrompt}
            className="flex-shrink-0 rounded-full text-[13px] font-semibold px-3.5 py-1.5 transition-colors"
            style={{ backgroundColor: "#ff7c0a", color: "#fff" }}
          >
            Add
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss install banner"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Fallback when Web Share is unavailable or user needs steps */}
      {showInstallHelp && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 font-neusans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-help-title"
          onClick={() => setShowInstallHelp(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="pwa-install-help-title"
              className="text-base font-semibold text-[#31343F] mb-3"
            >
              Add TastyPlates to your home screen
            </h2>
            {isIosSafari ? (
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-4">
                <li>
                  Tap the <FiShare className="inline w-4 h-4 text-[#007AFF] align-text-bottom" />{" "}
                  Share button in Safari&apos;s toolbar
                </li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; in the top right</li>
              </ol>
            ) : isIos ? (
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-4">
                <li>
                  Tap <span className="font-medium">•••</span> or{" "}
                  <FiShare className="inline w-4 h-4 align-text-bottom" /> and choose{" "}
                  <span className="font-medium">Open in Safari</span>
                </li>
                <li>In Safari, tap Share, then &quot;Add to Home Screen&quot;</li>
              </ol>
            ) : isAndroid ? (
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-4">
                <li>
                  Tap the browser menu (<span className="font-medium">⋮</span>)
                </li>
                <li>
                  Choose <span className="font-medium">Install app</span>,{" "}
                  <span className="font-medium">Add to Home screen</span>, or{" "}
                  <span className="font-medium">Add shortcut</span>
                </li>
              </ol>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                Use your browser&apos;s menu to install this site or add it to your home
                screen.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {isIos && !isIosSafari && (
                <button
                  type="button"
                  onClick={handleCopyPageUrl}
                  className="flex items-center justify-center gap-2 w-full rounded-full py-2.5 text-sm font-semibold border border-gray-300 text-[#31343F]"
                >
                  <FiCopy className="w-4 h-4" />
                  Copy link for Safari
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="w-full rounded-full py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "#ff7c0a" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PwaInstallBanner;
