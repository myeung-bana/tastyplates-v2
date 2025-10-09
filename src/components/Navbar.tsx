// Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
// import { useSearchParams } from 'next/navigation';
import "@/styles/components/_navbar.scss";
import "@/styles/components/_hero.scss";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { FiSearch } from "react-icons/fi";
import Image from "next/image";
import CustomPopover from "./ui/Popover/Popover";
import { PiCaretDown } from "react-icons/pi";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from 'next/navigation';
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import toast from 'react-hot-toast';
import { logOutSuccessfull } from "@/constants/messages";
import { sessionStatus } from "@/constants/response";
import { HOME, LISTING, LISTING_EXPLANATION, PROFILE, RESTAURANTS, SETTINGS } from "@/constants/pages";
import { PAGE } from "@/lib/utils";
import { DEFAULT_USER_ICON, TASTYPLATES_LOGO_BLACK, TASTYPLATES_LOGO_COLOUR, TASTYPLATES_LOGO_WHITE } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import PasswordUpdatedModal from "./ui/Modal/PasswordUpdatedModal";
import { LOGOUT_KEY, LOGIN_BACK_KEY, LOGIN_KEY, WELCOME_KEY, SESSION_EXPIRED_KEY, UPDATE_PASSWORD_KEY } from "@/constants/session";
import CustomModal from "./ui/Modal/Modal";
import { MdArrowBackIos } from "react-icons/md";
import NavbarSearchBar from "./NavbarSearchBar";
import LocationButton from "./LocationButton";

const navigationItems = [
  { name: "Explore", href: RESTAURANTS },
  { name: "Following", href: "/following" },
  // { name: "Dashboard", href: "/dashboard" },
  // { name: "Submit Listing", href: "/submit-restaurant" },
];

export default function Navbar(props: Record<string, unknown>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { isLandingPage = false, hasSearchBar = false, hasSearchBarMobile = false } = props as {
    isLandingPage?: boolean;
    hasSearchBar?: boolean;
    hasSearchBarMobile?: boolean;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSignup, setIsOpenSignup] = useState(false);
  const [isOpenSignin, setIsOpenSignin] = useState(false);
  const [isOpenPasswordUpdate, setIsOpenPasswordUpdate] = useState(false);
  const [navBg, setNavBg] = useState(false);

  const handleLogout = async () => {
    removeAllCookies();
    localStorage.clear();
    localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);

    await signOut({ redirect: true, callbackUrl: HOME });
  };

  const changeNavBg = () => {
    setNavBg(window.scrollY > 64);
  };


  useEffect(() => {
    const loginMessage = localStorage?.getItem(LOGIN_BACK_KEY) ?? "";
    const logOutMessage = localStorage?.getItem(LOGOUT_KEY) ?? "";
    const googleMessage = Cookies.get(LOGIN_KEY) ?? "";
    const welcomeMessage = localStorage?.getItem(WELCOME_KEY) ?? "";
    const sessionExpiredMessage = localStorage?.getItem(SESSION_EXPIRED_KEY) ?? "";
    const openPasswordUpdateModal = localStorage?.getItem(UPDATE_PASSWORD_KEY) ?? "";

    if ((loginMessage || logOutMessage || googleMessage)) {
      if (!welcomeMessage) {
        toast.success(loginMessage || logOutMessage || googleMessage, {
          duration: 3000, // 3 seconds
        });
      }

      removeAllCookies([LOGIN_KEY]);
      localStorage.removeItem(LOGIN_BACK_KEY);
      localStorage.removeItem(LOGOUT_KEY);
    }

    if (sessionExpiredMessage) {
      toast.error(sessionExpiredMessage, {
        duration: 3000, // 3 seconds
      });
      localStorage.removeItem(SESSION_EXPIRED_KEY);
    }


    if (openPasswordUpdateModal) {
      setIsOpenPasswordUpdate(true);
      localStorage.removeItem(UPDATE_PASSWORD_KEY);
    }

    window.addEventListener("scroll", changeNavBg);
    return () => {
      window.removeEventListener("scroll", changeNavBg);
    };
  }, []);

  useEffect(() => {
    const googleErrorType = Cookies.get('googleErrorType');
    if (googleErrorType == 'signup') {
      setIsOpenSignup(true);
    } else if (googleErrorType == 'login') {
      setIsOpenSignin(true);
    }

  }, [router]);

  const validatePage = pathname?.includes('onboarding') || pathname?.includes('reset-password');

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
      <PasswordUpdatedModal isOpen={isOpenPasswordUpdate} onClose={() => setIsOpenPasswordUpdate(false)} />
      <nav
        className={`navbar !z-[1000] hidden md:block ${isLandingPage
          ? navBg ? 'bg-white border-b border-[#CACACA]' : "bg-transparent"
          : "bg-white border-b border-[#CACACA]"
          }`}
      >
        <div
          className={`navbar__container py-0 flex flex-col justify-center ${!isLandingPage ? "sm:!py-0" : "sm:!py-0"
            }`}
        >
          <div className="navbar__content">
            <div className="flex gap-2 sm:gap-4">
              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md"
                >
                  <svg
                    className="h-4 w-4"
                    stroke={`${isLandingPage && !navBg ? '#FCFCFC' : '#31343F'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="navbar__brand">
                <Link href={HOME} className="flex-shrink-0 flex items-center">
                  <Image
                    src={`${isLandingPage ? !navBg ? TASTYPLATES_LOGO_WHITE : TASTYPLATES_LOGO_BLACK : TASTYPLATES_LOGO_COLOUR}`}
                    className="h-5 md:h-6 w-auto object-contain"
                    height={24}
                    width={120}
                    alt="TastyPlates Logo"
                  />
                </Link>
              </div>
              
              {/* Center Search Bar */}
              <div className="navbar__center">
                <NavbarSearchBar 
                  isAuthenticated={!!session} 
                  isTransparent={isLandingPage && !navBg}
                />
              </div>
              
              {/* Conditional Navigation - Only show when authenticated */}
              {session && (
                <div className="navbar__menu justify-start">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`navbar__nav-item ${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="navbar__auth">
              {(status !== sessionStatus.authenticated && validatePage) ? <div className="w-11 h-11 rounded-full overflow-hidden">
                <Image
                  src={DEFAULT_USER_ICON}
                  alt={"Profile"}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover rounded-full"
                />
              </div> : (status !== sessionStatus.authenticated) ? (
                <>
                  {/* Location Button - Left of Log In */}
                  <LocationButton isTransparent={isLandingPage && !navBg} />
                  
                  <button
                    onClick={() => {
                      setIsOpenSignup(false)
                      setIsOpenSignin(true)
                    }}
                    className={`navbar__button navbar__button--primary hover:rounded-[50px] border-none ${isLandingPage && !navBg ? '!bg-transparent !text-white' : ''} ${!isLandingPage ? '!bg-transparent' : ''} font-semibold hidden md:block`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setIsOpenSignup(true)
                      setIsOpenSignin(false)
                    }}
                    className="navbar__button navbar__button--secondary rounded-[50px] bg-white text-[#494D5D] font-semibold mr-1 md:mr-0"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  {/* Location Button - Left of Review */}
                  <LocationButton isTransparent={isLandingPage && !navBg} />
                  
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <button className="bg-[#FCFCFC66]/40 rounded-[50px] text-sm h-11 px-6 hidden md:flex flex-row flex-nowrap items-center gap-2 text-white backdrop-blur-sm">
                        <span
                          className={`${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                            } text-center font-semibold`}
                        >
                          Review
                        </span>
                        <PiCaretDown
                          className={`${isLandingPage && !navBg ? "fill-white" : "fill-[#494D5D]"
                            } size-5`}
                        />
                      </button>
                    }
                    content={
                      <div className={`bg-white text-sm flex flex-col rounded-2xl text-[#494D5D] ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
                        <Link href={LISTING} className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Write a Review
                        </Link>
                        <Link href={LISTING_EXPLANATION} className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Add a Listing
                        </Link>
                      </div>
                    }
                  />
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <div className="w-11 h-11 rounded-full overflow-hidden">
                        <FallbackImage
                          src={session?.user?.image || DEFAULT_USER_ICON}
                          alt={session?.user?.name || "Profile"}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover rounded-full"
                          type={FallbackImageType.Icon}
                        />
                      </div>
                    }
                    content={
                      <div className="bg-white flex flex-col rounded-2xl text-[#494D5D] border border-gray-200">
                        <Link href={PROFILE} className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          My Profile
                        </Link>
                        <Link href={SETTINGS} className='text-left pl-3.5 pr-12 py-3.5 font-semibold'>
                          Settings
                        </Link>
                        <div className="border-t border-gray-200 w-full" />
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
          </div>
        </div>

        {/* Mobile menu */}
        <aside
          id="separator-sidebar"
          className={`fixed top-0 left-0 z-40 w-[189px] h-screen transition-transform ${isOpen ? "" : "-translate-x-full"
            } sm:translate-x-0 sm:hidden`}
          aria-label="Sidebar"
        >
          <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
            <ul className="space-y-2 font-medium">
              <li className="flex gap-2 items-center">
                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md"
                  >
                    <svg
                      className="h-6 w-6"
                      stroke="#31343F"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
                <div className="navbar__brand">
                  <Link href={HOME} className="flex-shrink-0 flex items-center">
                    <Image
                      src="/TastyPlates_Logo_Black.svg"
                      className="h-5 w-auto object-contain"
                      height={20}
                      width={184}
                      alt="TastyPlates Logo"
                    />
                  </Link>
                </div>
              </li>
              <li>
                <div className="navbar__menu !flex justify-start">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-[#494D5D]"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </li>
              <li>
                <div className="navbar__auth">
                  {status !== sessionStatus.authenticated ? (
                    <>
                      <button
                        onClick={() => setIsOpenSignin(true)}
                        className="navbar__button navbar__button--primary bg-transparent hover:rounded-[50px] border-none text-white font-semibold"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => setIsOpenSignup(true)}
                        className="navbar__button navbar__button--secondary rounded-[50px] !bg-white text-[#31343F] font-semibold hidden sm:block"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      <CustomPopover
                        align="bottom-end"
                        trigger={
                          <button className="bg-[#FCFCFC66]/40 rounded-[50px] h-11 px-2 sm:px-5 flex flex-row flex-nowrap items-center gap-2 text-white">
                            <span
                              className="text-[#494D5D] text-center font-semibold"
                            >
                              Review
                            </span>
                            <PiCaretDown
                              className="fill-[#494D5D] size-5"
                            />
                          </button>
                        }
                        content={
                          <div className="bg-transparent flex flex-col rounded-2xl text-[#494D5D]">
                            <Link
                              href={LISTING}
                              className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                            >
                              Write a Review
                            </Link>
                            <Link
                              href={LISTING_EXPLANATION}
                              className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                            >
                              Add a Listing
                            </Link>
                          </div>
                        }
                      />
                    </>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </nav>
    </>
  );
}
