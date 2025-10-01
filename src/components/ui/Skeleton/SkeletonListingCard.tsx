import React from "react";

const SkeletonListingCard = () => (
  <div className="relative overflow-hidden rounded-md animate-pulse bg-gray-100">
    <div className="restaurant-card__image relative bg-gray-200">
      <div className="w-[304px] h-[228px] bg-gray-300" />
      <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4">
        <div className="rounded-full p-2 bg-gray-300 w-8 h-8" />
      </div>
    </div>
    <div className="restaurant-card__content p-4">
      <div className="restaurant-card__header mb-2">
        <div className="h-4 w-1/2 bg-gray-300 rounded mb-2" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-300 rounded" />
          ))}
        </div>
      </div>
      <div className="h-3 w-3/4 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-full bg-gray-200 rounded mb-3" />
      <div className="h-3 w-1/2 bg-gray-200 rounded" />
    </div>
  </div>
);

export default SkeletonListingCard;
