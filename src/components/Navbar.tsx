"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import "@/styles/components/_navbar.scss";
import "@/styles/components/_hero.scss";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { FiSearch } from "react-icons/fi";
import Image from "next/image";
import CustomPopover from "./ui/Popover/Popover";
import { PiCaretDown } from "react-icons/pi";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";

const navigationItems = [
  { name: "Restaurant", href: "/restaurants" },
  // { name: "Dashboard", href: "/dashboard" },
  // { name: "Submit Listing", href: "/submit-restaurant" },
];

export default function Navbar(props: any) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLandingPage = false, hasSearchBar = false } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSignup, setIsOpenSignup] = useState(false);
  const [isOpenSignin, setIsOpenSignin] = useState(false);
  const [navBg, setNavBg] = useState(false);

  const handleLogout = async () => {
    removeAllCookies();
    localStorage.clear();
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  const changeNavBg = () => {
    window.scrollY >= 800 ? setNavBg(true) : setNavBg(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", changeNavBg);
    return () => {
      window.removeEventListener("scroll", changeNavBg);
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      // Clear error params if authenticated
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, status]);

  useEffect(() => {
    const googleErrorType = Cookies.get('googleErrorType');

    if (googleErrorType == 'signup') {
      setIsOpenSignup(true);
    } else if (googleErrorType == 'login') {
      setIsOpenSignin(true);
    }

  }, [router]);

  return (
    <>
      <SignupModal
        isOpen={isOpenSignup}
        onClose={() => setIsOpenSignup(false)}
        onOpenSignin={() => {
          setIsOpenSignup(false);
          setIsOpenSignin(true);
        }}
      />
      <SigninModal
        isOpen={isOpenSignin}
        onClose={() => setIsOpenSignin(false)}
        onOpenSignup={() => {
          setIsOpenSignin(false);
          setIsOpenSignup(true);
        }}
      />
      <nav className={`navbar backdrop-blur-sm ${isLandingPage ? 'bg-transparent' : 'bg-white border-b border-[#CACACA]'}`}>
        <div className={`navbar__container ${!isLandingPage ? 'py-2' : 'py-3'}`}>
          <div className="navbar__content">
            <div className="flex gap-4">
              <div className="navbar__brand">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <h1
                    className={`${isLandingPage ? "!text-white" : "text-[#494D5D]"
                      }`}
                  >
                    TastyPlate
                  </h1>
                </Link>
              </div>
              <div className="navbar__menu justify-start">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${isLandingPage ? "!text-white" : "text-[#494D5D]"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {hasSearchBar && (
              <div>
                <div className="flex gap-2.5 items-center border border-[#E5E5E5] !p-[5px] !rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
                  <div className="hero__search-restaurant !bg-transparent">
                    {/* <FiSearch className="hero__search-icon" /> */}
                    {/* <label htmlFor="myEthnic">My Ethnic</label><br /> */}
                    <input
                      type="text"
                      placeholder="Search Ethnic"
                      className="hero__search-input"
                    />
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !bg-transparent">
                    {/* <FiMapPin className="hero__search-icon" /> */}
                    <input
                      type="text"
                      placeholder="Search location"
                      className="hero__search-input"
                    />
                    {/* <button
                                type="button"
                                className="hero__location-button"
                                onClick={getCurrentLocation}
                                disabled={isLoading}
                                title="Use current location"
                              >
                                <FiNavigation
                                  className={`hero__location-icon ${
                                    isLoading ? "spinning" : ""
                                  }`}
                                />
                              </button> */}
                  </div>
                  <button
                    type="submit"
                    className="hero__search-button !rounded-full h-[44px] w-[44px] !p-3 text-center !bg-[#E36B00]"
                  // disabled={!location || !cuisine}
                  >
                    <FiSearch className="hero__search-icon !h-5 !w-5 stroke-white" />
                  </button>
                </div>
              </div>
            )}
            <div className="navbar__auth">
              {status !== "authenticated" ? (
                <>
                  <button
                    onClick={() => setIsOpenSignin(true)}
                    className="navbar__button navbar__button--primary bg-transparent hover:rounded-[50px] border-none text-white font-semibold"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsOpenSignup(true)}
                    className="navbar__button navbar__button--secondary rounded-[50px] bg-white text-[#494D5D] font-semibold"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <button className="bg-[#FCFCFC66]/40 rounded-[50px] h-11 px-6 flex flex-row flex-nowrap items-center gap-2 text-white">
                        <span className={`${isLandingPage ? "!text-white" : "text-[#494D5D]"} text-center font-semibold`}>Review</span>
                        <PiCaretDown className={`${isLandingPage ? "fill-white" : "fill-[#494D5D]"} size-5`} />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col rounded-2xl text-[#494D5D]">
                        <Link href="/add-review" className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Write a Review
                        </Link>
                        <Link href="/listing/add" className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Add a Listing
                        </Link>
                      </div>
                    }
                  />
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <div className="w-11 h-11 rounded-full overflow-hidden">
                        <Image
                          src={session.user?.image || "/profile-icon.svg"}
                          alt={session.user?.name || "Profile"}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    }
                    content={
                      <div className="bg-white flex flex-col rounded-2xl text-[#494D5D]">
                        <Link href="/profile" className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          My Profile
                        </Link>
                        <Link href="/settings" className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className='text-left pl-3.5 pr-12 py-3.5 font-semibold'
                        >
                          Log Out
                        </button>
                      </div>
                    }
                  />
                </>
              )}
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
              <div className="hero__search">
                <div className="hero__search-wrapper !p-3.5 !rounded-[50px]">
                  <div className="hero__search-restaurant !bg-transparent">
                    {/* <FiSearch className="hero__search-icon" /> */}
                    {/* <label htmlFor="myEthnic">My Ethnic</label><br /> */}
                    <input
                      type="text"
                      placeholder="Search Ethnic"
                      className="hero__search-input"
                    />
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !bg-transparent">
                    {/* <FiMapPin className="hero__search-icon" /> */}
                    <input
                      type="text"
                      placeholder="Search location"
                      className="hero__search-input"
                    />
                    {/* <button
                                type="button"
                                className="hero__location-button"
                                onClick={getCurrentLocation}
                                disabled={isLoading}
                                title="Use current location"
                              >
                                <FiNavigation
                                  className={`hero__location-icon ${
                                    isLoading ? "spinning" : ""
                                  }`}
                                />
                              </button> */}
                  </div>
                  <button
                    type="submit"
                    className="hero__search-button !rounded-full h-[44px] w-[44px] !p-3 text-center !bg-[#E36B00]"
                  // disabled={!location || !cuisine}
                  >
                    {/* <FiSearch className="hero__search-icon !h-5 !w-5 stroke-white" /> */}
                  </button>
                </div>
              </div>
              <div className="navbar__auth">
                <button
                  onClick={() => setIsOpenSignin(true)}
                  className="navbar__button navbar__button--secondary"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsOpenSignup(true)}
                  className="navbar__button navbar__button--primary"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
