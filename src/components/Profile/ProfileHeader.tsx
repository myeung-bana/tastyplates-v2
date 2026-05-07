"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShare2 } from 'react-icons/fi';
import FallbackImage, { FallbackImageType } from '../ui/Image/FallbackImage';
import { DEFAULT_USER_ICON } from '@/constants/images';
import { palateFlagMap } from '@/utils/palateFlags';
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
  session?: any;
  currentUser?: any;
  nhostUser?: any;
  targetUserId: string | number;
  isFollowing: boolean;
  followLoading: boolean;
}

const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  if (typeof profileImage === 'string') return profileImage;
  if (typeof profileImage === 'object') {
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  return null;
};

const getPalatesArray = (palates: any): string[] => {
  if (!palates) return [];
  if (Array.isArray(palates)) {
    return palates.map((palate: any) => {
      if (typeof palate === 'string') return palate;
      if (typeof palate === 'object' && palate !== null) return palate.name || palate.slug || String(palate);
      return String(palate);
    });
  }
  if (typeof palates === 'string') {
    return palates.split(/[|,]\s*/).filter((p: string) => p.trim().length > 0);
  }
  return [];
};

const getDisplayName = (userData: Record<string, unknown> | null): string => {
  if (!userData) return '';
  return (userData.username as string) || '';
};

const formatMemberSince = (createdAt: unknown): string => {
  if (!createdAt || typeof createdAt !== 'string') return '';
  try {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return '';
    return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  } catch {
    return '';
  }
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userData,
  nameLoading,
  aboutMeLoading,
  palatesLoading,
  userReviewCount,
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
  nhostUser,
  targetUserId,
  isFollowing,
  followLoading,
}) => {
  const profileImageUrl = getProfileImageUrl(userData?.profile_image);
  const displayName = getDisplayName(userData);
  const palatesArray = getPalatesArray(userData?.palates);
  const memberSince = formatMemberSince(userData?.created_at);
  const aboutMe = userData?.about_me as string | undefined;

  const handleShareProfile = async () => {
    const username = userData?.username || '';
    const profileUrl = `${window.location.origin}/profile/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          text: `Check out ${displayName}'s profile on TastyPlates!`,
          url: profileUrl,
        });
        toast.success('Profile shared!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error('Share error:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 pt-6 pb-0 md:pt-10 font-inter text-[#31343F]">

      {/* ── Section 1: Profile identity (centered) ─────────────────────── */}
      <div className="flex flex-col items-center text-center gap-2 mb-6 md:mb-8">

        {/* Avatar */}
        <div className="mb-1 md:mb-2">
          <FallbackImage
            src={
              (isViewingOwnProfile && nhostUser?.avatarUrl?.trim())
                ? nhostUser.avatarUrl
                : (userData?.avatarUrl as string)?.trim()
                  ? (userData.avatarUrl as string)
                  : profileImageUrl ||
                    (isViewingOwnProfile && currentUser?.profile_image
                      ? getProfileImageUrl(currentUser.profile_image)
                      : null) ||
                    DEFAULT_USER_ICON
            }
            alt={displayName || 'User'}
            width={128}
            height={128}
            className="rounded-full object-cover w-24 h-24 md:w-32 md:h-32"
            type={FallbackImageType.Icon}
          />
        </div>

        {/* Username */}
        <h1 className="font-neusans text-lg md:text-2xl font-semibold leading-tight">
          {nameLoading ? (
            <span className="inline-block w-32 md:w-44 h-6 md:h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            `@${displayName}`
          )}
        </h1>

        {/* Member since */}
        {nameLoading ? (
          <span className="inline-block w-40 h-4 bg-gray-200 rounded animate-pulse" />
        ) : memberSince ? (
          <p className="text-xs md:text-sm text-gray-400 font-neusans">{memberSince}</p>
        ) : null}

        {/* Palates */}
        <div className="mt-1">
          {palatesLoading ? (
            <div className="flex gap-1.5 justify-center">
              <span className="inline-block w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
              <span className="inline-block w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ) : palatesArray.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {palatesArray.map((palate: string, index: number) => {
                const capitalizedPalate = palate
                  .trim()
                  .split(' ')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(' ');
                const flagSrc = palateFlagMap[capitalizedPalate.toLowerCase()];
                return (
                  <span
                    key={index}
                    className="bg-gray-100 py-0.5 px-2 md:py-1 md:px-2.5 rounded-full text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1"
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
              })}
            </div>
          ) : null}
        </div>

        {/* Bio */}
        {aboutMeLoading ? (
          <div className="w-48 md:w-72 h-10 bg-gray-200 rounded animate-pulse mt-1" />
        ) : aboutMe ? (
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-sm md:max-w-lg mt-1 whitespace-pre-line">
            {aboutMe}
          </p>
        ) : null}
      </div>

      {/* ── Section 2: Stats row ────────────────────────────────────────── */}
      <div className="pt-5 md:pt-6 mb-5 md:mb-6">
        <div className="flex items-start justify-center gap-10 md:gap-20">

          {/* Posts */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-neusans font-semibold text-base md:text-xl">
              {userReviewCount ?? 0}
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-neusans">Posts</span>
          </div>

          {/* Followers */}
          <button
            type="button"
            onClick={onShowFollowers}
            disabled={followersLoading}
            className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
          >
            <span className="font-neusans font-semibold text-base md:text-xl">
              {followersLoading ? (
                <span className="inline-block w-6 h-5 bg-gray-200 rounded animate-pulse" />
              ) : (
                followersCount ?? 0
              )}
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-neusans">Followers</span>
          </button>

          {/* Following */}
          <button
            type="button"
            onClick={onShowFollowing}
            disabled={followingLoading}
            className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity disabled:opacity-40 focus:outline-none"
          >
            <span className="font-neusans font-semibold text-base md:text-xl">
              {followingLoading ? (
                <span className="inline-block w-6 h-5 bg-gray-200 rounded animate-pulse" />
              ) : (
                followingCount ?? 0
              )}
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-neusans">Following</span>
          </button>
        </div>
      </div>

      {/* ── Section 3: Action buttons ───────────────────────────────────── */}
      <div className="pt-5 md:pt-6 mb-5 md:mb-6">
        <div className="flex items-center justify-center gap-3">

          {/* Own profile: Edit + Share */}
          {isViewingOwnProfile && (
            <>
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-[#31343F] text-white rounded-full font-neusans text-sm md:text-base hover:bg-[#454855] transition-colors"
              >
                Edit Profile
              </Link>
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white border border-gray-300 rounded-full font-neusans font-semibold text-sm md:text-base hover:bg-gray-50 transition-colors"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Share Profile</span>
              </button>
            </>
          )}

          {/* Viewing another user: Follow button */}
          {!isViewingOwnProfile && (currentUser || session?.user) && (
            <FollowButton
              isFollowing={isFollowing}
              isLoading={followLoading}
              onToggle={async (currentlyFollowing) => {
                if (currentlyFollowing) {
                  await onUnfollow(targetUserId.toString());
                } else {
                  await onFollow(targetUserId.toString());
                }
              }}
              size="default"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
