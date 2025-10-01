import React from "react";

const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="restaurant-card animate-pulse">
      {/* Image section */}
      <div className="restaurant-card__image relative">
        <div className="bg-gray-300 w-full h-[180px] md:h-[228px] rounded-lg" />
        {/* Action buttons skeleton */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
          <div className="w-8 h-8 bg-white rounded-full" />
          <div className="w-8 h-8 bg-white rounded-full" />
        </div>
      </div>

      {/* Content section */}
      <div className="restaurant-card__content p-3">
        {/* Header with name and rating */}
        <div className="restaurant-card__header mb-2">
          <div className="h-4 md:h-5 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="flex items-center gap-1">
            <div className="h-4 md:h-4 bg-gray-300 rounded w-16" />
            <div className="h-3 md:h-3 bg-gray-200 rounded w-8" />
          </div>
        </div>

        {/* Restaurant info */}
        <div className="restaurant-card__info mb-3">
          <div className="h-3 md:h-3 bg-gray-200 rounded w-5/6 mb-1" />
          <div className="h-3 md:h-3 bg-gray-200 rounded w-4/6" />
        </div>

        {/* Tags section */}
        <div className="restaurant-card__tags flex flex-wrap gap-2">
          <div className="h-3 md:h-6 bg-gray-200 rounded-full w-12" />
          <div className="h-3 md:h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-3 md:h-6 bg-gray-200 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
};

export default RestaurantCardSkeleton;
