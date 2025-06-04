"use client";
import { useState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "@/styles/pages/_auth.scss";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { FirebaseError } from 'firebase/app';
import { UserService } from '@/services/userService';
import Spinner from "@/components/LoadingSpinner";
import { signIn } from "next-auth/react";
import Cookies from "js-cookie";
import { removeAllCookies } from "@/utils/removeAllCookies";

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
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  useEffect(() => {
    const googleError = Cookies.get('googleError');
    if (googleError) {
      setError(decodeURIComponent(googleError));
      removeAllCookies();
    }
  }, [router]);

  const checkEmailExists = async (email: string) => {
    const checkEmail = await UserService.checkEmailExists(email);
    if (checkEmail.status == 400) {
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
    setPasswordError("");
    setConfirmPasswordError("");

    if (password.length < 5) {
      setPasswordError("Password must be at least 5 characters");
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    localStorage.removeItem('registrationData');

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
      localStorage.setItem('registrationData', JSON.stringify({
        email,
        password
      }));

      router.push('/onboarding');
    } catch (error) {
      console.error("Error checking email:", error);
      setError("An error occurred while checking the email.");
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
      localStorage.removeItem('registrationData');
      removeAllCookies();
      // Set a cookie to indicate signup intent
      Cookies.set('auth_type', 'signup', { path: '/', sameSite: 'lax' });

      await signIn('google', {
        redirect: false,
        callbackUrl: '/',
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/cancelled-popup-request') {
          setIsLoading(false);
          return;
        }
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth flex flex-col justify-center items-start">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spinner size={48} className="text-[#E36B00]" />
        </div>
      )}

      <div className="auth__container !max-w-[488px]">
        <div className="auth__card !py-4 !rounded-3xl">
          <h1 className="auth__title !text-xl !font-semibold">Sign up</h1>
          <form className="auth__form border-y border-[#CACACA] !gap-4 !pb-6" onSubmit={handleSubmit}>
            <div className="auth__form-group mt-6">
              <label htmlFor="email" className="auth__label">
                Email
              </label>
              <div className="auth__input-group">
                <input
                  type="email"
                  id="email"
                  className="auth__input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                // required
                />
              </div>
            </div>

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            <div className="text-sm font-normal">
              By continuing, you agree to TastyPlates'&nbsp;
              <span className="font-semibold underline text=[#494D5D]">Terms of Service</span>&nbsp;
              and&nbsp;
              <span className="font-semibold underline text=[#494D5D]">Privacy Policy</span>
            </div>

            <button disabled={isLoading} type="submit" className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl">
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
              className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center"
            >
              <FcGoogle className="h-5 w-5 object-contain mr-2" />
              <span>Continue with Google</span>
            </button>
          </form>
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
              className="auth__link !text-[#494D5D] cursor-pointer"
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
    </div>
  );
};

export default RegisterPage;
