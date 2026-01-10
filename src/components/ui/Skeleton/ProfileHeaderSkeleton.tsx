// ProfileHeaderSkeleton.tsx - For Profile Header Loading
import React from "react";

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 font-inter text-[#31343F]">
      {/* Top Section: Profile Picture + Username + Stats + Palates */}
      <div className="flex items-end gap-3 md:gap-6 w-full mb-4">
        {/* Profile Image Skeleton */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-300 rounded-full animate-pulse" />
        </div>
        
        {/* Username + Stats + Palates Skeleton */}
        <div className="flex-1 min-w-0">
          {/* Username Skeleton */}
          <div className="h-5 md:h-6 bg-gray-300 rounded w-32 md:w-48 animate-pulse mb-1 md:mb-3" />
          
          {/* Stats Row Skeleton */}
          <div className="flex gap-2 md:gap-6 text-sm mb-2 md:mb-3">
            <div className="h-4 md:h-5 bg-gray-300 rounded w-14 md:w-20 animate-pulse" />
            <div className="h-4 md:h-5 bg-gray-300 rounded w-16 md:w-24 animate-pulse" />
            <div className="h-4 md:h-5 bg-gray-300 rounded w-16 md:w-24 animate-pulse" />
          </div>
          
          {/* Palates Skeleton - Below stats */}
          <div className="mb-2 md:mb-3">
            <div className="flex gap-1 md:gap-1.5 flex-wrap">
              <div className="h-5 md:h-6 bg-gray-200 rounded-full w-16 md:w-20 animate-pulse" />
              <div className="h-5 md:h-6 bg-gray-200 rounded-full w-20 md:w-24 animate-pulse" />
              <div className="h-5 md:h-6 bg-gray-200 rounded-full w-14 md:w-16 animate-pulse" />
            </div>
          </div>
          
          {/* Desktop Button Skeleton */}
          <div className="hidden md:block">
            <div className="h-9 bg-gray-300 rounded-[50px] w-28 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Bio + Buttons */}
      <div className="w-full">
        {/* Bio Skeleton */}
        <div className="mb-3">
          <div className="h-12 bg-gray-300 rounded w-full animate-pulse" />
        </div>
        
        {/* Mobile Button Skeleton */}
        <div className="md:hidden">
          <div className="h-9 bg-gray-300 rounded-[50px] w-28 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSkeleton;

