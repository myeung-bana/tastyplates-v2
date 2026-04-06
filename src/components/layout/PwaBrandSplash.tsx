"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_BG = "#ff7c0a";

/**
 * Full-screen brand splash (orange + white logo) on cold load; fades out after window load.
 * Keeps first paint on-brand for installed PWA / mobile.
 */
export default function PwaBrandSplash() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dismiss = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      if (reduceMotion) {
        setVisible(false);
        return;
      }
      setExiting(true);
      window.setTimeout(() => setVisible(false), 320);
    };

    let loadDelay: ReturnType<typeof setTimeout> | undefined;
    const onLoad = () => {
      loadDelay = window.setTimeout(dismiss, reduceMotion ? 0 : 120);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    const fallback = window.setTimeout(dismiss, 2800);

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(fallback);
      if (loadDelay !== undefined) window.clearTimeout(loadDelay);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-300 ease-out"
      style={{
        backgroundColor: SPLASH_BG,
        opacity: exiting ? 0 : 1,
        pointerEvents: exiting ? "none" : "auto",
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG splash; avoid next/image SVG config */}
      <img
        src="/TastyPlates_Logo_White.svg"
        alt=""
        width={220}
        height={80}
        className="h-auto w-[min(55vw,220px)] max-w-[220px] select-none"
        fetchPriority="high"
      />
    </div>
  );
}
