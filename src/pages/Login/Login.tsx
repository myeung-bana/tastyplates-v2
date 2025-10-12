"use client";
import { useState, useEffect } from "react";
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Spinner from "@/components/LoadingSpinner";
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { emailRequired, googleLoginFailed, invalidEmailFormat, loginFailed, passwordRequired, unexpectedError } from "@/constants/messages";
import { responseStatus, sessionProvider as provider } from "@/constants/response";
import { HOME } from "@/constants/pages";
import { validEmail } from "@/lib/utils";

interface LoginPageProps {
  onOpenSignup?: () => void;
  onOpenForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onOpenSignup, onOpenForgotPassword }) => {
  const router = useRouter();
  // Removed unused variable
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<(typeof responseStatus)[keyof typeof responseStatus] | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    const googleError = Cookies.get('googleError');
    if (googleError) {
      if (googleError.includes('exist')) {
        setMessage(decodeURIComponent(loginFailed));
      } else {
        setMessage(decodeURIComponent(googleError));
      }
      setMessageType(responseStatus.error);
      removeAllCookies();
    }
  }, [router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
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
      const result = await signIn(provider.credentials, {
        email,
        password,
        redirect: true,
        callbackUrl: HOME
      });

      if (result?.error) {
        setMessage(loginFailed);
        setMessageType(responseStatus.error);
      } else if (result?.ok) {
        router.push(HOME);
      }
    } catch (error) {
      setMessage((error as { message?: string })?.message || unexpectedError);
      setMessageType(responseStatus.error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setMessage('');
      removeAllCookies();
      setIsLoading(true);
      await signIn(provider.google, {
        redirect: true,
        callbackUrl: HOME
      });
    } catch {
      setMessage(googleLoginFailed);
      setMessageType(responseStatus.error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="auth">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spinner size={48} className="text-[#E36B00]" />
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
              <p className="auth__terms font-neusans">By logging in, you agree to TastyPlate's <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/listing-guidelines" target="_blank" rel="noopener noreferrer">Listing Guidelines</a></p>
              <button
                type="submit"
                disabled={isLoading}
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
            <div
              className={`mt-4 mx-10 text-center px-4 py-2 rounded-xl font-normal font-neusans ${messageType == responseStatus.success
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
              dangerouslySetInnerHTML={{ __html: message }}
            />
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
