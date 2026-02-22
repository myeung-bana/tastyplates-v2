// Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
// import { useSearchParams } from 'next/navigation';
import "@/styles/components/_navbar.scss";
import "@/styles/components/_hero.scss";
import SignupModal from "../auth/SignupModal";
import SigninModal from "../auth/SigninModal";
import Image from "next/image";
import CustomPopover from "../ui/Popover/Popover";
import { PiCaretDown } from "react-icons/pi";
import { useRouter, usePathname } from 'next/navigation';
import { removeAllCookies } from "@/utils/removeAllCookies";
import Cookies from "js-cookie";
import toast from 'react-hot-toast';
import { logOutSuccessfull } from "@/constants/messages";
import { nhostAuthService } from "@/services/auth/nhostAuthService";
import { HOME, PROFILE, RESTAURANTS, SETTINGS } from "@/constants/pages";
import { DEFAULT_USER_ICON, TASTYPLATES_LOGO_BLACK, TASTYPLATES_LOGO_COLOUR, TASTYPLATES_LOGO_WHITE } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import PasswordUpdatedModal from "../ui/Modal/PasswordUpdatedModal";
import { LOGOUT_KEY, LOGIN_BACK_KEY, WELCOME_KEY, SESSION_EXPIRED_KEY, UPDATE_PASSWORD_KEY } from "@/constants/session";
import CustomModal from "../ui/Modal/Modal";
import { MdArrowBackIos } from "react-icons/md";
import NavbarSearchBar from "../navigation/NavbarSearchBar";
import LocationButton from "../navigation/LocationButton";
import MobileMenu from "./MobileMenu";
import { useProfileData } from "@/hooks/useProfileData";
import { useNhostSession } from "@/hooks/useNhostSession";

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
  const { user, nhostUser, loading, authReady } = useNhostSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Fetch profile as soon as we have a session (nhostUser.id); don't wait for profile in hook
  const currentUserId = user?.user_id || nhostUser?.id || null;
  const shouldFetchProfile = authReady && !!currentUserId;
  const { userData } = useProfileData(shouldFetchProfile ? currentUserId : '');
  
  // Debug: Log session state for troubleshooting
  useEffect(() => {
    if (authReady && nhostUser) {
      console.log('[Navbar] Nhost session ready:', {
        userId: user?.user_id ?? nhostUser.id,
        email: nhostUser.email,
        displayName: nhostUser.displayName,
        avatarUrl: nhostUser.avatarUrl,
      });
    } else if (!loading && !authReady) {
      console.log('[Navbar] Nhost session unauthenticated');
    }
  }, [user, nhostUser, loading, authReady]);
  
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
  
  // Track previous auth state to detect login/logout
  const prevAuthState = useRef<boolean | null>(null);

  const handleLogout = async () => {
    try {
      // Set logout message BEFORE clearing (will be shown by useEffect)
      localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);
      
      // Sign out from Nhost
      await nhostAuthService.signOut();
      console.log('[Navbar] Nhost sign out successful');
      
      // Clear data but preserve logout message
      const logoutMsg = localStorage.getItem(LOGOUT_KEY);
      removeAllCookies();
      localStorage.clear();
      if (logoutMsg) {
        localStorage.setItem(LOGOUT_KEY, logoutMsg);
      }

      // Redirect to home
      router.push(HOME);
      router.refresh();
    } catch (error) {
      console.error('[Navbar] Nhost sign out error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const changeNavBg = () => {
    setNavBg(window.scrollY > 64);
  };


  // Simplified toast notification system for Nhost authentication
  // Use full profile (user) for "just logged in" so we only toast when an explicit message was set
  useEffect(() => {
    if (loading) return;
    const isAuthenticated = !loading && !!user && !!nhostUser;
    
    // Detect auth state changes
    if (prevAuthState.current !== null) {
      // User just logged in
      if (!prevAuthState.current && isAuthenticated) {
        const welcomeMessage = localStorage.getItem(WELCOME_KEY);
        if (welcomeMessage) {
          toast.success(welcomeMessage, { duration: 3000 });
          localStorage.removeItem(WELCOME_KEY);
        } else {
          const loginMessage = localStorage.getItem(LOGIN_BACK_KEY);
          if (loginMessage) {
            toast.success(loginMessage, { duration: 3000 });
            localStorage.removeItem(LOGIN_BACK_KEY);
          }
          // No generic "Welcome back!" – only show toast when login/registration set a message
        }
      }
      
      // User just logged out
      if (prevAuthState.current && !isAuthenticated) {
        const logoutMessage = localStorage.getItem(LOGOUT_KEY);
        if (logoutMessage) {
          toast.success(logoutMessage, { duration: 3000 });
          localStorage.removeItem(LOGOUT_KEY);
        }
      }
    }
    
    // Update tracked state
    prevAuthState.current = isAuthenticated;
    
    // Handle session expired
    const sessionExpiredMessage = localStorage.getItem(SESSION_EXPIRED_KEY);
    if (sessionExpiredMessage) {
      toast.error(sessionExpiredMessage, { duration: 3000 });
      localStorage.removeItem(SESSION_EXPIRED_KEY);
    }
    
    // Handle password update modal
    const openPasswordUpdateModal = localStorage.getItem(UPDATE_PASSWORD_KEY);
    if (openPasswordUpdateModal) {
      setIsOpenPasswordUpdate(true);
      localStorage.removeItem(UPDATE_PASSWORD_KEY);
    }
  }, [user, nhostUser, loading]);

  useEffect(() => {
    window.addEventListener("scroll", changeNavBg);
    return () => {
      window.removeEventListener("scroll", changeNavBg);
    };
  }, []);

  useEffect(() => {
    const googleErrorType = Cookies.get('googleErrorType');
    if (googleErrorType == 'signup') {
      setIsOpenSignup(true);
      // Clean up the cookie after using it
      Cookies.remove('googleErrorType');
    } else if (googleErrorType == 'login') {
      setIsOpenSignin(true);
      // Clean up the cookie after using it
      Cookies.remove('googleErrorType');
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
                  isAuthenticated={authReady} 
                  isTransparent={isLandingPage && !navBg}
                />
              </div>
              
              {/* Navigation Menu - Always show Explore, Following only for authenticated users */}
              <div className="navbar__menu justify-start">
                {navigationItems.map((item) => {
                  // Show all items when session is ready, only Explore when not
                  if (!authReady && item.name !== "Explore") return null;
                  
                  const isActive = pathname === item.href || (item.href !== RESTAURANTS && pathname?.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`navbar__nav-item ${isActive ? 'navbar__nav-item--active' : ''} ${isLandingPage && !navBg ? "!text-white" : "text-[#494D5D]"
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="navbar__auth">
              {/* Show logged-in UI as soon as session is ready (authReady), before profile loads */}
              {(() => {
                if (!authReady && validatePage) {
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
                if (!authReady) {
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
                          Write a Review
                        </span>
                        <PiCaretDown
                          className={`${isLandingPage && !navBg ? "fill-white" : "fill-[#494D5D]"
                            } size-4`}
                        />
                      </button>
                    }
                    content={
                      <div className={`bg-white text-sm flex flex-col rounded-2xl text-[#494D5D] min-w-[200px] overflow-hidden ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
                        <Link href="/tastystudio/dashboard" className='font-neusans text-left pl-3.5 pr-12 py-3.5 hover:bg-[#ff7c0a]/10 transition-colors first:rounded-t-2xl'>
                          Tasty Studio
                        </Link>
                        <Link href="/tastystudio/add-review" className='font-neusans text-left pl-3.5 pr-12 py-3.5 hover:bg-[#ff7c0a]/10 transition-colors last:rounded-b-2xl'>
                          Write a Review
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
                            // Priority order: Nhost avatarUrl > custom profile_image > default
                            (nhostUser?.avatarUrl && nhostUser.avatarUrl.trim() !== '') ? nhostUser.avatarUrl :
                            getProfileImageUrl(userData?.profile_image) ||
                            DEFAULT_USER_ICON
                          }
                          alt={nhostUser?.displayName || user?.username || "Profile"}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover rounded-full"
                          type={FallbackImageType.Icon}
                        />
                      </div>
                    }
                    content={
                      <div className={`bg-white text-sm flex flex-col rounded-2xl text-[#494D5D] min-w-[200px] overflow-hidden ${!isLandingPage || navBg ? 'border border-[#CACACA]' : 'border-none'}`}>
                        <Link 
                          href={user?.username ? `/profile/${encodeURIComponent(user.username)}` : (user?.user_id ? `/profile/${user.user_id}` : (nhostUser?.id ? `/profile/${nhostUser.id}` : PROFILE))} 
                          className='font-neusans text-left pl-3.5 pr-12 py-3.5 hover:bg-[#ff7c0a]/10 transition-colors first:rounded-t-2xl'
                        >
                          My Profile
                        </Link>
                        <Link href={SETTINGS} className='font-neusans text-left pl-3.5 pr-12 py-3.5 hover:bg-[#ff7c0a]/10 transition-colors'>
                          Settings
                        </Link>
                        <div className={`border-t ${!isLandingPage || navBg ? 'border-[#CACACA]' : 'border-gray-200'} w-full`} />
                        <button
                          onClick={handleLogout}
                          className='font-neusans text-left pl-3.5 pr-12 py-3.5 hover:bg-[#ff7c0a]/10 transition-colors last:rounded-b-2xl'
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
          isAuthenticated={authReady}
          user={user}
          nhostUser={nhostUser}
          onOpenSignin={() => setIsOpenSignin(true)}
          onOpenSignup={() => setIsOpenSignup(true)}
        />
      </nav>
    </>
  );
}
