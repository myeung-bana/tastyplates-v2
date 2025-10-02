import React from "react";
import { FaStar } from "react-icons/fa";

const SkeletonCard = () => {
    return (
        <div className="restaurant-card animate-pulse">
            <div className="restaurant-card__image relative">
                <div className="bg-gray-300 w-full h-[180px] md:h-[228px] rounded-lg" />
                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
                    <div className="w-8 h-8 bg-white rounded-full" />
                    <div className="w-8 h-8 bg-white rounded-full" />
                </div>
            </div>
            <div className="restaurant-card__content">
                <div className="restaurant-card__header">
                    {/* Restaurant name skeleton */}
                    <div className="h-4 md:h-4 bg-gray-300 rounded w-[220px] mb-2"></div>

                </div>
                
                <div className="restaurant-card__info">
                    {/* Location skeleton */}
                    <div className="h-3 md:h-3 bg-gray-200 rounded w-5/6 my-1"></div>
                </div>
                
                <div className="restaurant-card__tags flex flex-wrap gap-2 mt-1">
                    {/* Tags skeleton - matches actual design */}
                    <div className="h-3 md:h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 md:h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 md:h-3 bg-gray-200 rounded w-8"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
