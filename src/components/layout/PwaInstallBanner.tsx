"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiX } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-banner-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
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
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isStandalone) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  // iOS / Safari fallback — no beforeinstallprompt event on WebKit
  useEffect(() => {
    if (isStandalone || !isMobile) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return;
    }

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as any).MSStream;
    const isSafari =
      /safari/i.test(navigator.userAgent) &&
      !/chrome|crios|fxios/i.test(navigator.userAgent);

    if (isIos && isSafari && !deferredPrompt) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone, isMobile, deferredPrompt]);

  useEffect(() => {
    updateCssOffset(visible && isMobile && !isStandalone);
    return () => updateCssOffset(false);
  }, [visible, isMobile, isStandalone, updateCssOffset]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install TastyPlates, tap the Share button in Safari, then select "Add to Home Screen".'
      );
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!isMobile || isStandalone || !visible) return null;

  return (
    <div ref={bannerRef} className="fixed top-0 left-0 right-0 z-[100] md:hidden">
      <div
        className="flex items-center justify-between gap-2 px-4 py-2 font-neusans"
        style={{ backgroundColor: "#31343F" }}
      >
        <p className="flex-1 text-white text-[13px] leading-tight truncate">
          Get our app — add <span className="font-semibold">TastyPlates</span>{" "}
          to your home screen
        </p>

        <button
          onClick={handleInstall}
          className="flex-shrink-0 rounded-full text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: "#ff7c0a",
            color: "#fff",
            padding: "4px 14px",
          }}
        >
          Install
        </button>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss install banner"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
