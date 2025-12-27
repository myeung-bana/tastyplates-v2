"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { FiSearch, FiMenu } from "react-icons/fi";
import { RESTAURANTS, HOME } from "@/constants/pages";
import { TASTYPLATES_LOGO_COLOUR } from "@/constants/images";
import Image from "next/image";
import SidebarHeader from "./SidebarHeader";

interface MobileTopBarProps {
  onSearchClick?: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onSearchClick }) => {
  const pathname = usePathname();
  const { user } = useFirebaseSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 font-neusans">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          {/* Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Center Logo */}
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

          {/* Search Icon */}
          <button
            onClick={onSearchClick}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Search"
          >
            <FiSearch className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Navigation */}
          <SidebarHeader onClose={closeSidebar} />

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              TastyPlates v2.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileTopBar;
