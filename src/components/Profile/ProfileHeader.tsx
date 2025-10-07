import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaPen, FaRegHeart, FaHeart } from 'react-icons/fa';
import FallbackImage, { FallbackImageType } from '../ui/Image/FallbackImage';
import { DEFAULT_USER_ICON } from '@/constants/images';
import { palateFlagMap } from '@/utils/palateFlags';
import { PROFILE_EDIT } from '@/constants/pages';

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
  isViewingOwnProfile: boolean;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onFollow: (id: string) => Promise<void>;
  onUnfollow: (id: string) => Promise<void>;
  session: any;
  targetUserId: number;
  isFollowing: boolean;
  followLoading: boolean;
}

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
  isViewingOwnProfile,
  onShowFollowers,
  onShowFollowing,
  onFollow,
  onUnfollow,
  session,
  targetUserId,
  isFollowing,
  followLoading
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 font-inter text-[#31343F]">
      {/* Compact Mobile Instagram-style Layout */}
      <div className="flex items-start gap-4 w-full">
        {/* Profile Image - Left column, left-aligned */}
        <div className="flex-shrink-0">
          <FallbackImage
            src={
              // Priority order: userProfile.profileImage > user.image > session.user.image > default
              (((userData?.userProfile as Record<string, unknown>)?.profileImage as Record<string, unknown>)?.node as Record<string, unknown>)?.mediaItemUrl as string ||
              (userData?.image as string) ||
              (session?.user?.image as string) ||
              DEFAULT_USER_ICON
            }
            alt={(userData?.name as string) || "User"}
            width={80}
            height={80}
            className="rounded-full object-cover w-16 h-16 md:w-20 md:h-20"
            type={FallbackImageType.Icon}
          />
        </div>
        
        {/* Profile Details - Right column, compact layout */}
        <div className="flex-1 min-w-0">
          {/* Username and Follow Button */}
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-base md:text-2xl font-medium truncate">
              {nameLoading ? (
                <span className="inline-block w-32 h-6 bg-gray-200 rounded animate-pulse" />
              ) : (
                (userData?.name as string) || ""
              )}
            </h1>
            
            {/* Follow/Unfollow Button - Only show for other users */}
            {!isViewingOwnProfile && session?.user && (
              <button
                onClick={() => {
                  if (isFollowing) {
                    onUnfollow(targetUserId.toString());
                  } else {
                    onFollow(targetUserId.toString());
                  }
                }}
                disabled={followLoading}
                className={`px-4 py-2 text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center transition-colors ${
                  isFollowing 
                    ? 'bg-white text-black border border-black' 
                    : 'bg-[#E36B00] text-[#FCFCFC]'
                } disabled:opacity-50 disabled:pointer-events-none`}
              >
                {followLoading ? (
                  <span className="animate-pulse">
                    {isFollowing ? "Unfollowing..." : "Following..."}
                  </span>
                ) : isFollowing ? (
                  "Following"
                ) : (
                  "Follow"
                )}
              </button>
            )}
          </div>
          
          {/* Stats Row - Compact Instagram style */}
          <div className="flex gap-4 text-sm mb-3">
            {/* Reviews Count */}
            <span className="cursor-default">
              <span className="font-semibold">
                {followersLoading || followingLoading ? (
                  <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  userReviewCount
                )}
              </span> Reviews
            </span>
            
            {/* Followers Count */}
            <button
              type="button"
              className="focus:outline-none hover:underline"
              onClick={() => {
                if (followers.length > 0) {
                  onShowFollowers();
                }
              }}
              disabled={followersLoading || followers.length === 0}
            >
              <span className="font-semibold">
                {followersLoading ? (
                  <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  followers.length
                )}
              </span> Followers
            </button>
            
            {/* Following Count */}
            <button
              type="button"
              className="focus:outline-none hover:underline"
              onClick={() => {
                if (following.length > 0) {
                  onShowFollowing();
                }
              }}
              disabled={followingLoading || following.length === 0}
            >
              <span className="font-semibold">
                {followingLoading ? (
                  <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  following.length
                )}
              </span> Following
            </button>
          </div>
          
          {/* Bio Section */}
          <div className="mb-2">
            {aboutMeLoading ? (
              <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-sm leading-relaxed">
                {((userData?.userProfile as Record<string, unknown>)?.aboutMe as string) || 
                 (userData?.about_me as string) || 
                 <span className="text-gray-400">No bio set</span>}
              </p>
            )}
          </div>
          
          {/* Palates Section */}
          <div className="mb-2">
            {palatesLoading ? (
              <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="flex gap-1 flex-wrap">
                {((userData?.userProfile as Record<string, unknown>)?.palates as string) || (userData?.palates as string) ? (
                  (((userData?.userProfile as Record<string, unknown>)?.palates as string) || (userData?.palates as string))
                    .split(/[|,]\s*/)
                    .filter((palate: string) => palate.trim().length > 0)
                    .map((palate: string, index: number) => {
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
                          className="bg-gray-100 py-0.5 px-1.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1"
                        >
                          {flagSrc && (
                            <Image
                              src={flagSrc}
                              alt={`${capitalizedPalate} flag`}
                              width={12}
                              height={7}
                              className="rounded object-cover"
                            />
                          )}
                          {capitalizedPalate}
                        </span>
                      );
                    })
                ) : (
                  <span className="text-gray-400 text-xs">No palates set</span>
                )}
              </div>
            )}
          </div>
          
          {/* Edit Profile Button - Show for own profile on all screen sizes */}
          {isViewingOwnProfile && (
            <div className="mt-4">
              <Link
                href="/profile/edit"
                className="items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
