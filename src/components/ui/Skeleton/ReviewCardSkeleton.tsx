import React from "react";

interface ReviewCardSkeletonProps {
  width?: number;
}

const ReviewCardSkeleton: React.FC<ReviewCardSkeletonProps> = ({ width = 304 }) => {
  return (
    <div className="overflow-hidden animate-pulse">
      {/* Main review image */}
      <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2">
        <div className="bg-gray-300 w-full h-full" />
      </div>

      {/* User info section with palate tags */}
      <div className="px-0">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-300 rounded w-24 mb-1" />
            {/* Palate tags */}
            <div className="flex flex-row flex-wrap gap-1">
              <div className="h-5 bg-gray-200 rounded-full w-16" />
              <div className="h-5 bg-gray-200 rounded-full w-20" />
            </div>
          </div>
          {/* Rating */}
          <div className="ml-auto inline-flex shrink-0">
            <div className="w-4 h-4 bg-gray-300 rounded" />
          </div>
        </div>

        {/* Content */}
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
};

export default ReviewCardSkeleton;
