"use client";
import React from "react";

interface UserListItemSkeletonProps {
  count?: number;
}

const UserListItemSkeleton: React.FC<UserListItemSkeletonProps> = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`user-skeleton-${index}`} className="flex items-center gap-3 px-6 py-3 animate-pulse">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Name skeleton */}
            <div className="h-4 bg-gray-300 rounded w-24 mb-2" />
            
            {/* Cuisines skeleton */}
            <div className="flex gap-1 mt-1 flex-wrap">
              <div className="h-5 bg-gray-200 rounded-full w-16" />
              <div className="h-5 bg-gray-200 rounded-full w-12" />
            </div>
          </div>
          
          {/* Button skeleton */}
          <div className="h-7 bg-gray-300 rounded-[50px] w-20 flex-shrink-0" />
        </div>
      ))}
    </>
  );
};

export default UserListItemSkeleton;

