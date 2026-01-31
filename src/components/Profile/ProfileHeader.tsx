import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaPen, FaRegHeart, FaHeart } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import FallbackImage, { FallbackImageType } from '../ui/Image/FallbackImage';
import { DEFAULT_USER_ICON } from '@/constants/images';
import { palateFlagMap } from '@/utils/palateFlags';
import { PROFILE_EDIT } from '@/constants/pages';
import { FollowButton } from '@/components/ui/follow-button';
import toast from 'react-hot-toast';

interface ProfileHeaderProps {
  userData: Record<string, unknown> | null;
  nameLoading: boolean;
  aboutMeLoading: boolean;
  palatesLoading: boolean;
  userReviewCount: number;
  followers: Record<string, unknown>[];
  following: Record<string, unknown>[];
  followersLoading: boolean;
  followingLoading: boolean;
  followersCount: number;
  followingCount: number;
  isViewingOwnProfile: boolean;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onFollow: (id: string) => Promise<void>;
  onUnfollow: (id: string) => Promise<void>;
  session?: any; // Optional for backward compatibility
  currentUser?: any; // Current user from useFirebaseSession
  targetUserId: string | number;
  isFollowing: boolean;
  followLoading: boolean;
}

// Helper function to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  
  // If it's a string, return it directly
  if (typeof profileImage === 'string') {
    return profileImage;
  }
  
  // If it's an object, extract the URL
  if (typeof profileImage === 'object') {
    // Try different possible URL fields
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  
  return null;
};

// Helper function to extract palates array from JSONB format
const getPalatesArray = (palates: any): string[] => {
  if (!palates) return [];
  
  // If it's already an array
  if (Array.isArray(palates)) {
    return palates.map((palate: any) => {
      // If it's a string, return it
      if (typeof palate === 'string') {
        return palate;
      }
      // If it's an object, extract the name
      if (typeof palate === 'object' && palate !== null) {
        return palate.name || palate.slug || String(palate);
      }
      return String(palate);
    });
  }
  
  // If it's a string, try to parse it (legacy format)
  if (typeof palates === 'string') {
    return palates.split(/[|,]\s*/).filter((p: string) => p.trim().length > 0);
  }
  
  return [];
};

// Helper function to get display name
const getDisplayName = (userData: Record<string, unknown> | null): string => {
  if (!userData) return '';
  return (userData.display_name as string) || (userData.username as string) || '';
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userData,
  nameLoading,
  aboutMeLoading,
  palatesLoading,
  userReviewCount,
  followers,
  following,
  followersLoading,
  followingLoading,
  followersCount,
  followingCount,
  isViewingOwnProfile,
  onShowFollowers,
  onShowFollowing,
  onFollow,
  onUnfollow,
  session,
  currentUser,
  targetUserId,
  isFollowing,
  followLoading
}) => {
  // Extract profile image URL from JSONB format
  const profileImageUrl = getProfileImageUrl(userData?.profile_image);
  const displayName = getDisplayName(userData);
  const palatesArray = getPalatesArray(userData?.palates);

  // Share profile handler
  const handleShareProfile = async () => {
    const username = userData?.username || userData?.display_name || '';
    const profileUrl = `${window.location.origin}/profile/${username}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          text: `Check out ${displayName}'s profile on TastyPlates!`,
          url: profileUrl
        });
        toast.success('Profile shared successfully!');
      } catch (error) {
        // User cancelled the share or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 font-inter text-[#31343F]">
      {/* Top Section: Profile Picture + Username + Stats + Palates */}
      <div className="flex items-end gap-3 md:gap-6 w-full mb-4">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <FallbackImage
            src={
              profileImageUrl ||
              (currentUser?.profile_image ? getProfileImageUrl(currentUser.profile_image) : null) ||
              (session?.user?.image as string) ||
              DEFAULT_USER_ICON
            }
            alt={displayName || "User"}
            width={150}
            height={150}
            className="rounded-full object-cover w-20 h-20 md:w-32 md:h-32"
            type={FallbackImageType.Icon}
          />
        </div>
        
        {/* Username + Stats + Palates */}
        <div className="flex-1 min-w-0">
          {/* Username */}
          <h1 className="font-neusans text-base md:text-xl font-normal truncate mb-1 md:mb-3">
            {nameLoading ? (
              <span className="inline-block w-32 h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
            ) : (
              displayName
            )}
          </h1>
          
          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-base mb-2 md:mb-3">
            {/* Reviews Count */}
            <span className="cursor-default">
              <span className="font-neusans font-medium">
                {userReviewCount ?? 0}
              </span>{" "}
              <span className="hidden md:inline">Reviews</span>
              <span className="md:hidden">Posts</span>
            </span>
            
            <span className="text-gray-400 hidden md:inline">·</span>
            
            {/* Followers Count */}
            <button
              type="button"
              className="cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-neusans hover:text-gray-600 transition-colors"
              onClick={onShowFollowers}
              disabled={followersLoading}
            >
              <span className="font-neusans font-medium">
                {followersLoading ? (
                  <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  followersCount ?? 0
                )}
              </span> Followers
            </button>
            
            <span className="text-gray-400 hidden md:inline">·</span>
            
            {/* Following Count */}
            <button
              type="button"
              className="cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-neusans hover:text-gray-600 transition-colors"
              onClick={onShowFollowing}
              disabled={followingLoading}
            >
              <span className="font-neusans font-medium">
                {followingLoading ? (
                  <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  followingCount ?? 0
                )}
              </span> Following
            </button>
          </div>
          
          {/* Palates Section - Below stats */}
          <div className="mb-2 md:mb-3">
            {palatesLoading ? (
              <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="flex gap-1 md:gap-1.5 flex-wrap">
                {palatesArray.length > 0 ? (
                  palatesArray.map((palate: string, index: number) => {
                      const capitalizedPalate = palate
                        .trim()
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ");
                      const flagSrc = palateFlagMap[capitalizedPalate.toLowerCase()];
                      return (
                        <span
                          key={index}
                          className="bg-gray-100 py-0.5 px-1.5 md:py-1 md:px-2 rounded-full text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                          {flagSrc && (
                            <Image
                              src={flagSrc}
                              alt={`${capitalizedPalate} flag`}
                              width={16}
                              height={10}
                              className="rounded object-cover w-3 h-2 md:w-4 md:h-2.5"
                            />
                          )}
                          {capitalizedPalate}
                        </span>
                      );
                    })
                ) : (
                  <span className="text-gray-400 text-xs md:text-sm">No palates set</span>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons - Show on desktop */}
          <div className="hidden md:block">
            {/* Follow Button */}
            {!isViewingOwnProfile && (currentUser || session?.user) && (
              <FollowButton
                isFollowing={isFollowing}
                isLoading={followLoading}
                onToggle={async (isFollowing) => {
                  if (isFollowing) {
                    await onUnfollow(targetUserId.toString());
                  } else {
                    await onFollow(targetUserId.toString());
                  }
                }}
                size="default"
              />
            )}
            
            {/* Edit Profile & Share Profile Buttons */}
            {isViewingOwnProfile && (
              <>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  <span>Edit Profile</span>
                </Link>
                <button
                  onClick={handleShareProfile}
                  className="ml-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  <span>Share Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Bio + Buttons (Full width) */}
      <div className="w-full">
        {/* Bio Section */}
        <div className="mb-3">
          {aboutMeLoading ? (
            <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
              {(userData?.about_me as string) || (
                <span className="text-gray-400">No bio set</span>
              )}
            </p>
          )}
        </div>
        
        {/* Action Buttons (Mobile only) */}
        <div className="md:hidden">
          {/* Follow Button */}
          {!isViewingOwnProfile && (currentUser || session?.user) && (
            <FollowButton
              isFollowing={isFollowing}
              isLoading={followLoading}
              onToggle={async (isFollowing) => {
                if (isFollowing) {
                  await onUnfollow(targetUserId.toString());
                } else {
                  await onFollow(targetUserId.toString());
                }
              }}
              size="default"
            />
          )}
          
          {/* Edit Profile & Share Profile Buttons */}
          {isViewingOwnProfile && (
            <div className="flex gap-2">
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                <span>Edit Profile</span>
              </Link>
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Share Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
