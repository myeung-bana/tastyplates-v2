"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMail, FiLock } from "react-icons/fi";
import "@/styles/pages/_auth.scss";

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
          <h1 className="auth__title">Welcome Back</h1>
          <p className="auth__subtitle">Please sign in to continue</p>

          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="auth__form-group">
              <label htmlFor="email" className="auth__label">
                Email Address
              </label>
              <div className="auth__input-group">
                <FiMail className="auth__input-icon" />
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
                <FiLock className="auth__input-icon" />
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

            <button type="submit" className="auth__button">
              Sign In
            </button>
          </form>

          <p className="auth__footer">
            Don't have an account?{" "}
            <Link href="/register" className="auth__link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
