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
  session
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 font-inter text-[#31343F]">
      {/* Profile Info Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <FallbackImage
            src={
              // Priority order: userProfile.profileImage > user.image > session.user.image > default
              ((userData?.userProfile as Record<string, unknown>)?.profileImage as Record<string, unknown>)?.node?.mediaItemUrl as string ||
              (userData?.image as string) ||
              (session?.user?.image as string) ||
              DEFAULT_USER_ICON
            }
            alt={(userData?.name as string) || "User"}
            width={80}
            height={80}
            className="rounded-full object-cover"
            type={FallbackImageType.Icon}
          />
        </div>
        
        {/* Profile Details */}
        <div className="flex-1 min-w-0 w-full">
          {/* Name and Action Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-medium truncate">
                {nameLoading ? (
                  <span className="inline-block w-32 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  (userData?.name as string) || ""
                )}
              </h1>
            </div>
            {/* Action Button - Edit Profile or Follow/Unfollow */}
            {isViewingOwnProfile ? (
              <Link
                href={PROFILE_EDIT}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm whitespace-nowrap"
              >
                <FaPen className="text-gray-500" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              userData && (userData.databaseId as number) && session?.accessToken && (
                <button
                  onClick={() => {
                    const isFollowing = following.some((f: Record<string, unknown>) => f.id === (userData.databaseId as number));
                    if (isFollowing) {
                      onUnfollow(String(userData.databaseId as number));
                    } else {
                      onFollow(String(userData.databaseId as number));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-semibold text-sm whitespace-nowrap"
                >
                  {following.some((f: Record<string, unknown>) => f.id === (userData.databaseId as number)) ? (
                    <>
                      <FaHeart className="text-red-500" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <FaRegHeart className="text-gray-500" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
          
          {/* Stats Row */}
          <div className="flex gap-6 mb-4 text-sm">
            <span className="cursor-default">
              <span className="font-semibold">{userReviewCount}</span> Reviews
            </span>
            <button
              type="button"
              className="text-primary focus:outline-none hover:underline"
              onClick={() => {
                if (followers.length > 0) {
                  onShowFollowers();
                }
              }}
              disabled={followersLoading || followers.length === 0}
            >
              <span className="font-semibold">
                {followersLoading ? (
                  <span className="inline-block w-8 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  followers.length
                )}
              </span> Followers
            </button>
            <button
              type="button"
              className="text-primary focus:outline-none hover:underline"
              onClick={() => {
                if (following.length > 0) {
                  onShowFollowing();
                }
              }}
              disabled={followingLoading || following.length === 0}
            >
              <span className="font-semibold">
                {followingLoading ? (
                  <span className="inline-block w-8 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  following.length
                )}
              </span> Following
            </button>
          </div>
          
          {/* Bio Section */}
          <div className="mb-4">
            {aboutMeLoading ? (
              <div className="w-full h-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-sm">
                {((userData?.userProfile as Record<string, unknown>)?.aboutMe as string) || 
                 (userData?.about_me as string) || 
                 <span className="text-gray-400">No bio set</span>}
              </p>
            )}
          </div>
          
          {/* Palates Section */}
          <div className="mb-4">
            {palatesLoading ? (
              <span className="inline-block w-24 h-6 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="flex gap-2 flex-wrap">
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
                          className="bg-gray-100 py-1 px-2 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1"
                        >
                          {flagSrc && (
                            <Image
                              src={flagSrc}
                              alt={`${capitalizedPalate} flag`}
                              width={16}
                              height={9}
                              className="rounded object-cover"
                            />
                          )}
                          {capitalizedPalate}
                        </span>
                      );
                    })
                ) : (
                  <span className="text-gray-400 text-sm">No palates set</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
