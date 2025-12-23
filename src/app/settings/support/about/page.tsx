"use client";
import React from 'react';
import SettingsLayout from "@/components/Settings/SettingsLayout";

const AboutPage = () => {
  // Get version from package.json or environment
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString().split('T')[0];

  return (
    <SettingsLayout 
      title="About" 
      subtitle=""
      showBackButton={true}
    >
      <div className="settings-page">
        <div className="settings-page-content">
          {/* App Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#ff7c0a] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-neusans">TastyPlates</h1>
            <p className="text-gray-600 font-neusans">Discover and share amazing food experiences</p>
          </div>

          {/* Version Information */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-neusans">Version Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-neusans">App Version</span>
                <span className="font-medium text-gray-900 font-neusans">v{appVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-neusans">Build Date</span>
                <span className="font-medium text-gray-900 font-neusans">{buildDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-neusans">Platform</span>
                <span className="font-medium text-gray-900 font-neusans">Web App</span>
              </div>
            </div>
          </div>

          {/* App Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 font-neusans">About TastyPlates</h2>
            <p className="text-gray-600 leading-relaxed font-neusans">
              TastyPlates is your go-to platform for discovering and sharing amazing food experiences. 
              Connect with fellow food enthusiasts, discover new restaurants, and share your culinary adventures 
              with a community that loves great food as much as you do.
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 font-neusans">Features</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#ff7c0a] rounded-full"></div>
                <span className="text-gray-600 font-neusans">Restaurant reviews and ratings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#ff7c0a] rounded-full"></div>
                <span className="text-gray-600 font-neusans">Photo sharing and food discovery</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#ff7c0a] rounded-full"></div>
                <span className="text-gray-600 font-neusans">Follow other food enthusiasts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#ff7c0a] rounded-full"></div>
                <span className="text-gray-600 font-neusans">Personalized recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#ff7c0a] rounded-full"></div>
                <span className="text-gray-600 font-neusans">Multi-language support</span>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 font-neusans">Legal</h2>
            <div className="space-y-3">
              <a 
                href="/privacy-policy" 
                className="block text-[#ff7c0a] hover:text-[#e66d08] transition-colors font-neusans"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms-of-service" 
                className="block text-[#ff7c0a] hover:text-[#e66d08] transition-colors font-neusans"
              >
                Terms of Service
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 font-neusans">
              © {new Date().getFullYear()} TastyPlates. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default AboutPage;
