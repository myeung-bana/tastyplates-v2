"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FiHome, 
  FiCompass, 
  FiUser,
  FiPlusSquare
} from "react-icons/fi";
import { HOME, RESTAURANTS, PROFILE, LISTING_STEP_ONE } from "@/constants/pages";
import { useAuthModal } from "../auth/AuthModalWrapper";
import { useProfileData } from "@/hooks/useProfileData";

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { showSignin } = useAuthModal();
  
  // Fetch current user profile data for authenticated users
  // Use session.user.id directly (can be UUID string or numeric ID)
  const currentUserId = session?.user?.id || null;
  const { userData } = useProfileData(currentUserId || '');

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll behavior
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const footerThreshold = documentHeight - windowHeight - 100; // 100px before footer
      
      // Always show when near footer
      if (currentScrollY >= footerThreshold) {
        setIsVisible(false);
        return;
      }
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);

  // Handle profile click for non-authenticated users
  const handleProfileClick = (e: React.MouseEvent) => {
    if (!session?.user) {
      e.preventDefault();
      showSignin();
    }
  };

  // Handle click for items that require auth
  const handleAuthRequiredClick = (e: React.MouseEvent, item: any) => {
    if (!session?.user) {
      e.preventDefault();
      showSignin();
    }
  };

  const navItems = [
    {
      name: "Home",
      href: HOME,
      icon: FiHome,
      activePaths: [HOME],
    },
    {
      name: "Explore",
      href: RESTAURANTS,
      icon: FiCompass,
      activePaths: [RESTAURANTS, "/restaurants/"],
    },
    {
      name: "Add Listing",
      href: LISTING_STEP_ONE,
      icon: FiPlusSquare,
      activePaths: [LISTING_STEP_ONE, "/listing/"],
      requiresAuth: true,
      isCenter: true,
    },
    {
      name: "Profile",
      href: PROFILE,
      icon: FiUser,
      activePaths: [PROFILE, "/profile/"],
      requiresAuth: true,
      isAvatar: true,
      showWhenUnauthenticated: true, // Always show profile button
    },
  ];

  // Check if current path is active
  const isActive = (activePaths: string[]) => {
    if (!pathname) return false;
    return activePaths.some(path => {
      if (path.endsWith('/')) {
        return pathname.startsWith(path);
      }
      return pathname === path;
    });
  };

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb transition-transform duration-300 ease-in-out font-neusans ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems
          .filter(item => !item.requiresAuth || session?.user || item.showWhenUnauthenticated)
          .map((item) => {
          const Icon = item.icon;
          const active = isActive(item.activePaths);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={item.requiresAuth ? (e) => handleAuthRequiredClick(e, item) : undefined}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors duration-200 ${
                active 
                  ? 'text-[#E36B00]' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              {item.isAvatar && (userData?.userProfile?.profileImage?.node?.mediaItemUrl || 
                                 userData?.profile_image || 
                                 session?.user?.image) ? (
                <img
                  src={
                    (userData?.userProfile?.profileImage?.node?.mediaItemUrl as string) ||
                    (userData?.profile_image as string) ||
                    (session?.user?.image as string)
                  }
                  alt="Profile"
                  className="w-6 h-6 mb-1 rounded-full object-cover"
                />
              ) : (
                <Icon 
                  className={`w-6 h-6 mb-1 transition-colors duration-200 ${
                    active ? 'text-[#E36B00]' : 'text-gray-600'
                  }`} 
                />
              )}
              {/* Active indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#E36B00] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;