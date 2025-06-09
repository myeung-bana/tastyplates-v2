"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Spinner from "@/components/LoadingSpinner";
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface LoginPageProps {
  onOpenSignup?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onOpenSignup }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const googleError = Cookies.get('googleError');
    if (googleError) {
      setMessage(decodeURIComponent(googleError));
      setMessageType("error");
      removeAllCookies();
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/'
      });

      if (result?.error) {
        setMessage('Login failed. Please try again.');
        setMessageType("error");
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
        setMessage('');
        removeAllCookies();
        setIsLoading(true);
        await signIn('google', {
            redirect: true,
            callbackUrl: '/'
        });
    } catch (error: any) {
        setMessage("Google login failed");
        setMessageType("error");
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
      <div className="auth__container">
        <div className="auth__card">
          <h1 className="auth__title">Login</h1>

          <form className="auth__form border-y border-[#CACACA] !gap-4 !pb-6" onSubmit={handleSubmit}>
            <div className="auth__form-group mt-6">
              <label htmlFor="email" className="auth__label">
                Email Address
              </label>
              <div className="auth__input-group">
                {/* <FiMail className="auth__input-icon" /> */}
                <input
                  type="email"
                  id="email"
                  className="auth__input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth__form-group">
              <label htmlFor="password" className="auth__label">
                Password
              </label>
              <div className="auth__input-group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="auth__input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {showPassword ? (
                  <FiEye onClick={toggleShowPassword} className="auth__input-icon" />
                ) : (
                  <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon" />
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
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
              onClick={loginWithGoogle}
              className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:bg-gray-100"
            >
              <FcGoogle className="h-5 w-5 object-contain mr-2" />
              <span>Continue with Google</span>
            </button>
          </form>
          {message && (
            <div
              className={`mt-4 text-center px-4 py-2 rounded-xl font-medium ${messageType === "success"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
                }`}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
          <p className="auth__footer !mt-3.5">
            New to TastyPlates?{" "}
            <a
              className="auth__link !text-[#494D5D] cursor-pointer"
              onClick={e => {
                e.preventDefault();
                onOpenSignup && onOpenSignup();
              }}
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
