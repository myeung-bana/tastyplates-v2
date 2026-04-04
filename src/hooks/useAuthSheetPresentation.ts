"use client";

import { useEffect, useState } from "react";

/**
 * Locks body scroll while an auth sheet is open and defers a "visible" flag
 * by two rAF ticks so CSS slide-up / fade can run from a clean first paint.
 */
export function useAuthSheetPresentation(isActive: boolean): boolean {
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setSheetVisible(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSheetVisible(true));
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      setSheetVisible(false);
    };
  }, [isActive]);

  return sheetVisible;
}
