"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "@/styles/components/_navbar.scss";
import "@/styles/components/_hero.scss";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { FiSearch } from "react-icons/fi";
import Image from "next/image";
import CustomPopover from "./ui/Popover/Popover";
import { FaCaretDown } from "react-icons/fa";
import { PiCaretDown } from "react-icons/pi";

const navigationItems = [
  { name: "Restaurant", href: "/restaurants" },
  // { name: "Dashboard", href: "/dashboard" },
  // { name: "Submit Listing", href: "/submit-restaurant" },
];

export default function Navbar(props: any) {
  const { isLandingPage = false, hasSearchBar = false } = props;
  console.log(isLandingPage, "props");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSignup, setIsOpenSignup] = useState(false);
  const [isOpenSignin, setIsOpenSignin] = useState(false);
  const [navBg, setNavBg] = useState(false);
  let isSignedIn = true;

  const onCloseSignup = () => setIsOpenSignup(false);

  const changeNavBg = () => {
    window.scrollY >= 800 ? setNavBg(true) : setNavBg(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", changeNavBg);
    return () => {
      window.removeEventListener("scroll", changeNavBg);
    };
  }, []);

  return (
    <>
      <SignupModal isOpen={isOpenSignup} onClose={onCloseSignup} />
      <SigninModal
        isOpen={isOpenSignin}
        onClose={() => setIsOpenSignin(false)}
      />
      <nav
        className={`navbar backdrop-blur-sm ${
          isLandingPage
            ? "bg-transparent"
            : "bg-white border-b border-[#CACACA]"
        }`}
      >
        <div
          className={`navbar__container py-0 flex flex-col justify-center ${
            !isLandingPage ? "sm:py-2" : "sm:py-3"
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
                    stroke={`${isLandingPage ? '#FCFCFC' : '#31343F'}`}
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
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <h1
                    className={`${
                      isLandingPage ? "!text-white" : "text-[#494D5D]"
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
                    className={`${
                      isLandingPage ? "!text-white" : "text-[#494D5D]"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            {hasSearchBar && (
              <div className="hidden md:block">
                <div className="flex gap-2.5 items-center border border-[#E5E5E5] pl-6 pr-4 py-2 !rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
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
                    className="rounded-full size-8 p-2 text-center !bg-[#E36B00]"
                    // disabled={!location || !cuisine}
                  >
                    <FiSearch className="size-4 stroke-white" />
                  </button>
                </div>
              </div>
            )}
            <div className="navbar__auth">
              {!isSignedIn ? (
                <>
                  <button
                    onClick={() => setIsOpenSignin(true)}
                    className="navbar__button navbar__button--primary bg-transparent hover:rounded-[50px] border-none text-white font-semibold hidden sm:block"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsOpenSignup(true)}
                    className="navbar__button navbar__button--secondary rounded-[50px] !bg-white text-[#31343F] font-semibold"
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
                          className={`${
                            isLandingPage ? "!text-white" : "text-[#494D5D]"
                          } text-center font-semibold`}
                        >
                          Review
                        </span>
                        <PiCaretDown
                          className={`${
                            isLandingPage ? "fill-white" : "fill-[#494D5D]"
                          } size-5`}
                        />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col rounded-2xl text-[#494D5D]">
                        <Link
                          href="/add-review"
                          className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                        >
                          Write a Review
                        </Link>
                        <Link
                          href="/listing/explanation"
                          className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                        >
                          Add a Listing
                        </Link>
                      </div>
                    }
                  />
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <div className="w-11 h-11">
                        <Image
                          src="/profile-icon.svg"
                          className="rounded-full"
                          width={44}
                          height={44}
                          alt="Default profile"
                        />
                      </div>
                    }
                    content={
                      <div className="bg-white flex flex-col rounded-2xl text-[#494D5D]">
                        <Link
                          href="/profile"
                          className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                        >
                          Settings
                        </Link>
                        <button className="text-left pl-3.5 pr-12 py-3.5 font-semibold">
                          Log Out
                        </button>
                      </div>
                    }
                  />
                </>
              )}
            </div>
          </div>
          {hasSearchBar && (
              <div className="mb-4 md:hidden">
                <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
                  <div className="hero__search-restaurant !bg-transparent">
                    <input
                      type="text"
                      placeholder="Start Your Search"
                      className="hero__search-input text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    className="hero__search-button !rounded-full h-8 w-8 text-center"
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
          className={`fixed top-0 left-0 z-40 w-[189px] h-screen transition-transform ${
            isOpen ? "" : "-translate-x-full"
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
                  <Link href="/" className="flex-shrink-0 flex items-center">
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
                  {!isSignedIn ? (
                    <>
                      <button
                        onClick={() => setIsOpenSignin(true)}
                        className="navbar__button navbar__button--primary bg-transparent hover:rounded-[50px] border-none text-white font-semibold hidden sm:block"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => setIsOpenSignup(true)}
                        className="navbar__button navbar__button--secondary rounded-[50px] !bg-white text-[#31343F] font-semibold"
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
                              href="/add-review"
                              className="text-left pl-3.5 pr-12 py-3.5 font-semibold"
                            >
                              Write a Review
                            </Link>
                            <Link
                              href="/listing/explanation"
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
