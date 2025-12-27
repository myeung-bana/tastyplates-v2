"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useRouter } from "next/navigation";
import { 
  FiEdit3, 
  FiSearch, 
  FiHeart, 
  FiUser, 
  FiSettings, 
  FiFileText, 
  FiMapPin,
  FiLogOut,
  FiLayout
} from "react-icons/fi";
import { RESTAURANTS, PROFILE, SETTINGS, LISTING, CONTENT_GUIDELINES, HOME, TASTYSTUDIO_DASHBOARD } from "@/constants/pages";
import { useLocation } from "@/contexts/LocationContext";
import LocationBottomSheet from "../navigation/LocationBottomSheet";
import { useState } from "react";
import { logOutSuccessfull } from "@/constants/messages";
import { LOGOUT_KEY } from "@/constants/session";
import { LOCATION_HIERARCHY } from "@/constants/location";
import { firebaseAuthService } from "@/services/auth/firebaseAuthService";
import { removeAllCookies } from "@/utils/removeAllCookies";

interface SidebarHeaderProps {
  onClose: () => void;
}

interface SidebarItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  isButton?: boolean;
}

export default function SidebarHeader({ onClose }: SidebarHeaderProps) {
  const pathname = usePathname();
  const { user } = useFirebaseSession();
  const router = useRouter();
  const { selectedLocation } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Helper function to get parent country's short code for cities
  const getParentCountryCode = (cityKey: string): string => {
    for (const country of LOCATION_HIERARCHY.countries) {
      const city = country.cities.find((c: { key: string }) => c.key === cityKey);
      if (city) {
        return country.shortLabel;
      }
    }
    return '';
  };

  // Get display text for location
  const getLocationDisplayText = () => {
    if (selectedLocation.type === 'city' && 
        (selectedLocation.key === 'hong_kong_island' || 
         selectedLocation.key === 'kowloon' || 
         selectedLocation.key === 'new_territories')) {
      return 'Hong Kong, HK';
    }
    
    if (selectedLocation.type === 'city') {
      const countryCode = getParentCountryCode(selectedLocation.key);
      return `${selectedLocation.label}, ${countryCode}`;
    } else if (selectedLocation.type === 'country') {
      return `${selectedLocation.label}, ${selectedLocation.shortLabel}`;
    }
    return selectedLocation.label;
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await firebaseAuthService.signOut();
      console.log('[SidebarHeader] Firebase sign out successful');
    } catch (error) {
      console.error('[SidebarHeader] Firebase sign out error:', error);
      // Continue with logout even if Firebase signout fails
    }
    
    // Clear all cookies and localStorage
    removeAllCookies();
    localStorage.clear();
    localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);

    // Redirect to home
    router.push(HOME);
    router.refresh();
    onClose();
  };

  const renderItem = (item: SidebarItem, index: number) => {
    const isActive = item.href 
      ? pathname === item.href ||
        (item.href === RESTAURANTS && pathname?.startsWith("/restaurants")) ||
        (item.href === PROFILE && pathname?.startsWith("/profile")) ||
        (item.href === SETTINGS && pathname === SETTINGS) ||
        (item.href === TASTYSTUDIO_DASHBOARD && pathname?.startsWith("/tastystudio"))
      : false;

    // "Write a Review" should always have primary orange styling
    const isWriteReview = item.name === "Write a Review";
    const shouldUsePrimaryStyle = isActive || isWriteReview;

    const Icon = item.icon;
    const className = `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      shouldUsePrimaryStyle
        ? "bg-[#ff7c0a] text-white"
        : "bg-gray-50 text-[#494D5D] hover:bg-gray-100 active:bg-gray-200"
    }`;

    if (item.isButton || item.onClick) {
      return (
        <button
          key={index}
          onClick={() => {
            if (item.onClick) item.onClick();
            if (!item.isButton) onClose();
          }}
          className={className}
        >
          <Icon
            className={`w-4 h-4 flex-shrink-0 ${
              shouldUsePrimaryStyle ? "text-white" : "text-[#494D5D]"
            }`}
          />
          <span className={`flex-1 text-left ${shouldUsePrimaryStyle ? "text-white" : "text-[#494D5D]"}`}>{item.name}</span>
          {item.name === "Region" && (
            <span className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>{getLocationDisplayText()}</span>
          )}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href || "#"}
        onClick={onClose}
        className={className}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            shouldUsePrimaryStyle ? "text-white" : "text-[#494D5D]"
          }`}
        />
        <span className={shouldUsePrimaryStyle ? "text-white" : "text-[#494D5D]"}>{item.name}</span>
      </Link>
    );
  };

  const sidebarSections = [
    // Section 1: Tasty Studio (only if authenticated)
    user ? [
      { name: "Tasty Studio", href: TASTYSTUDIO_DASHBOARD, icon: FiEdit3 },
    ] : [],
    // Section 3: Explore & Following (Following only for authenticated users)
    [
      { name: "Explore", href: RESTAURANTS, icon: FiSearch },
      ...(user ? [{ name: "Following", href: "/following", icon: FiHeart }] : []),
    ],
    // Section 3: Profile & Settings (only for authenticated users)
    user ? [
      { name: "Profile", href: PROFILE, icon: FiUser },
      { name: "Settings", href: SETTINGS, icon: FiSettings },
    ] : [],
    // Section 4: Content Guidelines
    [
      { name: "Content Guidelines", href: CONTENT_GUIDELINES, icon: FiFileText },
    ],
    // Section 5: Region
    [
      { 
        name: "Region", 
        icon: FiMapPin, 
        isButton: true,
        onClick: () => setShowLocationModal(true)
      },
    ],
    // Section 6: Log out (only if authenticated)
    user ? [
      { 
        name: "Log out", 
        icon: FiLogOut, 
        isButton: true,
        onClick: handleLogout
      },
    ] : [],
  ];

  return (
    <>
      <nav className="flex-1 px-4 py-6 font-neusans">
        <div className="space-y-4">
          {sidebarSections.map((section, sectionIndex) => {
            if (section.length === 0) return null;
            return (
              <div key={sectionIndex} className="space-y-2">
                {section.map((item, itemIndex) => (
                  <div key={itemIndex} className="w-full">
                    {renderItem(item, itemIndex)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </nav>

      <LocationBottomSheet 
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          onClose();
        }}
      />
    </>
  );
}

