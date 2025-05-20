"use client";
import { useState } from "react";
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { UserService } from '@/services/UserService';
import { ILoginCredentials } from '@/interfaces/user';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from "@/components/LoadingSpinner";

interface LoginPageProps {
  onOpenSignup?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onOpenSignup }) => {
  const { setSignedIn, setToken } = useAuth();
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const credentials: ILoginCredentials = { email, password };
      const response = await UserService.login(credentials);

      console.log("Login response:", response);
      const status = response?.data?.status ?? response?.status ?? null;
      if (status == 403) {
        setMessage('Login failed. Please try again.');
        setMessageType("error");
        return;
      } else if (response?.token) {
        setMessage("Login successful!");
        setMessageType("success");
        setSignedIn(true);
        setToken(response.token);
        router.push('/dashboard');
      } else {
        setMessage(response?.message);
        setMessageType("error");
      }
    } catch (error: any) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setMessage('');
      await signInWithPopup(auth, provider).then(async (result) => {
        setIsLoading(true);
        const response = await UserService.handleGoogleAuth(
          result.user.email || "",
        );
        if (response.status == 200) {
          setMessage("Login successful!");
          setMessageType("success");
          setSignedIn(true);
          setToken(response.token);
          router.push('/dashboard');
        } else {
          setMessage(response.message);
          setMessageType("error");
          setSignedIn(false);
        }
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code == 'auth/cancelled-popup-request' || error.code == 'auth/popup-closed-by-user') {
          setIsLoading(false);
          setMessageType("error");
          return;
        }
        setMessage(error.message);
        setMessageType("error");
      } else {
        setMessage("An unexpected error occurred");
        setMessageType("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className="auth__input-group">
                {/* <FiLock className="auth__input-icon" /> */}
                <input
                  type="password"
                  id="password"
                  className="auth__input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl"
              disabled={isLoading}
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
              className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center"
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
