"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthSheetPresentation } from "@/hooks/useAuthSheetPresentation";

function shouldSkipAuthSheetExitAnimation(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (!window.matchMedia("(max-width: 767px)").matches) return true;
  return false;
}

/**
 * Mobile auth sheet: slide/fade in via useAuthSheetPresentation; on dismiss,
 * removes `auth-sheet--visible` so CSS runs the reverse, then runs the completion callback.
 */
export function useAuthSheetDismissal(
  isOpen: boolean,
  defaultOnComplete: () => void
) {
  const sheetVisible = useAuthSheetPresentation(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const defaultCompleteRef = useRef(defaultOnComplete);
  defaultCompleteRef.current = defaultOnComplete;
  const pendingCompleteRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (isOpen) setIsClosing(false);
  }, [isOpen]);

  const requestDismiss = useCallback((complete?: () => void) => {
    const done = complete ?? defaultCompleteRef.current;
    if (shouldSkipAuthSheetExitAnimation()) {
      done();
      return;
    }
    setIsClosing((already) => {
      if (already) return already;
      pendingCompleteRef.current = done;
      return true;
    });
  }, []);

  useEffect(() => {
    if (!isClosing) return;

    const done = pendingCompleteRef.current;

    if (shouldSkipAuthSheetExitAnimation()) {
      setIsClosing(false);
      done();
      return;
    }

    const el = panelRef.current;
    if (!el) {
      setIsClosing(false);
      done();
      return;
    }

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "transform") return;
      el.removeEventListener("transitionend", onEnd);
      setIsClosing(false);
      done();
    };

    el.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(() => {
      el.removeEventListener("transitionend", onEnd);
      setIsClosing(false);
      done();
    }, 450);

    return () => {
      window.clearTimeout(fallback);
      el.removeEventListener("transitionend", onEnd);
    };
  }, [isClosing]);

  const authSheetVisible = sheetVisible && !isClosing;

  return { panelRef, requestDismiss, authSheetVisible };
}
