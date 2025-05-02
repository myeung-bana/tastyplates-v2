"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMail, FiLock } from "react-icons/fi";
import "@/styles/pages/_auth.scss";
import { FcGoogle } from "react-icons/fc";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log("Login attempt:", { email, password });
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

export default LoginPage;
