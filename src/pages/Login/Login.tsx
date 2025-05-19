"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMail, FiLock } from "react-icons/fi";
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { FirebaseError } from 'firebase/app';
import { UserRepository } from '@/repositories/userRepository';
import { useRouter } from 'next/navigation';
import { ILoginCredentials } from '@/interfaces/user';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { setSignedIn } = useAuth();
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credentials: ILoginCredentials = { email, password };
      const response = await UserRepository.login(credentials);
      
      // Set auth state
      setSignedIn(true);
      router.push('/dashboard'); // or wherever you want to redirect
      
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError('');
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      
      try {
        // const response = await UserRepository.handleGoogleAuth(
        //   result.user.email || "",
        //   await result.user.getIdToken()
        // );
        
        // Set auth state and redirect
        setSignedIn(true);
        router.push('/dashboard');
        
      } catch (error: any) {
        if (error.message === 'GOOGLE_USER_NOT_REGISTERED') {
          // Redirect to registration with Google data
          localStorage.setItem('registrationData', JSON.stringify({
            email: result.user.email,
            username: result.user.displayName,
            googleAuth: true,
            googleToken: await result.user.getIdToken()
          }));
          router.push('/onboarding');
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/cancelled-popup-request') {
          // User cancelled the popup, no need to show error
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
    <div className="auth">
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
              {isLoading ? 'Loading...' : 'Continue'}
            </button>
            <div className="text-sm font-normal flex flex-row flex-nowrap items-center gap-2">
              <hr className="w-full border-t border-[#494D5D]"/>
              or
              <hr className="w-full border-t border-[#494D5D]"/>
            </div>

            <button 
              type="button"
              onClick={loginWithGoogle}
              className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center"
            >
              <FcGoogle className="h-5 w-5 object-contain mr-2" />
              <span>Continue with Google</span>
            </button>
          </form>

          <p className="auth__footer !mt-3.5">
            Already have an account?{" "}
            <Link href="/login" className="auth__link !text-[#494D5D]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
