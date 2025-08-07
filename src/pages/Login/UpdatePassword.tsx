"use client";
import { useEffect, useState } from "react";
import "@/styles/pages/_auth.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { passwordLimit, passwordsNotMatch } from "@/constants/messages";
import { minimumPassword } from "@/constants/validation";
import { UserService } from "@/services/userService";
import { responseStatus } from "@/constants/response";
import { HOME } from "@/constants/pages";

const UpdatePassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
  const [message, setMessage] = useState('');

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

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
    setIsLoading(true);

    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    const result = await UserService.resetPassword(searchParams?.get('token') as string, password);
    setIsLoading(false);
    if (result.status) {
      if (typeof window !== "undefined") {
        localStorage.setItem("openPasswordUpdateModal", 'true');
      }
      setTimeout(() => router.push(HOME), 1000);
    } else {
      setMessage(result.message || 'Something went wrong.');
      setMessageType(responseStatus.error);
    }
  };


  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams?.get('token');
      if (!token) {
        setIsTokenValid(false);
        return;
      }

      try {
        const res = await UserService.verifyResetToken(token);
        setIsTokenValid(res?.status || false);
      } catch (e) {
        setIsTokenValid(false);
      }
    };

    verifyToken();
  }, []);

  if (isTokenValid === null) {
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

  if (isTokenValid === false) {
    return (
      <div className="px-2 pt-8 sm:px-1">
        <div className="auth__container w-full max-w-full sm:!max-w-[672px] mx-auto text-center">
          <h1 className="text-sm font-semibold text-gray-600">This reset password request is invalid or has already expired.</h1>
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
                Password
              </label>
              <div className="auth__input-group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="auth__input !border-[#797979]"
                  placeholder="Password"
                  disabled={isLoading}
                  value={password}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (e.target.value == confirmPassword) { setConfirmPasswordError("") }
                    if (password.length >= minimumPassword) { setPasswordError("") }
                    if (password.length < minimumPassword) setPasswordError(passwordLimit(minimumPassword));
                  }}
                  readOnly // prevent autofill until focus
                />
                {showPassword ? (
                  <FiEye onClick={toggleShowPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                ) : (
                  <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                )}
                {passwordError && (
                  <div className="text-red-600 text-xs mt-2">{passwordError}</div>
                )}
              </div>
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
                  placeholder="Re-enter your Password"
                  disabled={isLoading}
                  value={confirmPassword}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (password == e.target.value) { setConfirmPasswordError("") }
                    if (password != e.target.value) { setConfirmPasswordError(passwordsNotMatch) }
                  }}
                  readOnly // prevent autofill until focus
                />
                {showConfirmPassword ? (
                  <FiEye onClick={toggleShowConfirmPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                ) : (
                  <FiEyeOff onClick={toggleShowConfirmPassword} className="auth__input-icon !text-[#31343F]" strokeWidth={2} />
                )}
                {confirmPasswordError && (
                  <div className="text-red-600 text-xs mt-2">{confirmPasswordError}</div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="auth__button !bg-[#E36B00] m-auto !rounded-xl text-sm hover:bg-[#d36400] transition-all duration-200"
            >
              {isLoading ? "Loading..." : "Update"}
            </button>
            {/* Success/Error Message */}
            {message && (
              <div
                className={`mt-4 text-center px-4 py-2 rounded-xl font-medium mx-10 ${messageType === responseStatus.success
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
