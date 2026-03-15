"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNhostSession } from "@/hooks/useNhostSession";
import { nhostAuthService } from "@/services/auth/nhostAuthService";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import Navbar from "@/components/layout/Navbar";
import toast from "react-hot-toast";
import "@/styles/pages/_auth.scss";

const RESEND_COOLDOWN_SECONDS = 60;

export default function UserVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, nhostUser, loading } = useNhostSession();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRedirected = useRef(false);
  const verifiedParam = searchParams?.get("verified");

  // Handle redirect after user clicked the verification link (Nhost redirects to /user-verification?verified=1)
  useEffect(() => {
    if (verifiedParam !== "1" || hasRedirected.current) return;
    hasRedirected.current = true;
    toast.success("Email verified! Redirecting...");
    // Clean URL and full navigation so session refetches and emailVerified is updated
    const next = user?.onboarding_complete ? HOME : ONBOARDING_ONE;
    window.history.replaceState({}, "", "/user-verification");
    window.location.href = next;
  }, [verifiedParam, user?.onboarding_complete]);

  // Redirect if not authenticated
  useEffect(() => {
    if (loading) return;
    if (!nhostUser) {
      router.replace(HOME);
      return;
    }
  }, [nhostUser, loading, router]);

  // Redirect if already verified (and not coming from ?verified=1)
  useEffect(() => {
    if (loading || !nhostUser || hasRedirected.current || verifiedParam === "1") return;
    if (nhostUser.emailVerified) {
      hasRedirected.current = true;
      const next = user?.onboarding_complete ? HOME : ONBOARDING_ONE;
      router.replace(next);
    }
  }, [nhostUser, user?.onboarding_complete, loading, router, verifiedParam]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0 && cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  }, [cooldown]);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const handleSendVerification = async () => {
    if (!nhostUser?.email || isSending || cooldown > 0) return;
    setIsSending(true);
    setMessage(null);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/user-verification?verified=1`
        : undefined;
    try {
      const result = await nhostAuthService.resendVerificationEmail(nhostUser.email, redirectTo);
      if (result.success) {
        setMessage(result.error || "Verification email sent! Check your inbox and spam folder.");
        toast.success("Verification email sent");
        setCooldown(RESEND_COOLDOWN_SECONDS);
        cooldownIntervalRef.current = setInterval(() => {
          setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
      } else {
        setMessage(result.error || "Failed to send. Please try again.");
        toast.error(result.error || "Failed to send");
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      toast.error("Failed to send verification email");
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckAgain = () => {
    // Reload so Nhost refetches session and picks up emailVerified after user clicked the link
    window.location.reload();
  };

  if (loading || !nhostUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-neusans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (nhostUser.emailVerified) {
    return null;
  }

  // Just landed from Nhost redirect after clicking the verification link
  if (verifiedParam === "1") {
    return (
      <div className="min-h-screen bg-white flex flex-col font-neusans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12 pt-20 md:pt-24">
          <div className="auth__container max-w-md w-full text-center">
            <p className="text-gray-700 font-neusans">Email verified! Redirecting...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-neusans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-20 md:pt-24">
        <div className="auth__container max-w-md w-full">
          <div className="auth__card !py-8 !px-6 md:!px-8 !rounded-3xl">
            <h1 className="auth__title !text-xl !font-normal text-center mb-2 font-neusans">
              Verify your email
            </h1>
            <p className="text-gray-600 text-center text-sm mb-6 font-neusans">
              We need to verify your email address before you can continue. We&apos;ve sent a link to:
            </p>
            <p className="text-center font-medium text-gray-900 mb-6 break-all font-neusans">
              {nhostUser.email}
            </p>
            <p className="text-gray-500 text-center text-sm mb-6 font-neusans">
              Click the link in that email to verify your account. If you don&apos;t see it, check your spam folder.
            </p>

            {message && (
              <div className="mb-4 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm text-center font-neusans">
                {message}
                {message.includes("couldn't send") || message.includes("try again later or contact support") ? (
                  <p className="mt-2 text-xs text-gray-500">
                    If this keeps happening, the email service may be temporarily unavailable.
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={isSending || cooldown > 0}
                className="auth__button !bg-[#ff7c0a] !rounded-xl hover:bg-[#e66d08] disabled:opacity-60 disabled:cursor-not-allowed font-neusans"
              >
                {isSending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Send again in ${cooldown}s`
                    : "Send verification email"}
              </button>
              <button
                type="button"
                onClick={handleCheckAgain}
                className="auth__button !bg-transparent !border !border-gray-300 !text-gray-700 !rounded-xl hover:bg-gray-50 font-neusans"
              >
                I&apos;ve verified my email
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
