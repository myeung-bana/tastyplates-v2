"use client";
import React from 'react';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import SettingsCategory from "@/components/Settings/SettingsCategory";

const SettingsPage = () => {
  return (
    <SettingsLayout title="Settings">
      <div className="settings-container font-neusans">
        {/* Desktop Header */}
        <div className="settings-desktop-header">
          <h1 className="settings-desktop-title">Settings</h1>
        </div>
        
        {/* Settings Categories */}
        <div className="settings-categories">
          <SettingsCategory
            title="Account & Security"
            icon=""
            items={[
              { title: "Profile", subtitle: "Email, birthdate, and gender", href: "/settings/account-security/profile" },
              { title: "Password", subtitle: "Update your password", href: "/settings/account-security/password" },
              { title: "Language", subtitle: "Choose your preferred language", href: "/settings/general/language" },
              // { title: "Two-Factor Authentication", subtitle: "Add extra security", href: "/settings/account-security/two-factor" },
            ]}
          />

          {/* <SettingsCategory
            title="Content Preferences"
            icon=""
            items={[
              { title: "Feed Preferences", subtitle: "Customize your feed", href: "/settings/content-preferences/feed" },
              { title: "Cuisine Interests", subtitle: "Your food preferences", href: "/settings/content-preferences/cuisine" },
              { title: "Location Settings", subtitle: "Location preferences", href: "/settings/content-preferences/location" },
            ]}
          /> */}

          {/* <SettingsCategory
            title="App Settings"
            icon=""
            items={[
              { title: "Display", subtitle: "Theme & appearance", href: "/settings/app-settings/display" },
              { title: "Storage", subtitle: "Manage storage", href: "/settings/app-settings/storage" },
              { title: "Offline Mode", subtitle: "Download content", href: "/settings/app-settings/offline" },
            ]}
          /> */}

          <SettingsCategory
            title="Support"
            icon=""
            items={[
              { title: "Help Center", subtitle: "Get help", href: "/settings/support/help" },
              { title: "About", subtitle: "App version and info", href: "/settings/support/about" },
            ]}
          />
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsPage;