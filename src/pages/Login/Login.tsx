"use client";
import { useState, useEffect, useRef } from "react";
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from 'next/navigation';
import Spinner from "@/components/common/LoadingSpinner";
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { emailRequired, googleLoginFailed, invalidEmailFormat, loginFailed, passwordRequired, unexpectedError } from "@/constants/messages";
import { responseStatus } from "@/constants/response";
import { HOME } from "@/constants/pages";
import { validEmail } from "@/lib/utils";
import { nhostAuthService } from "@/services/auth/nhostAuthService";
import { useNhostSession } from "@/hooks/useNhostSession";

// Using Nhost Authentication with Google OAuth and email/password

interface LoginPageProps {
  onOpenSignup?: () => void;
  onOpenForgotPassword?: () => void;
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onOpenSignup, onOpenForgotPassword, onLoginSuccess }) => {
  const router = useRouter();
  const { user, nhostUser, loading: sessionLoading } = useNhostSession();
  const hasRedirected = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Unified login success handler for both manual and OAuth flows
  // Nhost handles session automatically
  const handleLoginSuccess = async () => {
    try {
      // Close modal if callback provided
      onLoginSuccess?.();
      // Refresh router to update server components
      router.refresh();
      // Small delay to ensure Nhost session propagates
      setTimeout(() => {
        router.push(HOME);
      }, 300);
    } catch (error) {
      console.error('Error in login success handler:', error);
      // Still try to close modal and navigate
      onLoginSuccess?.();
      router.refresh();
    }
  };

  // Check if user is already authenticated
  useEffect(() => {
    // Prevent infinite redirect loops
    if (hasRedirected.current) return;
    
    if (!sessionLoading && user && nhostUser) {
      console.log('[Login] User already authenticated, redirecting...');
      hasRedirected.current = true;
      handleLoginSuccess();
    }
  }, [user, nhostUser, sessionLoading]);

  // Reset redirect flag on unmount (for modals)
  useEffect(() => {
    return () => {
      hasRedirected.current = false;
    };
  }, []);

  useEffect(() => {
    // Clean up any old Google OAuth cookies
    Cookies.remove('google_oauth_token');
    Cookies.remove('google_oauth_user_id');
    Cookies.remove('google_oauth_email');
    Cookies.remove('google_oauth_pending');
    Cookies.remove('googleError');
    Cookies.remove('google_oauth_redirect');
    Cookies.remove('auth_type');
    Cookies.remove('google_oauth_id_token');
  }, []);

  const validatePasswords = () => {
    let isValid = true;
    setPasswordError("");

    if (password.length == 0) {
      setPasswordError(passwordRequired);
      isValid = false;
    }

    return isValid;
  };

  const validateEmail = (email: string) => {
    if (!email) return emailRequired;
    if (!validEmail(email)) return invalidEmailFormat;
    return "";
  };

  // ...existing code...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setShowResendVerification(false);
    setIsLoading(true);

    const err = validateEmail(email);
    if (err) {
      setIsLoading(false);
      setEmailError(err);
      return;
    }

    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    try {
      // Use Nhost authentication - Nhost handles session automatically
      const result = await nhostAuthService.signInWithEmail(email, password);
      
      if (result.success && result.session) {
        // Nhost session is automatically set
        // Just handle UI success
        await handleLoginSuccess();
      } else {
        const errorMsg = result.error || loginFailed;
        setMessage(errorMsg);
        setMessageType(responseStatus.error);
        
        // Check if error is related to email verification
        const isVerificationError = errorMsg.toLowerCase().includes('verified') || 
                                     errorMsg.toLowerCase().includes('verify');
        setShowResendVerification(isVerificationError);
        
        setIsLoading(false);
      }
    } catch (error) {
      setMessage((error as { message?: string })?.message || unexpectedError);
      setMessageType(responseStatus.error);
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !validEmail(email)) {
      setMessage('Please enter a valid email address first.');
      setMessageType(responseStatus.error);
      return;
    }

    setIsResendingVerification(true);
    setMessage('');

    try {
      const result = await nhostAuthService.resendVerificationEmail(email);
      
      if (result.success) {
        setMessage(result.error || 'Verification email sent! Please check your inbox.');
        setMessageType(responseStatus.success);
        setShowResendVerification(false);
      } else {
        setMessage(result.error || 'Failed to resend verification email. Please try again.');
        setMessageType(responseStatus.error);
      }
    } catch (error) {
      setMessage((error as { message?: string })?.message || 'Failed to resend verification email.');
      setMessageType(responseStatus.error);
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Google OAuth using Nhost's built-in provider

  const loginWithGoogle = async () => {
    setMessage('');
    setIsLoading(true);
    
    // Nhost Google sign-in uses OAuth redirect flow
    // User will be redirected to Google, then back to the app
    // The session will be established automatically on return
    const result = await nhostAuthService.signInWithGoogle(window.location.origin + HOME);
    
    if (result?.error) {
      setMessage(result.error);
      setMessageType(responseStatus.error);
      setIsLoading(false);
    }
    // Note: On success, user is redirected — execution stops here
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="auth">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spinner size={48} className="text-[#ff7c0a]" />
        </div>
      )}
            <div className="auth__container overflow-y-auto md:overflow-visible">
        <h1 className="auth__title !text-sm md:!text-xl md:!leading-[30px] !font-normal py-3.5 md:py-4 !mb-0 font-neusans">Login</h1>
        <hr className="border-t border-[#CACACA]" />
        <div className="auth__card !px-4 md:!px-8 !pt-0 !pb-4 md:!pb-6 !rounded-none">
          <form className="auth__form !gap-3 md:!gap-4" onSubmit={handleSubmit}>
              <div className="auth__form-group mt-6">
                <label htmlFor="email" className="auth__label font-neusans">
                  Email Address
                </label>
                <div className="auth__input-group">
                  {/* <FiMail className="auth__input-icon" /> */}
                  <input
                    type="text"
                    id="email"
                    className="auth__input font-neusans"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value
                      setEmail(value)
                      setEmailError(!validEmail(value) ? validateEmail(value) : "")
                    }}
                  />
                </div>
                {emailError && (
                  <div className="text-red-600 text-xs font-neusans">{emailError}</div>
                )}
              </div>
              <div className="auth__form-group">
                <label htmlFor="password" className="auth__label font-neusans">
                  Password
                </label>
                <div className="auth__input-group relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="auth__input font-neusans"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value
                      setPassword(value)
                      if (value.length) { setPasswordError("") } else {
                        setPasswordError(passwordRequired)
                      }
                    }}
                  />
                  {showPassword ? (
                    <FiEye onClick={toggleShowPassword} className="auth__input-icon" />
                  ) : (
                    <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon" />
                  )}
                </div>
                {passwordError && (
                  <div className="text-red-600 text-xs font-neusans">{passwordError}</div>
                )}
              </div>
              <p className="auth__terms font-neusans text-sm">By logging in, you agree to TastyPlate's <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/listing-guidelines" target="_blank" rel="noopener noreferrer">Listing Guidelines</a></p>
              <button
                type="submit"
                disabled={isLoading}
                className="auth__button !bg-[#ff7c0a] !mt-0 !rounded-xl hover:bg-[#e66d08] transition-all duration-200 font-neusans"
              >
                Continue
              </button>
              <div className="text-sm font-normal flex flex-row flex-nowrap items-center gap-2 font-neusans">
                <hr className="w-full border-t border-[#494D5D]" />
                or
                <hr className="w-full border-t border-[#494D5D]" />
              </div>

              <button
                disabled={isLoading}
                type="button"
                onClick={loginWithGoogle}
                className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:bg-gray-100 font-neusans"
              >
                <FcGoogle className="h-5 w-5 object-contain mr-2" />
                <span className="font-normal font-neusans">Continue with Google</span>
              </button>
              <p className="text-sm cursor-pointer text-center underline font-normal hover:opacity-90 font-neusans" onClick={() => { onOpenForgotPassword?.(); }}>Forgot Password?</p>
            </form>
          {/* </div> */}
          {message && (
            <div className="mt-4 space-y-2">
              <div
                className={`text-center px-4 py-2 rounded-xl font-normal text-sm font-neusans ${messageType == responseStatus.success
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
                dangerouslySetInnerHTML={{ __html: message }}
              />
              {showResendVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="w-full py-2 px-4 text-sm font-normal text-[#ff7c0a] hover:text-[#e66d08] border border-[#ff7c0a] hover:border-[#e66d08] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-neusans"
                >
                  {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
            </div>
          )}
        </div>
        <hr className="border-t border-[#CACACA]" />
        <p className="auth__footer font-neusans">
          New to TastyPlates?{" "}
          <a
            className="auth__link font-neusans"
            onClick={e => {
              e.preventDefault();
              if (onOpenSignup) onOpenSignup();
            }}
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

// Force dynamic render so this page is not statically prerendered (requires NhostProvider at runtime).
export async function getServerSideProps() {
  return { props: {} };
}
