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
import { useSearchParams } from "next/navigation";
import { logOutSuccessfull } from "@/constants/messages";
import { sessionStatus } from "@/constants/response";
import { HOME, LISTING, LISTING_EXPLANATION, PROFILE, RESTAURANTS, SETTINGS } from "@/constants/pages";
import { PAGE } from "@/lib/utils";
import { DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";

const navigationItems = [
  { name: "Restaurant", href: RESTAURANTS },
  // { name: "Dashboard", href: "/dashboard" },
  // { name: "Submit Listing", href: "/submit-restaurant" },
];

export default function Navbar(props: any) {
  const { data: session, status } = useSession();
  const [ethnicSearch, setEthnicSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { isLandingPage = false, hasSearchBar = false, hasSearchBarMobile = false } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSignup, setIsOpenSignup] = useState(false);
  const [isOpenSignin, setIsOpenSignin] = useState(false);
  const [navBg, setNavBg] = useState(false);
  const searchParams = useSearchParams();
  const LOGIN_BACK_KEY = 'loginBackMessage';
  const LOGIN_KEY = 'logInMessage';
  const LOGOUT_KEY = 'logOutMessage';
  const WELCOME_KEY = 'welcomeMessage';

  const handleLogout = async () => {
    removeAllCookies();
    localStorage.clear();
    localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);

    await signOut({ redirect: true, callbackUrl: HOME });
  };

  const changeNavBg = () => {
    window.scrollY >= 200 ? setNavBg(true) : setNavBg(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (ethnicSearch) {
      params.set('ethnic', encodeURIComponent(ethnicSearch));
    }
    if (addressSearch) {
      params.set('address',(addressSearch));
    }
    router.push(PAGE(RESTAURANTS, [], params.toString()));
  };

  useEffect(() => {
    const ethnic = searchParams ? searchParams.get("ethnic") : null;
    if (ethnic) {
      setEthnicSearch(decodeURIComponent(ethnic));
    } 
    // else {
    //   setEthnicSearch("");
    // }

    const address = searchParams ? searchParams.get("address") : null;
    setAddressSearch(address ? decodeURIComponent(address) : "");
  }, [searchParams]);
  
  useEffect(() => {
    const loginMessage = localStorage?.getItem(LOGIN_BACK_KEY) ?? "";
    const logOutMessage = localStorage?.getItem(LOGOUT_KEY) ?? "";
    const googleMessage = Cookies.get(LOGIN_KEY) ?? "";
    const welcomeMessage = localStorage?.getItem(WELCOME_KEY) ?? "";

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

  // Check for onboarding pages
  const isOnboardingPage = pathname?.includes('onboarding');

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
      <nav
        className={`navbar !z-[1000] ${isLandingPage
          ? navBg ? 'bg-white border-b border-[#CACACA]' : "bg-transparent"
          : "bg-white border-b border-[#CACACA]"
          }`}
      >
        <div
          className={`navbar__container py-0 flex flex-col justify-center ${!isLandingPage ? "sm:py-2" : "sm:py-3"
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
                    className="h-6 w-6"
                    stroke={`${isLandingPage && !navBg ? '#FCFCFC' : '#31343F'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    {/* {isOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : ( */}
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
                  <h1
                    className={`${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                      }`}
                  >
                    TastyPlates
                  </h1>
                </Link>
              </div>
              <div className="navbar__menu justify-start">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {(navBg && isLandingPage) || hasSearchBar && (
              <div className="hidden md:block">
                <div className="flex gap-2.5 items-center border border-[#E5E5E5] pl-6 pr-4 py-2 !rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
                  <div className="hero__search-restaurant !bg-transparent">
                    <input
                      type="text"
                      placeholder="Search Ethnic"
                      className="hero__search-input"
                      value={ethnicSearch}
                      onChange={(e) => setEthnicSearch(e.target.value)}
                    />
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !bg-transparent">
                    {/* <FiMapPin className="hero__search-icon" /> */}
                    <input
                      type="text"
                      placeholder="Search location"
                      className="hero__search-input"
                      value={addressSearch} // Set value to addressSearch
                      onChange={(e) => setAddressSearch(e.target.value)}
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
                    onClick={handleSearch} // Add onClick handler here
                  // disabled={!location || !cuisine}
                  >
                    <FiSearch className="hero__search-icon !h-5 !w-5 stroke-white" />
                  </button>
                </div>
              </div>
            )}
            <div className="navbar__auth">
              {(status !== sessionStatus.authenticated && isOnboardingPage) ? <div className="w-11 h-11 rounded-full overflow-hidden">
                <Image
                  src={DEFAULT_USER_ICON}
                  alt={"Profile"}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover rounded-full"
                />
              </div> : (status !== sessionStatus.authenticated) ? (
                <>
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
                      <button className="bg-[#FCFCFC66]/40 rounded-[50px] h-11 px-6 hidden md:flex flex-row flex-nowrap items-center gap-2 text-white">
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
                      <div className={`bg-white flex flex-col rounded-2xl text-[#494D5D] ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
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
          {hasSearchBarMobile && (
            <div className="mb-4 md:hidden">
              <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
                <div className="hero__search-restaurant !bg-transparent">
                  <input
                    type="text"
                    placeholder="Start Your Search"
                    className="hero__search-input text-center"
                    value={ethnicSearch}
                    onChange={(e) => setEthnicSearch(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="hero__search-button !rounded-full h-8 w-8 text-center"
                  onClick={handleSearch} // Add onClick handler for mobile search
                // disabled={!location || !cuisine}
                >
                  <FiSearch className="hero__search-icon !h-4 !w-4 stroke-white" />
                </button>
              </div>
            </div>
          )}
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
                    <h1 className="text-[#494D5D]">TastyPlates</h1>
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
