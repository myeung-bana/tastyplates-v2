"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNhostSession } from "@/hooks/useNhostSession";
import { FiSearch, FiMenu, FiMapPin, FiChevronDown, FiEdit } from "react-icons/fi";
import { HOME } from "@/constants/pages";
import { TASTYPLATES_LOGO_COLOUR } from "@/constants/images";
import Image from "next/image";
import SidebarHeader from "./SidebarHeader";
import SearchMenu from "./SearchMenu";
import LocationBottomSheet from "../navigation/LocationBottomSheet";
import { useLocation } from "@/contexts/LocationContext";
import { useHaptic } from "@/hooks/useHaptic";

type TopBarVariant = "default" | "explore" | "profile";

function getVariant(pathname: string | null): TopBarVariant {
  if (!pathname) return "default";
  if (pathname === "/restaurants" || pathname.startsWith("/restaurants/")) return "explore";
  if (pathname.startsWith("/profile/")) return "profile";
  return "default";
}

interface MobileTopBarProps {
  onSearchClick?: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onSearchClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, nhostUser } = useNhostSession();
  const { selectedLocation } = useLocation();
  const { trigger: haptic } = useHaptic();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const variant = getVariant(pathname);

  // Extract profile username from URL and determine if own profile
  const profileUsername = useMemo(() => {
    if (!pathname || !pathname.startsWith("/profile/")) return null;
    const segments = pathname.split("/");
    return segments[2] ? decodeURIComponent(segments[2]) : null;
  }, [pathname]);

  const isOwnProfile = useMemo(() => {
    if (!profileUsername || !user) return false;
    if (user.username && user.username === profileUsername) return true;
    if (user.user_id && String(user.user_id) === profileUsername) return true;
    if (nhostUser?.id && nhostUser.id === profileUsername) return true;
    return false;
  }, [profileUsername, user, nhostUser]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isProfileDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    haptic("light");
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleSearchMenu = () => {
    haptic("light");
    setIsSearchMenuOpen(!isSearchMenuOpen);
  };

  const closeSearchMenu = () => setIsSearchMenuOpen(false);

  const openLocationSheet = () => {
    haptic("light");
    setIsLocationSheetOpen(true);
  };

  const toggleProfileDropdown = () => {
    haptic("light");
    setIsProfileDropdownOpen((prev) => !prev);
  };

  /* ─── Left slot renderers ─── */

  const renderDefaultLeft = () => (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 transition-colors"
      aria-label="Open menu"
    >
      <FiMenu className="w-5 h-5" />
    </button>
  );

  const renderExploreLeft = () => (
    <button
      onClick={openLocationSheet}
      className="flex items-center gap-1.5 text-gray-900 active:opacity-70 transition-opacity min-w-0"
      aria-label="Change location"
    >
      <FiMapPin className="w-4 h-4 text-[#ff7c0a] shrink-0" />
      <span className="text-[18px] !font-medium truncate max-w-[180px]">
        {selectedLocation.label}
      </span>
      <FiChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    </button>
  );

  const renderProfileLeft = () => (
    <div ref={profileDropdownRef} className="relative min-w-0">
      {isOwnProfile ? (
        <button
          onClick={toggleProfileDropdown}
          className="flex items-center gap-1 text-gray-900 active:opacity-70 transition-opacity min-w-0"
          aria-label="Profile options"
        >
          <span className="text-[18px] !font-medium truncate max-w-[200px]">
            {profileUsername}
          </span>
          <FiChevronDown
            className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
              isProfileDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <span className="text-[18px] !font-medium text-gray-900 truncate max-w-[200px] block">
          {profileUsername}
        </span>
      )}

      {/* Edit Profile dropdown */}
      {isProfileDropdownOpen && isOwnProfile && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[70] min-w-[160px]">
          <button
            onClick={() => {
              haptic("selection");
              setIsProfileDropdownOpen(false);
              router.push("/settings/account-security/profile");
            }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <FiEdit className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Edit Profile</span>
          </button>
        </div>
      )}
    </div>
  );

  /* ─── Center slot ─── */

  const renderCenter = () => {
    if (variant !== "default") return <div className="flex-1" />;
    return (
      <div className="flex-1 flex justify-center">
        <Link href={HOME} className="flex items-center">
          <Image
            src={TASTYPLATES_LOGO_COLOUR}
            className="h-5 w-auto object-contain"
            height={20}
            width={100}
            alt="TastyPlates Logo"
          />
        </Link>
      </div>
    );
  };

  return (
    <>
      <div
        className="mobile-top-bar md:hidden fixed left-0 right-0 z-50 bg-white border-b border-gray-200 font-neusans"
        style={{ top: "var(--pwa-banner-height, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 h-14">
          {/* Left slot — variant-dependent */}
          {variant === "default" && renderDefaultLeft()}
          {variant === "explore" && renderExploreLeft()}
          {variant === "profile" && renderProfileLeft()}

          {/* Center slot — logo only on default */}
          {renderCenter()}

          {/* Right slot — always search */}
          <button
            onClick={toggleSearchMenu}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 transition-colors shrink-0"
            aria-label="Search"
          >
            <FiSearch className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Left Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black bg-opacity-50"
          onClick={closeSidebar}
        />
      )}

      {/* Left Sidebar Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 z-[60] w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={closeSidebar} />
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              TastyPlates v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Search Menu */}
      <SearchMenu isOpen={isSearchMenuOpen} onClose={closeSearchMenu} />

      {/* Location Bottom Sheet (explore variant) */}
      <LocationBottomSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
      />
    </>
  );
};

export default MobileTopBar;
