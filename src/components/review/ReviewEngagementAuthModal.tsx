"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { FiX } from "react-icons/fi";

const Z_OVERLAY = 10100;

export interface ReviewEngagementAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl: string;
  profileHref: string | null;
  onSignUp: () => void;
  onLogIn: () => void;
}

/**
 * Full-screen dim overlay + card prompting sign up / log in when guests try to like or comment.
 * Rendered via portal so it stacks above the review viewer (z-index 10010).
 */
export default function ReviewEngagementAuthModal({
  isOpen,
  onClose,
  username,
  avatarUrl,
  profileHref,
  onSignUp,
  onLogIn,
}: ReviewEngagementAuthModalProps) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onKeyDown]);

  if (!isOpen || typeof document === "undefined") return null;

  const isLocalAvatar =
    avatarUrl.startsWith("/") && !avatarUrl.startsWith("//");

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 font-neusans"
      style={{ zIndex: Z_OVERLAY }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-engagement-auth-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100">
          {isLocalAvatar ? (
            <Image
              src={avatarUrl}
              alt=""
              width={88}
              height={88}
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- remote author avatars from CDN
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {profileHref ? (
          <Link
            href={profileHref}
            onClick={onClose}
            className="mb-3 block text-center text-sm font-semibold text-[#ff7c0a] hover:underline"
            id="review-engagement-auth-title"
          >
            See full profile
          </Link>
        ) : (
          <p
            id="review-engagement-auth-title"
            className="mb-3 text-center text-sm font-semibold text-gray-900"
          >
            See full profile
          </p>
        )}

        <p className="mb-4 text-center text-[15px] leading-snug text-gray-800">
          Keep up with what&apos;s new from{" "}
          <span className="font-semibold text-gray-900">{username}</span>
        </p>

        <p className="mb-5 text-center text-[11px] leading-relaxed text-gray-500">
          By continuing, you agree to TastyPlates&apos;{" "}
          <Link
            href="/terms-of-service"
            className="text-[#ff7c0a] underline underline-offset-2"
            onClick={onClose}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-[#ff7c0a] underline underline-offset-2"
            onClick={onClose}
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignUp();
            }}
            className="w-full rounded-full bg-[#ff7c0a] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#e66d08]"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogIn();
            }}
            className="w-full rounded-full border-2 border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
