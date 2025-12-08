"use client";
import { useState, useEffect, Suspense } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { UserService } from '@/services/user/userService';
import { firebaseAuthService } from "@/services/auth/firebaseAuthService";
import Spinner from "@/components/common/LoadingSpinner";
import Cookies from "js-cookie";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { minimumPassword } from "@/constants/validation";
import { emailOccurredError, emailRequired, invalidEmailFormat, passwordLimit, passwordsNotMatch, unexpectedError } from "@/constants/messages";
import { responseStatusCode as code, sessionType } from "@/constants/response";
import { validEmail } from "@/lib/utils";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import { REGISTRATION_KEY } from "@/constants/session";
import { IRegisterData } from "@/interfaces/user/user";
import { signIn, useSession } from "next-auth/react";

// Note: Type definitions for Google Identity Services are in Login.tsx to avoid duplicate declarations

interface RegisterPageProps {
  onOpenSignin?: () => void;
}

const userService = new UserService()

// Component that uses useSearchParams - must be wrapped in Suspense
const RegisterContent: React.FC<RegisterPageProps> = ({ onOpenSignin }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const update = session?.update;
  // isOAuthFlow removed - using Firebase authentication instead
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [showContinueModal, setShowContinueModal] = useState(false);

  useEffect(() => {
    const registrationData = localStorage.getItem(REGISTRATION_KEY);
    if (registrationData && JSON.parse(registrationData).isPartialRegistration) {
      setShowContinueModal(true);
    }

    // Clean up any old Google OAuth cookies
    Cookies.remove('google_oauth_token');
    Cookies.remove('google_oauth_user_id');
    Cookies.remove('google_oauth_email');
    Cookies.remove('google_oauth_pending');
    Cookies.remove('googleError');
    Cookies.remove('google_oauth_redirect');
    Cookies.remove('auth_type');
    Cookies.remove('google_oauth_id_token');
    Cookies.remove('google_oauth_access_token');
    Cookies.remove('google_oauth_name');
    Cookies.remove('google_oauth_picture');
  }, [router]);

  const checkEmailExists = async (email: string) => {
    const checkEmail = await userService.checkEmailExists(email);
    if (checkEmail.status == code.badRequest) {
      setError(String(checkEmail.message || ""));
      return false;
    }

    if (checkEmail.exists) {
      setError(String(checkEmail.message || ""));
      return false;
    }

    return true;
  }

  const validatePasswords = () => {
    let isValid = true;
    setEmailError("")
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

  const validateEmail = (email: string) => {
    if (!email) return emailRequired;
    if (!validEmail(email)) return invalidEmailFormat;
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    localStorage.removeItem(REGISTRATION_KEY);

    const err = validateEmail(email);
    if (err) {
      setIsLoading(false);
      setEmailError(err);
      return;
    }

    // Validate passwords for email/password registration
    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    try {
      // Use Firebase authentication for registration
      const result = await firebaseAuthService.registerWithEmail(email, password);
      
      if (result.success && result.firebase_uuid && result.user) {
        // User is created in Hasura by firebaseAuthService
        // Now sign in with NextAuth
        const nextAuthResult = await signIn('credentials', {
          email: result.user.email || email,
          firebase_uuid: result.firebase_uuid,
          redirect: false,
        });
        
        if (nextAuthResult?.ok) {
          // Store onboarding data
          const onboardingData = {
            email: result.user.email || email,
            username: result.user.displayName || email.split('@')[0],
            firebase_uuid: result.firebase_uuid,
            id: result.firebase_uuid,
            isPartialRegistration: true,
          };
          
          localStorage.setItem(REGISTRATION_KEY, JSON.stringify(onboardingData));
          router.push(ONBOARDING_ONE);
        } else {
          // Better error message - check for detailed error info
          const errorMsg = nextAuthResult?.error || 'Authentication failed. User may not exist in database.';
          console.error('NextAuth sign-in failed:', {
            ok: nextAuthResult?.ok,
            error: nextAuthResult?.error,
            status: nextAuthResult?.status,
            url: nextAuthResult?.url,
            fullResult: nextAuthResult
          });
          
          // More specific error message based on the error
          let displayError = errorMsg;
          if (errorMsg === 'CredentialsSignin' || !errorMsg || errorMsg === '{}') {
            displayError = 'Authentication failed. The user account may not exist in the database yet. Please try again in a moment or contact support.';
          }
          
          setError(displayError);
          setIsLoading(false);
        }
      } else {
        setError(result.error || 'Registration failed');
        setIsLoading(false);
      }
    } catch (error: any) {
      setError(error.message || emailOccurredError);
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // generateRandomPassword removed - Firebase handles authentication

  // handleGoogleRestRegistration removed - Firebase handles user creation automatically

  const signUpWithGoogle = async () => {
    try {
      setError("");
      setIsLoading(true);
      localStorage.removeItem(REGISTRATION_KEY);
      
      const result = await firebaseAuthService.signInWithGoogle();
      
      if (result.success && result.firebase_uuid && result.user) {
        // User is created in Hasura by firebaseAuthService
        // Add delay to ensure user is fully available before NextAuth sign-in
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now sign in with NextAuth
        const nextAuthResult = await signIn('credentials', {
          email: result.user.email || '',
          firebase_uuid: result.firebase_uuid,
          redirect: false,
        });
        
        if (nextAuthResult?.ok) {
          // Force session refresh to get latest user data
          if (update) {
            await update();
            // Wait a bit for session to propagate to all components
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Store onboarding data
          const onboardingData = {
            email: result.user.email || '',
            username: result.user.displayName || result.user.email?.split('@')[0] || '',
            firebase_uuid: result.firebase_uuid,
            id: result.firebase_uuid,
            isPartialRegistration: true,
          };
          
          localStorage.setItem(REGISTRATION_KEY, JSON.stringify(onboardingData));
          
          // Refresh router to update server components with new session
          router.refresh();
          
          // Small delay to ensure session is updated before navigation
          setTimeout(() => {
            router.push(ONBOARDING_ONE);
          }, 300);
        } else {
          // Better error message - check for detailed error info
          const errorMsg = nextAuthResult?.error || 'Authentication failed. User may not exist in database.';
          console.error('NextAuth sign-in failed:', {
            ok: nextAuthResult?.ok,
            error: nextAuthResult?.error,
            status: nextAuthResult?.status,
            url: nextAuthResult?.url,
            fullResult: nextAuthResult
          });
          
          // More specific error message based on the error
          let displayError = errorMsg;
          if (errorMsg === 'CredentialsSignin' || !errorMsg || errorMsg === '{}') {
            displayError = 'Authentication failed. The user account may not exist in the database yet. Please try again in a moment or contact support.';
          }
          
          setError(displayError);
          setIsLoading(false);
        }
      } else {
        setError(result.error || 'Google registration failed');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      setError(error.message || unexpectedError);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth flex flex-col justify-center items-start">
      {/* OAuth flow message removed - using Firebase authentication */}
      {showContinueModal ? (
        <div className="auth__container !max-w-[488px] w-full">
          <div className="auth__card !py-8 !rounded-3xl">
            <h1 className="auth__title !text-xl !font-normal text-center mb-4 font-neusans">
              Continue Registration
            </h1>
            <div className="text-center px-4">
              <p className="text-gray-700 mb-8 font-neusans">
                You have an unfinished changes. Would you like to continue where you left off?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => router.push(ONBOARDING_ONE)}
                  className="bg-[#E36B00] hover:bg-[#d36400] text-white px-6 py-2 rounded-xl text-sm font-neusans"
                >
                  Continue Registration
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(REGISTRATION_KEY);
                    setShowContinueModal(false);
                  }}
                  className="text-gray-700 hover:text-gray-900 underline text-sm font-neusans"
                >
                  Start New Registration
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={e => {
                    e.preventDefault();
                    if (onOpenSignin) onOpenSignin();
                  }}
                  className="text-sm text-[#494D5D] hover:text-[#31343F] underline font-normal font-neusans"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <Spinner size={48} className="text-[#E36B00]" />
            </div>
          )}
          <div className="auth__container !max-w-[488px] w-full overflow-y-auto md:overflow-visible">
            <h1 className="auth__title !text-sm md:!text-xl md:!leading-[30px] !font-normal py-3.5 md:py-4 !mb-0 font-neusans">Sign up</h1>
            <hr className="border-t border-[#CACACA]" />
            <div className="auth__card !px-4 md:!px-8 !pt-0 !pb-4 md:!pb-6 !rounded-none">
              <form className="auth__form !gap-3 md:!gap-4 overflow-y-auto" onSubmit={handleSubmit}>
                <div className="auth__form-group mt-6">
                  <label htmlFor="email" className="auth__label font-neusans">
                    Email
                  </label>
                  <div className="auth__input-group">
                    <input
                      type="text"
                      id="email"
                      className="auth__input font-neusans"
                      placeholder="Email"
                      autoComplete="off"
                      value={email}
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      onChange={(e) => {
                        const value = e.target.value
                        setEmail(value)
                        setEmailError(!validEmail(value) ? validateEmail(value) : "")
                      }}
                      readOnly={false}
                    />
                  </div>
                  {emailError && (
                    <div className="text-red-600 text-xs font-neusans">{emailError}</div>
                  )}
                </div>
                {(
                  <>
                    <div className="auth__form-group">
                      <label htmlFor="password" className="auth__label font-neusans">
                        Password
                      </label>
                      <div className="auth__input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          className="auth__input font-neusans"
                          placeholder="Password"
                          autoComplete="off"
                          value={password}
                          onFocus={(e) => e.target.removeAttribute('readonly')}
                          onChange={(e) => {
                            const value = e.target.value
                            setPassword(value)
                            if (value == confirmPassword) { setConfirmPasswordError("") }
                            if (value.length >= minimumPassword) { setPasswordError("") }
                            if (value.length < minimumPassword) setPasswordError(passwordLimit(minimumPassword));
                          }}
                          readOnly // prevent autofill until focus
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
                    <div className="auth__form-group">
                      <label htmlFor="confirmPassword" className="auth__label font-neusans">
                        Confirm Password
                      </label>
                      <div className="auth__input-group">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          className="auth__input font-neusans"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => {
                            const value = e.target.value
                            setConfirmPassword(value)
                            if (password == value) { setConfirmPasswordError("") }
                            if (password != value) { setConfirmPasswordError(passwordsNotMatch) }
                          }}
                        />
                        {showConfirmPassword ? (
                          <FiEye onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                        ) : (
                          <FiEyeOff onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                        )}
                      </div>
                      {confirmPasswordError && (
                        <div className="text-red-600 text-xs font-neusans">{confirmPasswordError}</div>
                      )}
                    </div>
                  </>
                )}
                <p className="auth__terms font-neusans">By signing up, I agree to TastyPlate's <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/listing-guidelines" target="_blank" rel="noopener noreferrer">Listing Guidelines</a></p>

                <button
                  disabled={isLoading}
                  type="submit"
                  className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl hover:bg-[#d36400] transition-all duration-200 font-neusans"
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
                  onClick={signUpWithGoogle}
                  className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center transition-all duration-200 hover:!bg-gray-50 hover:!shadow-md hover:!border-gray-400 active:!bg-gray-100 font-neusans"
                >
                  <FcGoogle className="h-5 w-5 object-contain mr-2" />
                  <span className="font-normal font-neusans">Continue with Google</span>
                </button>
              </form>
              {error && (
                <div
                  className={`mt-4 mx-10 text-center px-4 py-2 rounded-xl font-normal bg-red-100 text-red-700 font-neusans`}
                  dangerouslySetInnerHTML={{ __html: error }}
                />
              )}
            </div>
            <hr className="border-t border-[#CACACA]" />
            <p className="auth__footer font-neusans">
                Already have an account?{" "}
                <a
                  className="auth__link font-neusans"
                  onClick={e => {
                    e.preventDefault();
                    if (onOpenSignin) onOpenSignin();
                  }}
                >
                  Log in
                </a>
              </p>
          </div>
        </>
      )}
    </div>
  );
};

const RegisterPage: React.FC<RegisterPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
      <RegisterContent {...props} />
    </Suspense>
  );
};

export default RegisterPage;
