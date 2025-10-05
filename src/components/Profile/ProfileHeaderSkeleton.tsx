// ProfileHeaderSkeleton.tsx - For Profile Header Loading
import React from "react";

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 font-inter text-[#31343F]">
      {/* Profile Info Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gray-300 rounded-full animate-pulse" />
        </div>
        
        {/* Profile Details */}
        <div className="flex-1 min-w-0 w-full">
          {/* Name and Action Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="h-7 bg-gray-300 rounded w-32 animate-pulse" />
            </div>
            <div className="h-8 bg-gray-300 rounded-[50px] w-24 animate-pulse" />
          </div>
          
          {/* Stats Row */}
          <div className="flex gap-6 mb-4">
            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" />
          </div>
          
          {/* Bio Section */}
          <div className="mb-4">
            <div className="h-12 bg-gray-300 rounded w-full animate-pulse" />
          </div>
          
          {/* Palates Section */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-full w-14 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSkeleton;
