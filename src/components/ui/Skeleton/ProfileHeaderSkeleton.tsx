import React from "react";

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 pt-6 pb-0 md:pt-10 font-inter text-[#31343F]">

      {/* Section 1: Profile identity skeleton */}
      <div className="flex flex-col items-center text-center gap-2 mb-6 md:mb-8">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-full animate-pulse mb-1 md:mb-2" />

        {/* Username */}
        <div className="h-6 md:h-7 bg-gray-200 rounded w-32 md:w-44 animate-pulse" />

        {/* Member since */}
        <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />

        {/* Palates */}
        <div className="flex gap-1.5 justify-center mt-1">
          <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-full w-14 animate-pulse" />
        </div>

        {/* Bio */}
        <div className="w-56 md:w-80 h-10 bg-gray-200 rounded animate-pulse mt-1" />
      </div>

      {/* Section 2: Stats row skeleton */}
      <div className="border-t border-gray-100 pt-5 md:pt-6 mb-5 md:mb-6">
        <div className="flex items-start justify-center gap-10 md:gap-20">
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-8 animate-pulse" />
            <div className="h-3.5 bg-gray-200 rounded w-10 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-8 animate-pulse" />
            <div className="h-3.5 bg-gray-200 rounded w-14 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-8 animate-pulse" />
            <div className="h-3.5 bg-gray-200 rounded w-14 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Section 3: Action buttons skeleton */}
      <div className="border-t border-gray-100 pt-5 md:pt-6 mb-1 md:mb-2">
        <div className="flex items-center justify-center gap-3">
          <div className="h-10 md:h-12 bg-gray-200 rounded-full w-32 md:w-36 animate-pulse" />
          <div className="h-10 md:h-12 bg-gray-200 rounded-full w-36 md:w-40 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSkeleton;
