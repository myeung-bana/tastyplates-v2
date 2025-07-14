"use client";

import { DASHBOARD, DASHBOARD_LISTS, DASHBOARD_PROFILE, DASHBOARD_REVIEWS, DASHBOARD_SETTINGS } from "@/constants/pages";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiHeart,
  FiClock,
  FiMessageCircle,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

const DashboardSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: FiHome, label: "Overview", href: DASHBOARD },
    { icon: FiHeart, label: "Lists", href: DASHBOARD_LISTS },
    { icon: FiMessageCircle, label: "Reviews", href: DASHBOARD_REVIEWS },
    { icon: FiMessageCircle, label: "Profile", href: DASHBOARD_PROFILE },
    { icon: FiSettings, label: "Settings", href: DASHBOARD_SETTINGS },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__user">
        <div className="dashboard-sidebar__avatar">
          {/* Add user avatar here */}
          <div className="dashboard-sidebar__avatar-placeholder">JD</div>
        </div>
        <div className="dashboard-sidebar__user-info">
          <h2 className="dashboard-sidebar__name">John Doe</h2>
          <p className="dashboard-sidebar__email">john@example.com</p>
        </div>
      </div>

      <nav className="dashboard-sidebar__nav">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`dashboard-sidebar__link ${
              pathname === item.href ? "dashboard-sidebar__link--active" : ""
            }`}
          >
            <item.icon className="dashboard-sidebar__icon" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button className="dashboard-sidebar__logout">
        <FiLogOut className="dashboard-sidebar__icon" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default DashboardSidebar;
