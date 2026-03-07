"use client";
import { useEffect, useState } from "react";
import "@/styles/pages/_auth.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { passwordLimit, passwordsNotMatch } from "@/constants/messages";
import { minimumPassword } from "@/constants/validation";
import { nhostAuthService } from "@/services/auth/nhostAuthService";
import { useAuthenticationStatus } from "@nhost/nextjs";
import { responseStatus } from "@/constants/response";
import { HOME } from "@/constants/pages";

/**
 * Nhost password reset flow:
 * 1. User clicks the email link → Nhost redirects to /reset-password?refreshToken=...
 * 2. NhostProvider automatically exchanges the refreshToken for a session on mount.
 * 3. This page waits for that session to be ready, then lets the user set a new password
 *    via nhost.auth.changePassword().
 */
const UpdatePassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
  const [message, setMessage] = useState("");

  // Once the NhostProvider has exchanged the refreshToken, clean the URL
  useEffect(() => {
    const hasRefreshToken = !!searchParams?.get('refreshToken');
    if (hasRefreshToken && !authLoading) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, authLoading]);

  const toggleShowPassword = () => setShowPassword((v) => !v);
  const toggleShowConfirmPassword = () => setShowConfirmPassword((v) => !v);

  const validatePasswords = () => {
    let isValid = true;
    setPasswordError("");
    setConfirmPasswordError("");

    if (password.length < minimumPassword) {
      setPasswordError(passwordLimit(minimumPassword));
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(passwordsNotMatch);
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsLoading(true);
    const result = await nhostAuthService.changePassword(password);
    setIsLoading(false);

    if (result.success) {
      setMessageType(responseStatus.success);
      setMessage("Password updated successfully. Redirecting…");
      setTimeout(() => router.push(HOME), 1500);
    } else {
      setMessageType(responseStatus.error);
      setMessage(result.error || "Something went wrong. Please try again.");
    }
  };

  // Waiting for Nhost to exchange the refreshToken
  if (authLoading) {
    return (
      <div className="px-2 pt-8 sm:px-1 animate-pulse">
        <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4 m-auto"></div>
          <div className="auth__card py-8 rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
            <div className="space-y-4 px-6">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mt-6"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded mt-8 m-auto w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No valid session — link is invalid or expired
  if (!isAuthenticated) {
    return (
      <div className="px-2 pt-8 sm:px-1">
        <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto text-center">
          <h1 className="text-sm font-semibold text-gray-600">
            This reset password link is invalid or has already expired.
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-8 sm:px-1">
      <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto">
        <h1 className="auth__header text-2xl sm:text-3xl">Update Password</h1>
        <div className="auth__card py-4 !rounded-[24px] border border-[#CACACA] w-full sm:!w-[672px] bg-white">
          <form className="auth__form !gap-4 !py-3" onSubmit={handleSubmit}>
            <div className="auth__form-group">
              <label htmlFor="password" className="auth__label !font-bold">
                New Password
              </label>
              <div className="auth__input-group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="auth__input !border-[#797979]"
                  placeholder="New password"
                  disabled={isLoading}
                  value={password}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (val.length >= minimumPassword) setPasswordError("");
                    if (val === confirmPassword) setConfirmPasswordError("");
                  }}
                  readOnly
                />
                {showPassword ? (
                  <FiEye onClick={toggleShowPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                ) : (
                  <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                )}
              </div>
              {passwordError && <div className="text-red-600 text-xs">{passwordError}</div>}
            </div>

            <div className="auth__form-group">
              <label htmlFor="confirmPassword" className="auth__label !font-bold">
                Confirm Password
              </label>
              <div className="auth__input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="auth__input !border-[#797979]"
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                  value={confirmPassword}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    if (password === val) setConfirmPasswordError("");
                    else setConfirmPasswordError(passwordsNotMatch);
                  }}
                  readOnly
                />
                {showConfirmPassword ? (
                  <FiEye onClick={toggleShowConfirmPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                ) : (
                  <FiEyeOff onClick={toggleShowConfirmPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                )}
              </div>
              {confirmPasswordError && <div className="text-red-600 text-xs">{confirmPasswordError}</div>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth__button !bg-[#ff7c0a] m-auto !rounded-xl text-sm hover:bg-[#e66d08] transition-all duration-200"
            >
              {isLoading ? "Updating…" : "Update Password"}
            </button>

            {message && (
              <div
                className={`mt-4 text-center px-4 py-2 rounded-xl font-medium mx-10 ${
                  messageType === responseStatus.success
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
