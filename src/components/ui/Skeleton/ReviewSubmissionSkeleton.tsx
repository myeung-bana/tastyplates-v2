// components/Skeletons/ReviewSubmissionSkeleton.tsx
import React from "react";

const ReviewSubmissionSkeleton = () => {
  return (
    <div className="submitRestaurants mt-16 md:mt-20 animate-pulse">
      <div className="submitRestaurants__container">
        <div className="submitRestaurants__card space-y-6">
          {/* Title */}
          <div className="h-6 w-1/3 bg-gray-300 rounded"></div>

          {/* Rating */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-200 rounded w-full"></div>
          </div>

          {/* Upload Photos */}
          <div className="space-y-2">
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-[140px] h-[100px] bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="h-4 w-40 bg-gray-300 rounded"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-36 h-10 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center">
            <div className="h-10 w-40 bg-gray-300 rounded"></div>
            <div className="h-10 w-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmissionSkeleton;
