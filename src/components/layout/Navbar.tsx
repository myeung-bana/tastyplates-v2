// Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
// import { useSearchParams } from 'next/navigation';
import "@/styles/components/_navbar.scss";
import "@/styles/components/_hero.scss";
import SignupModal from "../auth/SignupModal";
import SigninModal from "../auth/SigninModal";
import Image from "next/image";
import CustomPopover from "../ui/Popover/Popover";
import { PiCaretDown } from "react-icons/pi";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from 'next/navigation';
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import toast from 'react-hot-toast';
import { logOutSuccessfull } from "@/constants/messages";
import { firebaseAuthService } from "@/services/auth/firebaseAuthService";
import { sessionStatus } from "@/constants/response";
import { HOME, LISTING, LISTING_EXPLANATION, PROFILE, RESTAURANTS, SETTINGS } from "@/constants/pages";
import { PAGE } from "@/lib/utils";
import { DEFAULT_USER_ICON, TASTYPLATES_LOGO_BLACK, TASTYPLATES_LOGO_COLOUR, TASTYPLATES_LOGO_WHITE } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import PasswordUpdatedModal from "../ui/Modal/PasswordUpdatedModal";
import { LOGOUT_KEY, LOGIN_BACK_KEY, LOGIN_KEY, WELCOME_KEY, SESSION_EXPIRED_KEY, UPDATE_PASSWORD_KEY } from "@/constants/session";
import CustomModal from "../ui/Modal/Modal";
import { MdArrowBackIos } from "react-icons/md";
import NavbarSearchBar from "../navigation/NavbarSearchBar";
import LocationButton from "../navigation/LocationButton";
import MobileMenu from "./MobileMenu";
import { useProfileData } from "@/hooks/useProfileData";

// Helper function to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  
  // If it's a string, return it directly
  if (typeof profileImage === 'string') {
    return profileImage;
  }
  
  // If it's an object, extract the URL
  if (typeof profileImage === 'object') {
    // Try different possible URL fields
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  
  return null;
};

const navigationItems = [
  { name: "Explore", href: RESTAURANTS },
  { name: "Following", href: "/following" },
];

export default function Navbar(props: Record<string, unknown>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Fetch current user profile data for authenticated users
  // Only fetch if session is authenticated and has a valid ID
  const currentUserId = session?.user?.id || null;
  const shouldFetchProfile = status === 'authenticated' && !!currentUserId;
  const { userData } = useProfileData(shouldFetchProfile ? currentUserId : '');
  
  // Debug: Log session state for troubleshooting
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userId = session.user.id;
      const isUUID = userId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(userId)) : false;
      console.log('[Navbar] Session authenticated:', {
        userId: userId,
        userIdType: typeof userId,
        isUUID: isUUID,
        hasEmail: !!session.user.email,
        hasName: !!session.user.name,
        status: status
      });
    } else if (status === 'unauthenticated') {
      console.log('[Navbar] Session unauthenticated');
    }
  }, [session, status]);
  
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
    try {
      // Sign out from Firebase first
      await firebaseAuthService.signOut();
      console.log('[Navbar] Firebase sign out successful');
    } catch (error) {
      console.error('[Navbar] Firebase sign out error:', error);
      // Continue with logout even if Firebase signout fails
    }
    
    // Clear all cookies and localStorage
    removeAllCookies();
    localStorage.clear();
    localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);

    // Sign out from NextAuth session
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

    // Clean up OAuth callback cookies after successful authentication
    const oauthFromModal = Cookies.get('oauth_from_modal');
    if (oauthFromModal === 'true' && session?.user) {
      Cookies.remove('oauth_from_modal');
      Cookies.remove('oauth_callback_url');
    }

    window.addEventListener("scroll", changeNavBg);
    return () => {
      window.removeEventListener("scroll", changeNavBg);
    };
  }, [session]);

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
        className={`navbar !z-[1000] hidden md:block font-neusans ${isLandingPage
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
                    className="h-4 md:h-5 w-auto object-contain" // Reduced from h-5 md:h-6
                    height={20} // Reduced from 24
                    width={100} // Reduced from 120
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
              
              {/* Navigation Menu - Always show Explore, Following only for authenticated users */}
              <div className="navbar__menu justify-start">
                {navigationItems.map((item) => {
                  // Show all items if authenticated, only Explore if not authenticated
                  // Use both status and session.user for more robust check
                  const isAuthenticated = status === sessionStatus.authenticated && !!session?.user;
                  if (!isAuthenticated && item.name !== "Explore") return null;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`navbar__nav-item ${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="navbar__auth">
              {/* Use more robust authentication check */}
              {(() => {
                const isAuthenticated = status === sessionStatus.authenticated && !!session?.user;
                if (!isAuthenticated && validatePage) {
                  return (
                    <div className="w-9 h-9 rounded-full overflow-hidden">
                      <Image
                        src={DEFAULT_USER_ICON}
                        alt={"Profile"}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  );
                }
                if (!isAuthenticated) {
                  return (
                <>
                  {/* Location Button - Left of Log In */}
                  <LocationButton isTransparent={isLandingPage && !navBg} />
                  
                  <button
                    onClick={() => {
                      setIsOpenSignup(false)
                      setIsOpenSignin(true)
                    }}
                    className={`navbar__button navbar__button--primary hover:rounded-[50px] border-none ${isLandingPage && !navBg ? '!bg-transparent !text-white' : ''} ${!isLandingPage ? '!bg-transparent' : ''} hidden md:block`}
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
                  );
                }
                // User is authenticated - show profile menu
                return (
                <>
                  {/* Location Button - Left of Review */}
                  <LocationButton isTransparent={isLandingPage && !navBg} />
                  
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <button className="bg-[#FCFCFC66]/40 rounded-[50px] text-xs h-9 px-4 hidden md:flex flex-row flex-nowrap items-center gap-1.5 text-white backdrop-blur-sm">
                        <span
                          className={`${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                            } text-center font-neusans`}
                        >
                          Review
                        </span>
                        <PiCaretDown
                          className={`${isLandingPage && !navBg ? "fill-white" : "fill-[#494D5D]"
                            } size-4`}
                        />
                      </button>
                    }
                    content={
                      <div className={`bg-white text-sm flex flex-col rounded-2xl text-[#494D5D] ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
                        <Link href={LISTING} className='font-neusans text-left pl-3.5 pr-12 py-3.5'>
                          Write a Review
                        </Link>
                        <Link href={LISTING_EXPLANATION} className='font-neusans text-left pl-3.5 pr-12 py-3.5'>
                          Add a Listing
                        </Link>
                      </div>
                    }
                  />
                  <CustomPopover
                    align="bottom-end"
                    trigger={
                      <div className="w-9 h-9 rounded-full overflow-hidden">
                        <FallbackImage
                          src={
                            // Priority order: profile_image from API > session.user.image > default
                            getProfileImageUrl(userData?.profile_image) ||
                            (session?.user?.image as string) ||
                            DEFAULT_USER_ICON
                          }
                          alt={session?.user?.name || "Profile"}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover rounded-full"
                          type={FallbackImageType.Icon}
                        />
                      </div>
                    }
                    content={
                      <div className={`bg-white text-sm flex flex-col rounded-2xl text-[#494D5D] ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
                        <Link 
                          href={session?.user?.id ? `/profile/${session.user.id}` : PROFILE} 
                          className='font-neusans text-left pl-3.5 pr-12 py-3.5'
                        >
                          My Profile
                        </Link>
                        <Link href={SETTINGS} className='font-neusans text-left pl-3.5 pr-12 py-3.5'>
                          Settings
                        </Link>
                        <div className={`border-t ${!isLandingPage || navBg ? 'border-[#CACACA]' : 'border-gray-200'} w-full`} />
                        <button
                          onClick={handleLogout}
                          className='font-neusans text-left pl-3.5 pr-12 py-3.5'
                        >
                          Log Out
                        </button>
                      </div>
                    }
                  />
                </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <MobileMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          status={status}
          onOpenSignin={() => setIsOpenSignin(true)}
          onOpenSignup={() => setIsOpenSignup(true)}
        />
      </nav>
    </>
  );
}
