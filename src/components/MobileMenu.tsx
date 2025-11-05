"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSearch, FiHeart, FiUser, FiSettings } from "react-icons/fi";
import { PROFILE, RESTAURANTS, SETTINGS } from "@/constants/pages";
import { sessionStatus } from "@/constants/response";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  onOpenSignin: () => void;
  onOpenSignup: () => void;
}

const navigationItems = [
  { name: "Explore", href: RESTAURANTS, icon: FiSearch },
  { name: "Following", href: "/following", icon: FiHeart },
];

export default function MobileMenu({
  isOpen,
  onClose,
  status,
  onOpenSignin,
  onOpenSignup,
}: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] sm:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Mobile menu sidebar */}
      <aside
        id="separator-sidebar"
        className={`fixed top-0 left-0 z-[10000] w-[280px] h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? "" : "-translate-x-full"
        } sm:translate-x-0 sm:hidden`}
        aria-label="Sidebar"
      >
        <div className="h-full px-4 py-6 overflow-y-auto bg-white shadow-xl">
          {/* Close button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2 font-neusans">
            {navigationItems.map((item) => {
              // Show all items if authenticated, only Explore if not authenticated
              if (status !== sessionStatus.authenticated && item.name !== "Explore") return null;

              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ${
                    isActive
                      ? "bg-[#E36B00] text-white"
                      : "bg-gray-50 text-[#494D5D] hover:bg-gray-100 active:bg-gray-200"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-[#494D5D]"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Profile and Settings for authenticated users */}
            {status === sessionStatus.authenticated && (
              <>
                <Link
                  href={PROFILE}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ${
                    pathname === PROFILE || pathname?.startsWith("/profile/")
                      ? "bg-[#E36B00] text-white"
                      : "bg-gray-50 text-[#494D5D] hover:bg-gray-100 active:bg-gray-200"
                  }`}
                >
                  <FiUser
                    className={`w-5 h-5 flex-shrink-0 ${
                      pathname === PROFILE || pathname?.startsWith("/profile/")
                        ? "text-white"
                        : "text-[#494D5D]"
                    }`}
                  />
                  <span>Profile</span>
                </Link>
                <Link
                  href={SETTINGS}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-base transition-all duration-200 ${
                    pathname === SETTINGS
                      ? "bg-[#E36B00] text-white"
                      : "bg-gray-50 text-[#494D5D] hover:bg-gray-100 active:bg-gray-200"
                  }`}
                >
                  <FiSettings
                    className={`w-5 h-5 flex-shrink-0 ${
                      pathname === SETTINGS ? "text-white" : "text-[#494D5D]"
                    }`}
                  />
                  <span>Settings</span>
                </Link>
              </>
            )}

            {/* Auth buttons for non-authenticated users */}
            {status !== sessionStatus.authenticated && (
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSignin();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium text-base bg-gray-50 text-[#494D5D] hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSignup();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium text-base bg-[#E36B00] text-white hover:bg-[#D55F00] active:bg-[#C45400] transition-all duration-200"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

