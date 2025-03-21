// tastyplates-frontend/src/app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiUpload } from "react-icons/fi";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import Image from "next/image";
import "@/styles/pages/_profile.scss";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  image: string;
  palateIds: string[];
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    image: "",
    palateIds: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Mock data - replace with actual API calls
  const fetchUserProfile = async () => {
    // Simulate API call using dummy data
    const user = users[0]; // Using first user as example
    setProfile({
      name: user.name,
      email: user.email,
      phone: "", // Add phone if available in your user data
      image: user.image,
      palateIds: user.palateIds,
    });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement password change logic here
    console.log("Password change requested");
  };

  const handlePalateToggle = (palateId: string) => {
    setProfile((prev) => ({
      ...prev,
      palateIds: prev.palateIds.includes(palateId)
        ? prev.palateIds.filter((id) => id !== palateId)
        : [...prev.palateIds, palateId],
    }));
  };

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-overview__title">Profile</h1>
      {/* Personal Information Section */}
      <div className="profile-section">
        <h2>Personal Information</h2>
        <div className="profile-info-container">
          <div className="profile-image-section">
            <div className="profile-image-wrapper">
              <Image
                src={profile.image || "/images/default-user-profile.jpg"}
                alt="Profile"
                width={150}
                height={150}
                className="profile-image"
              />
              {isEditing && (
                <label className="image-upload-button">
                  <FiUpload />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="profile-details">
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Palate Preferences Section */}
      <div className="profile-section">
        <h2>Palate Preferences</h2>
        <div className="palate-grid">
          {palates.map((palate) => (
            <div
              key={palate.id}
              className={`palate-card ${
                profile.palateIds.includes(palate.id) ? "selected" : ""
              }`}
              onClick={() => isEditing && handlePalateToggle(palate.id)}
            >
              <h3>{palate.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Password Change Section */}
      <div className="profile-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="field">
            <label>Current Password</label>
            <input
              type="password"
              value={newPassword.current}
              onChange={(e) =>
                setNewPassword({ ...newPassword, current: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword.new}
              onChange={(e) =>
                setNewPassword({ ...newPassword, new: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={newPassword.confirm}
              onChange={(e) =>
                setNewPassword({ ...newPassword, confirm: e.target.value })
              }
            />
          </div>
          <button type="submit" className="dashboard-button">
            Update Password
          </button>
        </form>
      </div>

      {/* Edit/Save Controls */}
      <div className="profile-actions">
        <button
          className="dashboard-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <FiSave /> Save Changes
            </>
          ) : (
            <>
              <FiEdit2 /> Edit Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
