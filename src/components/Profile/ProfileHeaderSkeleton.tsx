// ProfileHeaderSkeleton.tsx - For Profile Header Loading
import React from "react";

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 font-inter text-[#31343F]">
      {/* Compact Mobile Instagram-style Layout */}
      <div className="flex items-start gap-4 w-full">
        {/* Profile Image - Left column, left-aligned */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-300 rounded-full animate-pulse" />
        </div>
        
        {/* Profile Details - Right column, compact layout */}
        <div className="flex-1 min-w-0">
          {/* Username and Follow Button */}
          <div className="mb-2 flex items-center gap-3">
            <div className="h-6 md:h-7 bg-gray-300 rounded w-32 animate-pulse" />
            <div className="h-8 bg-gray-300 rounded-[50px] w-20 animate-pulse" />
          </div>
          
          {/* Stats Row - Compact Instagram style */}
          <div className="flex gap-4 text-sm mb-3">
            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" />
          </div>
          
          {/* Bio Section */}
          <div className="mb-2">
            <div className="h-12 bg-gray-300 rounded w-full animate-pulse" />
          </div>
          
          {/* Palates Section */}
          <div className="mb-2">
            <div className="flex gap-1 flex-wrap">
              <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-full w-20 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-full w-14 animate-pulse" />
            </div>
          </div>
          
          {/* Edit Profile Button Skeleton */}
          <div className="mt-4">
            <div className="h-8 bg-gray-300 rounded-[50px] w-24 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSkeleton;
