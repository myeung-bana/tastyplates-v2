// ReviewCardSkeleton2.tsx - Matching ReviewCard2 Structure
import React from "react";

const ReviewCardSkeleton2: React.FC = () => {
  return (
    <div className="overflow-hidden animate-pulse">
      {/* Image Section - Standalone with rounded borders */}
      <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2">
        <div className="w-full h-full bg-gray-300" />
      </div>

      {/* Content Section - No background, minimal padding */}
      <div className="px-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-2">
          {/* User Avatar */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
          
          {/* User Name */}
          <div className="flex-1 min-w-0">
            <div className="h-3 bg-gray-300 rounded w-20" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded" />
            <div className="h-3 bg-gray-300 rounded w-6" />
          </div>
        </div>

        {/* Review Title */}
        <div className="h-3 bg-gray-300 rounded w-full mb-1" />

        {/* Review Content */}
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
};

export default ReviewCardSkeleton2;
