"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "@/styles/components/_navbar.scss";

const navigationItems = [
  { name: "Restaurant", href: "/restaurants" },
  // { name: "Dashboard", href: "/dashboard" },
  // { name: "Submit Listing", href: "/submit-restaurant" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [navBg, setNavBg] = useState(false);

  const changeNavBg = () => {
   window.scrollY >= 800 ? setNavBg(true) : setNavBg(false);
  }

  useEffect(() => {
    window.addEventListener('scroll', changeNavBg);
    return () => {
      window.removeEventListener('scroll', changeNavBg);
    }
  }, [])

  return (
    <nav className={`navbar backdrop-blur-sm bg-transparent`}>
      <div className="navbar__container">
        <div className="navbar__content">
          <div className="flex gap-4">
            <div className="navbar__brand">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <h1 className="!text-white">TastyPlates</h1>
              </Link>
            </div>
            <div className="navbar__menu justify-start">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href} className="!text-white">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="navbar__auth">
            <Link
              href="/login"
              className="navbar__button navbar__button--secondary bg-transparent hover:rounded-[50px] border-none text-white font-semibold"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="navbar__button navbar__button--primary rounded-[50px] bg-white text-black font-semibold"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-gray-900 hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
            <div className="navbar__auth">
              <Link
                href="/login"
                className="navbar__button navbar__button--secondary"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="navbar__button navbar__button--primary"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
