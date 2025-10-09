"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

interface SettingsLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ 
  children, 
  showBackButton = false, 
  title,
  subtitle
}) => {
  const router = useRouter();

  return (
    <div className="settings-layout">
      {/* Mobile Header */}
      <div className="settings-mobile-header">
        {showBackButton && (
          <button 
            onClick={() => router.back()}
            className="settings-back-button"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="settings-header-content">
          <h1 className="settings-mobile-title">
            {title || 'Settings'}
          </h1>
          {subtitle && (
            <p className="settings-mobile-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="settings-header-spacer" />
      </div>

      {/* Content */}
      <div className="settings-content">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
