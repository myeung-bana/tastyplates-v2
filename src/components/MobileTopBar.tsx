"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSearch, FiMenu, FiX } from "react-icons/fi";
import { RESTAURANTS } from "@/constants/pages";

interface MobileTopBarProps {
  onSearchClick?: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onSearchClick }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navItems = [
    { name: "Following", href: "/following" },
    { name: "Explore", href: RESTAURANTS },
  ];

  const sidebarItems = [
    { name: "Home", href: "/" },
    { name: "Explore", href: RESTAURANTS },
    { name: "Following", href: "/following" },
    { name: "Profile", href: "/profile" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          {/* Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Center Navigation */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === RESTAURANTS && pathname?.startsWith('/restaurants'));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-[#E36B00]' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
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
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={closeSidebar}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === RESTAURANTS && pathname?.startsWith('/restaurants')) ||
                  (item.href === "/profile" && pathname?.startsWith('/profile'));
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#E36B00] text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

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
