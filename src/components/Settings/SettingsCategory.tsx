"use client";
import React from 'react';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';

interface SettingsItem {
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  disabled?: boolean;
}

interface SettingsCategoryProps {
  title: string;
  icon: string;
  items: SettingsItem[];
}

const SettingsCategory: React.FC<SettingsCategoryProps> = ({ title, icon, items }) => {
  return (
    <div className="settings-category">
      <div className="settings-category-header">
        <h2 className="settings-category-title">{title}</h2>
      </div>
      
      <div className="settings-category-items">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`settings-item ${item.disabled ? 'settings-item--disabled' : ''}`}
          >
            <div className="settings-item-content">
              <div className="settings-item-text">
                <h3 className="settings-item-title">{item.title}</h3>
                <p className="settings-item-subtitle">{item.subtitle}</p>
              </div>
              {item.badge && (
                <span className="settings-item-badge">{item.badge}</span>
              )}
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsCategory;
