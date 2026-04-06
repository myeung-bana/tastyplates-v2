"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  type CookieConsentValue,
} from "@/constants/cookieConsent";
import { COOKIE_POLICY } from "@/constants/pages";

function readStoredConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Cookie banner for non-essential cookies / ads. Loads AdSense only after Accept.
 * No banner when NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID is unset.
 */
export default function CookieConsentAndAdSense() {
  const publisherId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID?.trim();
  /** undefined = before hydrate; null = no choice yet; otherwise stored choice */
  const [consent, setConsent] = useState<
    CookieConsentValue | null | undefined
  >(undefined);

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const save = useCallback((value: CookieConsentValue) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setConsent(value);
  }, []);

  if (!publisherId) {
    return null;
  }

  const showBanner = consent === null;

  return (
    <>
      {consent === "accepted" && (
        <Script
          id="adsbygoogle-init"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {showBanner && (
        <div
          className="fixed inset-x-0 z-[100] px-4 pt-3 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] md:pb-4 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] font-neusans md:bottom-0 bottom-[4.5rem]"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-live="polite"
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-700">
              <p id="cookie-consent-title" className="font-medium text-gray-900">
                Cookies and ads
              </p>
              <p className="mt-1 text-gray-600">
                We use cookies to run the site and, if you agree, Google AdSense
                to show ads. See our{" "}
                <Link
                  href={COOKIE_POLICY}
                  className="text-[#ff7c0a] underline underline-offset-2"
                >
                  Cookie Policy
                </Link>
                . If you decline, we do not load AdSense.
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2 md:gap-3 justify-end">
              <button
                type="button"
                onClick={() => save("declined")}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => save("accepted")}
                className="px-4 py-2 rounded-full text-sm font-medium text-white bg-[#ff7c0a] hover:bg-[#e66d08] transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
