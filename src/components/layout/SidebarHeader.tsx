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
  FiLogOut,
  FiLayout
} from "react-icons/fi";
import { RESTAURANTS, PROFILE, SETTINGS, LISTING, CONTENT_GUIDELINES, HOME, TASTYSTUDIO_DASHBOARD } from "@/constants/pages";
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
    // Section 5: Log out (only if authenticated)
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
  );
}

