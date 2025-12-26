'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TASTYSTUDIO_DASHBOARD,
  TASTYSTUDIO_ADD_REVIEW,
  TASTYSTUDIO_REVIEW_LISTING 
} from '@/constants/pages';
import { FiHome, FiEdit3, FiFileText } from 'react-icons/fi';

const TastyStudioSidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === TASTYSTUDIO_DASHBOARD) {
      return pathname === TASTYSTUDIO_DASHBOARD;
    }
    return pathname?.startsWith(href);
  };

  const navigationItems = [
    {
      icon: FiHome,
      label: 'Dashboard',
      href: TASTYSTUDIO_DASHBOARD,
    },
    {
      icon: FiEdit3,
      label: 'Upload a Review',
      href: TASTYSTUDIO_ADD_REVIEW,
    },
    {
      icon: FiFileText,
      label: 'Reviews',
      href: TASTYSTUDIO_REVIEW_LISTING,
    },
  ];

  return (
    <aside className="hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 flex-col font-neusans z-40">
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Manage Section Label */}
        <div className="px-4 mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider font-neusans">
            Manage
          </p>
        </div>
        
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-start gap-3 px-4 py-3 rounded-xl transition-all
                ${active 
                  ? 'bg-[#ff7c0a] text-white shadow-sm' 
                  : 'text-[#494D5D] hover:bg-gray-50'
                }
              `}
            >
              <Icon 
                className={`
                  w-5 h-5 mt-0.5 flex-shrink-0
                  ${active 
                    ? 'text-white' 
                    : 'text-[#494D5D] group-hover:text-[#ff7c0a]'
                  }
                `} 
              />
              <div className="flex-1 min-w-0">
                <div className="font-normal text-sm font-neusans">{item.label}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Need help? Contact support
        </p>
      </div>
    </aside>
  );
};

export default TastyStudioSidebar;

