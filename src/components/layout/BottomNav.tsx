"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiCompass, 
  FiUser,
  FiPlusSquare
} from "react-icons/fi";
import { HOME, RESTAURANTS, PROFILE, TASTYSTUDIO_ADD_REVIEW } from "@/constants/pages";
import { useAuthModal } from "../auth/AuthModalWrapper";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useHaptic } from "@/hooks/useHaptic";

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, nhostUser, loading, authReady } = useNhostSession();
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { showSignin } = useAuthModal();
  const { trigger: haptic } = useHaptic();

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

  /** Canonical profile path when signed in (matches MobileMenu). */
  const profileHref = useMemo(() => {
    if (user?.username) return `/profile/${encodeURIComponent(user.username)}`;
    if (user?.user_id) return `/profile/${encodeURIComponent(user.user_id)}`;
    if (nhostUser?.id) return `/profile/${encodeURIComponent(nhostUser.id)}`;
    return PROFILE;
  }, [user?.username, user?.user_id, nhostUser?.id]);

  // Handle click for items that require auth (Nhost session, not legacy Firebase profile)
  const handleAuthRequiredClick = (e: React.MouseEvent) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authReady) {
      e.preventDefault();
      haptic("warning");
      showSignin();
      return;
    }
    haptic("selection");
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
      name: "Add Review",
      href: TASTYSTUDIO_ADD_REVIEW,
      icon: FiPlusSquare,
      activePaths: [TASTYSTUDIO_ADD_REVIEW, "/tastystudio/add-review"],
      requiresAuth: true,
      isCenter: true,
    },
    {
      name: "Profile",
      href: PROFILE,
      icon: FiUser,
      activePaths: [PROFILE, "/profile/"],
      requiresAuth: true,
      showWhenUnauthenticated: true,
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
    <nav className={`bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[max(10px,calc(env(safe-area-inset-bottom)+10px))] transition-transform duration-300 ease-in-out font-neusans ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems
          .filter(
            (item) =>
              !item.requiresAuth ||
              authReady ||
              item.showWhenUnauthenticated
          )
          .map((item) => {
          const Icon = item.icon;
          const active = isActive(item.activePaths);
          
          const href =
            item.href === PROFILE && authReady ? profileHref : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              onClick={item.requiresAuth ? handleAuthRequiredClick : () => haptic("selection")}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors duration-200 ${
                active 
                  ? 'text-[#ff7c0a]' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <Icon 
                className={`w-6 h-6 mb-1 transition-colors duration-200 ${
                  active ? 'text-[#ff7c0a]' : 'text-gray-600'
                }`} 
              />
              {/* Active indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#ff7c0a] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;