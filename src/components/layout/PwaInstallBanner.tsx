"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { FiX, FiShare } from "react-icons/fi";
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

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as any).MSStream;
    const isSafari =
      /safari/i.test(navigator.userAgent) &&
      !/chrome|crios|fxios/i.test(navigator.userAgent);
    setIsIosSafari(isIos && isSafari);

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
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
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
              Tap <FiShare className="inline w-3 h-3 -mt-0.5 text-[#007AFF]" /> then &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Add to home screen for the full experience
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
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-full text-[13px] font-semibold px-4 py-1.5 border border-gray-300 text-[#31343F] bg-white transition-colors"
          >
            OK
          </button>
        )}

        {/* Dismiss X */}
        {showNativeInstall && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss install banner"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PwaInstallBanner;
