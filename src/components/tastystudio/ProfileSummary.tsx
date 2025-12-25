'use client';

import React, { useEffect, useState } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import FallbackImage, { FallbackImageType } from '../ui/Image/FallbackImage';
import { DEFAULT_USER_ICON } from '@/constants/images';

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

const ProfileSummary: React.FC = () => {
  const { user } = useFirebaseSession();
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewCountLoading, setReviewCountLoading] = useState(true);

  // Get user identifier (username or UUID)
  const userIdentifier = user?.username || user?.id || '';

  // Fetch profile data using useProfileData hook
  const {
    userData,
    loading: profileLoading,
    followersCount,
    followingCount,
  } = useProfileData(userIdentifier);

  // Fetch review count
  useEffect(() => {
    const fetchReviewCount = async () => {
      if (!userData?.id) {
        setReviewCountLoading(false);
        return;
      }

      try {
        setReviewCountLoading(true);
        const response = await restaurantUserService.getReviews({
          user_id: userData.id as string,
          limit: 1, // We only need the meta.total count
          offset: 0,
          status: 'approved',
        });

        if (response.success && response.meta) {
          setReviewCount(response.meta.total || 0);
        } else {
          setReviewCount(0);
        }
      } catch (error) {
        console.error('Error fetching review count:', error);
        setReviewCount(0);
      } finally {
        setReviewCountLoading(false);
      }
    };

    fetchReviewCount();
  }, [userData?.id]);

  // Extract profile image URL
  const profileImageUrl = getProfileImageUrl(userData?.profile_image);
  const displayName = (userData?.display_name as string) || (userData?.username as string) || (user?.username as string) || 'User';

  // Show loading state
  if (profileLoading || reviewCountLoading) {
    return (
      <div className="w-full bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="flex gap-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 mb-8 md:mb-12">
      <div className="flex items-center gap-4">
        {/* Profile Image - Left */}
        <div className="flex-shrink-0">
          <FallbackImage
            src={
              profileImageUrl ||
              (user?.profile_image ? getProfileImageUrl(user.profile_image) : null) ||
              DEFAULT_USER_ICON
            }
            alt={displayName}
            width={80}
            height={80}
            className="rounded-full object-cover w-16 h-16 md:w-20 md:h-20"
            type={FallbackImageType.Icon}
          />
        </div>

        {/* Username and Stats - Right */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-neusans font-medium text-[#31343F] mb-2 truncate">
            {displayName}
          </h2>
          <div className="flex items-center gap-3 md:gap-4 text-sm md:text-base">
            <span className="font-neusans text-gray-700">
              <span className="font-medium">{reviewCount}</span> Posts
            </span>
            <span className="text-gray-400">·</span>
            <span className="font-neusans text-gray-700">
              <span className="font-medium">{followersCount ?? 0}</span> Followers
            </span>
            <span className="text-gray-400">·</span>
            <span className="font-neusans text-gray-700">
              <span className="font-medium">{followingCount ?? 0}</span> Following
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;

