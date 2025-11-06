"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  FiEdit3, 
  FiSearch, 
  FiHeart, 
  FiUser, 
  FiSettings, 
  FiFileText, 
  FiMapPin,
  FiLogOut
} from "react-icons/fi";
import { RESTAURANTS, PROFILE, SETTINGS, LISTING, CONTENT_GUIDELINES, HOME } from "@/constants/pages";
import { useLocation } from "@/contexts/LocationContext";
import LocationBottomSheet from "../navigation/LocationBottomSheet";
import { useState } from "react";
import { logOutSuccessfull } from "@/constants/messages";
import { LOGOUT_KEY } from "@/constants/session";
import { LOCATION_HIERARCHY } from "@/constants/location";

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
  const { data: session } = useSession();
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
    localStorage.setItem(LOGOUT_KEY, logOutSuccessfull);
    await signOut({ redirect: true, callbackUrl: HOME });
    onClose();
  };

  const renderItem = (item: SidebarItem, index: number) => {
    const isActive = item.href 
      ? pathname === item.href ||
        (item.href === RESTAURANTS && pathname?.startsWith("/restaurants")) ||
        (item.href === PROFILE && pathname?.startsWith("/profile")) ||
        (item.href === SETTINGS && pathname === SETTINGS)
      : false;

    const Icon = item.icon;
    const className = `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? "bg-[#E36B00] text-white"
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
              isActive ? "text-white" : "text-[#494D5D]"
            }`}
          />
          <span className={`flex-1 text-left ${isActive ? "text-white" : "text-[#494D5D]"}`}>{item.name}</span>
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
            isActive ? "text-white" : "text-[#494D5D]"
          }`}
        />
        <span className={isActive ? "text-white" : "text-[#494D5D]"}>{item.name}</span>
      </Link>
    );
  };

  const sidebarSections = [
    // Section 1: Write a Review (only if authenticated)
    session?.user ? [
      { name: "Write a Review", href: LISTING, icon: FiEdit3 },
    ] : [],
    // Section 2: Explore & Following
    [
      { name: "Explore", href: RESTAURANTS, icon: FiSearch },
      { name: "Following", href: "/following", icon: FiHeart },
    ],
    // Section 3: Profile & Settings
    [
      { name: "Profile", href: PROFILE, icon: FiUser },
      { name: "Settings", href: SETTINGS, icon: FiSettings },
    ],
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
    session?.user ? [
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

