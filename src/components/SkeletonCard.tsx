import React from "react";

const SkeletonCard = () => {
    return (
        <div className="restaurant-card animate-pulse">
            <div className="restaurant-card__image relative">
                <div className="bg-gray-300 w-[304px] h-[228px] rounded-lg" />
                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
                    <div className="w-8 h-8 bg-white rounded-full" />
                    <div className="w-8 h-8 bg-white rounded-full" />
                </div>
            </div>
            <div className="restaurant-card__content">
                <div className="restaurant-card__header">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-300 rounded w-1/4"></div>
                </div>
                <div className="restaurant-card__info">
                    <div className="h-3 bg-gray-200 rounded w-5/6 my-1"></div>
                </div>
                <div className="restaurant-card__tags flex flex-wrap gap-2 mt-2">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
