"use client";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc"
import "@/styles/pages/_auth.scss";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log("Registration attempt:", {
      name,
      email,
      password,
      confirmPassword,
    });
    router.push('/onboarding1')
  };

  const toggleShowPassword = () => setShowPassword(!showPassword)

  return (
    <div className="auth flex flex-col justify-center items-start">
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
                  // required
                />
                {showPassword ? (
                  <FiEye onClick={toggleShowPassword} className="auth__input-icon" />
                ) : (
                  <FiEyeOff onClick={toggleShowPassword} className="auth__input-icon" />
                )}
              </div>
            </div>
            <div className="text-sm font-normal">
              By continuing, you agree to TastyPlates'&nbsp;
              <span className="font-semibold underline text=[#494D5D]">Terms of Service</span>&nbsp;
              and&nbsp;
              <span className="font-semibold underline text=[#494D5D]">Privacy Policy</span>
            </div>

            <button type="submit" className="auth__button !bg-[#E36B00] !mt-0 !rounded-xl">
              Continue
            </button>
            <div className="text-sm font-normal flex flex-row flex-nowrap items-center gap-2">
              <hr className="w-full border-t border-[#494D5D]"/>
              or
              <hr className="w-full border-t border-[#494D5D]"/>
            </div>

            <button type="submit" className="!bg-transparent text-center py-3 !mt-0 !border !border-[#494D5D] !rounded-xl !text-black flex items-center justify-center">
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

export default RegisterPage;
