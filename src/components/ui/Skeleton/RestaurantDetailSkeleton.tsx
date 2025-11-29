import React  from "react";

const RestaurantDetailSkeleton = () => {
    return (
        <div className="restaurant-detail mt-4 md:mt-20 animate-pulse font-neusans">
            <div className="restaurant-detail__container !pt-0">
                {/* Mobile: Gallery First */}
                <div className="md:hidden">
                    <div className="h-64 bg-gray-300 rounded-2xl mx-2 mb-6"></div>
                </div>

                <div className="restaurant-detail__header">
                    <div className="restaurant-detail__info">
                        <div className="flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between px-2 gap-4 md:gap-0">
                                {/* Left Section: Image + Title/Categories */}
                                <div className="flex gap-3 md:gap-4 mt-6 md:mt-0">
                                    {/* Circular Image Skeleton */}
                                    <div className="flex-shrink-0">
                                        <div className="w-[150px] h-[150px] rounded-full bg-gray-300"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="h-7 md:h-8 w-48 md:w-64 bg-gray-300 rounded"></div>
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="h-5 w-20 bg-gray-300 rounded"></div>
                                            <div className="h-5 w-16 bg-gray-300 rounded"></div>
                                            <div className="h-5 w-16 bg-gray-300 rounded"></div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
                                            <div className="h-6 w-24 bg-gray-300 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Right Section: Action Buttons */}
                                <div className="flex flex-row gap-3 items-center md:items-start">
                                    <div className="h-10 w-32 bg-gray-300 rounded"></div>
                                    <div className="h-10 w-32 bg-gray-300 rounded"></div>
                                    <div className="h-10 w-24 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="flex flex-col lg:flex-row gap-8 px-2">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="space-y-8">
                            {/* Desktop: Featured Image */}
                            <div className="hidden md:block h-64 md:h-80 bg-gray-300 rounded-2xl"></div>

                            {/* Rating Section Skeleton */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-16 bg-gray-300 rounded mb-4"></div>
                                <div className="flex justify-around">
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-300 rounded mx-auto"></div>
                                        <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
                                        <div className="h-3 w-16 bg-gray-300 rounded mx-auto"></div>
                                    </div>
                                    <div className="h-[85%] border-l border-[#CACACA]"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-300 rounded mx-auto"></div>
                                        <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
                                        <div className="h-3 w-16 bg-gray-300 rounded mx-auto"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Community Recognition Skeleton */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-48 bg-gray-300 rounded mx-auto mb-4"></div>
                                <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex flex-col items-center w-full lg:w-auto space-y-2">
                                            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                                            <div className="h-6 w-12 bg-gray-300 rounded"></div>
                                            <div className="h-4 w-20 bg-gray-300 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Location Skeleton - Wide Map */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-20 bg-gray-300 rounded mb-4"></div>
                                <div className="space-y-4">
                                    <div className="h-96 bg-gray-300 rounded-xl"></div>
                                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sticky Sidebar */}
                    <div className="lg:w-[375px] lg:flex-shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            {/* Restaurant Details Skeleton - At Top */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-32 bg-gray-300 rounded mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 w-full bg-gray-300 rounded mb-4 pb-4 border-b border-gray-200"></div>
                                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                                </div>
                            </div>

                            {/* Quick Actions Skeleton */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section Skeleton */}
                <div className="mt-12 px-2">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="h-8 w-24 bg-gray-300 rounded mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="review-block animate-pulse">
                                    {/* Header */}
                                    <div className="review-block__header">
                                        <div className="review-block__user">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                            <div className="review-block__user-info">
                                                <div className="h-3 w-20 bg-gray-300 rounded mb-1"></div>
                                            </div>
                                        </div>
                                        <div className="review-block__rating">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, j) => (
                                                    <div key={j} className="w-3 h-3 bg-gray-300 rounded"></div>
                                                ))}
                                            </div>
                                            <div className="h-3 w-12 bg-gray-300 rounded ml-1"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="review-block__content">
                                        <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
                                        <div className="h-3 w-full bg-gray-300 rounded mb-1"></div>
                                        <div className="h-3 w-full bg-gray-300 rounded mb-1"></div>
                                        <div className="h-3 w-2/3 bg-gray-300 rounded"></div>
                                    </div>
                                    
                                    {/* Images */}
                                    <div className="review-block__image-container">
                                        <div className="w-25 h-25 bg-gray-300 rounded"></div>
                                        <div className="w-25 h-25 bg-gray-300 rounded"></div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="review-block__actions">
                                        <div className="h-6 w-12 bg-gray-300 rounded"></div>
                                        <div className="h-6 w-20 bg-gray-300 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RestaurantDetailSkeleton;