"use client";
import React from 'react';
import SettingsLayout from "@/components/Settings/SettingsLayout";
import SettingsCategory from "@/components/Settings/SettingsCategory";

const SettingsPage = () => {
  return (
    <SettingsLayout title="Settings">
      <div className="settings-container">
        {/* Desktop Header */}
        <div className="settings-desktop-header">
          <h1 className="settings-desktop-title">Settings</h1>
        </div>
        
        {/* Settings Categories */}
        <div className="settings-categories">
          <SettingsCategory
            title="General"
            icon=""
            items={[
              { title: "Language", subtitle: "English", href: "/settings/general/language" },
              { title: "Notifications", subtitle: "Manage alerts", href: "/settings/general/notifications" },
              // { title: "Privacy", subtitle: "Control your data", href: "/settings/general/privacy" },
            ]}
          />
          
          <SettingsCategory
            title="Account & Security"
            icon=""
            items={[
              { title: "Profile", subtitle: "Personal information", href: "/settings/account-security/profile" },
              { title: "Password", subtitle: "Change password", href: "/settings/account-security/password" },
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
              { title: "Contact Us", subtitle: "Send us a message", href: "/settings/support/contact" },
            ]}
          />
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsPage;