"use client";
import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import { useRouter } from "next/navigation";
import { FirebaseError } from 'firebase/app';
import { UserService } from '@/services/userService';
import Spinner from "@/components/LoadingSpinner";
import { signIn } from "next-auth/react";
import Cookies from "js-cookie";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { minimumPassword } from "@/constants/validation";
import { emailOccurredError, emailRequired, invalidEmailFormat, passwordLimit, passwordsNotMatch, unexpectedError } from "@/constants/messages";
import { FIREBASE_ERRORS, responseStatusCode as code, sessionProvider as provider, sessionType } from "@/constants/response";
import { validEmail } from "@/lib/utils";
import { HOME, ONBOARDING_ONE, TERMS_OF_SERVICE, PRIVACY_POLICY } from "@/constants/pages";

interface RegisterPageProps {
  onOpenSignin?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onOpenSignin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [showContinueModal, setShowContinueModal] = useState(false);
  const REGISTRATION_KEY = 'registrationData';

  useEffect(() => {
    const registrationData = localStorage.getItem(REGISTRATION_KEY);
    if (registrationData && JSON.parse(registrationData).isPartialRegistration) {
      setShowContinueModal(true);
    }

    const googleError = Cookies.get('googleError');
    if (googleError) {
      setError(decodeURIComponent(googleError));
      removeAllCookies();
    }
  }, [router]);

  const checkEmailExists = async (email: string) => {
    const checkEmail = await UserService.checkEmailExists(email);
    if (checkEmail.status == code.badRequest) {
      setError(checkEmail.message);
      return false;
    }

    if (checkEmail.exists) {
      setError(checkEmail.message);
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

    // Password validation
    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        return;
      }

      // Save basic info to localStorage
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify({
        email,
        password
      }));

      router.push(ONBOARDING_ONE);
    } catch (error) {
      setError(emailOccurredError);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const signUpWithGoogle = async () => {
    try {
      setError("");
      setIsLoading(true);
      localStorage.removeItem(REGISTRATION_KEY);
      removeAllCookies();
      // Set a cookie to indicate signup intent
      Cookies.set('auth_type', sessionType.signup, { path: '/', sameSite: 'lax' });

      await signIn(provider.google, {
        redirect: false,
        callbackUrl: HOME,
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERRORS.CANCELLED_POPUP_REQUEST) {
          setIsLoading(false);
          return;
        }
        setError(error.message);
      } else {
        setError(unexpectedError);
      }
    } finally {
      // setIsLoading(false);
    }
  };

  return (
    <div className="auth flex flex-col justify-center items-start">
      {showContinueModal ? (
        <div className="auth__container !max-w-[488px] w-full">
          <div className="auth__card !py-8 !rounded-3xl">
            <h1 className="auth__title !text-xl !font-semibold text-center mb-4">
              Continue Registration
            </h1>
            <div className="text-center px-4">
              <p className="text-gray-700 mb-8">
                You have an unfinished changes. Would you like to continue where you left off?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => router.push(ONBOARDING_ONE)}
                  className="bg-[#E36B00] hover:bg-[#d36400] text-white px-6 py-2 rounded-xl text-sm"
                >
                  Continue Registration
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(REGISTRATION_KEY);
                    setShowContinueModal(false);
                  }}
                  className="text-gray-700 hover:text-gray-900 underline text-sm"
                >
                  Start New Registration
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={e => {
                    e.preventDefault();
                    onOpenSignin && onOpenSignin();
                  }}
                  className="text-sm text-[#494D5D] hover:text-[#31343F] underline font-medium"
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
            <div className="auth__card !px-0 !py-4 !rounded-3xl">
              <h1 className="auth__title !text-xl !font-semibold">Sign up</h1>
              <div className=" border-y border-[#CACACA]">
                <form className="auth__form px-[2rem] !gap-4 overflow-y-auto !pb-6" onSubmit={handleSubmit}>
                  <div className="auth__form-group mt-6">
                    <label htmlFor="email" className="auth__label">
                      Email
                    </label>
                    <div className="auth__input-group">
                      <input
                        type="text"
                        id="email"
                        className="auth__input"
                        placeholder="Email"
                        autoComplete="off"
                        value={email}
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        onChange={(e) => {
                          const value = e.target.value
                          setEmail(value)
                          setEmailError(!validEmail(value) ? validateEmail(value) : "")
                        }}
                        readOnly // prevent autofill until focus
                      />
                    </div>
                  </div>
                  {emailError && (
                    <div className="text-red-600 text-xs">{emailError}</div>
                  )}
                  <div className="auth__form-group">
                    <label htmlFor="password" className="auth__label">
                      Password
                    </label>
                    <div className="auth__input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="auth__input"
                        placeholder="Password"
                        autoComplete="off"
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
                        <FiEye onClick={toggleShowPassword} className="auth__input-icon" />
                      ) : (
                        <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon" />
                      )}
                    </div>
                    {passwordError && (
                      <div className="text-red-600 text-xs mt-1">{passwordError}</div>
                    )}
                  </div>

                  <div className="auth__form-group">
                    <label htmlFor="confirmPassword" className="auth__label">
                      Confirm Password
                    </label>
                    <div className="auth__input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className="auth__input"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (password == e.target.value) { setConfirmPasswordError("") }
                          if (password != e.target.value) { setConfirmPasswordError(passwordsNotMatch) }
                        }}
                      />
                      {showConfirmPassword ? (
                        <FiEye onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                      ) : (
                        <FiEyeOff onClick={toggleShowConfirmPassword} className="auth__input-icon" />
                      )}
                    </div>
                    {confirmPasswordError && (
                      <div className="text-red-600 text-xs mt-1">{confirmPasswordError}</div>
                    )}
                  </div>
                  {confirmPasswordError && (
                    <div className="text-red-600 text-xs mt-1">{confirmPasswordError}</div>
                  )}
                  <div className="text-sm font-normal w-full flex flex-wrap gap-x-1 gap-y-1 text-center mb-2">
                    <span>By continuing, you agree to TastyPlates&apos;s</span>
                    <a
                      href={TERMS_OF_SERVICE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline text-[#494D5D] hover:text-[#31343F]"
                    >
                      Terms of Service
                    </a>
                    <span>and</span>
                    <a
                      href={PRIVACY_POLICY}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline text-[#494D5D] hover:text-[#31343F]"
                    >
                      Privacy Policy
                    </a>
                  </div>

                  <button
                    disabled={isLoading}
                    type="submit"
                    className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl hover:bg-[#d36400] transition-all duration-200"
                  >
                    Continue
                  </button>
                  <div className="text-sm font-normal flex flex-row flex-nowrap items-center gap-2">
                    <hr className="w-full border-t border-[#494D5D]" />
                    or
                    <hr className="w-full border-t border-[#494D5D]" />
                  </div>

                  <button
                    disabled={isLoading}
                    type="button"
                    onClick={signUpWithGoogle}
                    className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center transition-all duration-200 hover:!bg-gray-50 hover:!shadow-md hover:!border-gray-400 active:!bg-gray-100"
                  >
                    <FcGoogle className="h-5 w-5 object-contain mr-2" />
                    <span>Continue with Google</span>
                  </button>
                </form>
              </div>
              {error && (
                <div
                  className={`mt-4 text-center px-4 py-2 rounded-xl font-medium bg-red-100 
                text-red-700 border border-red-300"}`}
                  dangerouslySetInnerHTML={{ __html: error }}
                />
              )}
              <p className="auth__footer !mt-3.5">
                Already have an account?{" "}
                <a
                  className="auth__link !text-[#494D5D] cursor-pointer !font-bold"
                  onClick={e => {
                    e.preventDefault();
                    onOpenSignin && onOpenSignin();
                  }}
                >
                  Log in
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterPage;
