import React  from "react";

const RestaurantDetailSkeleton = () => {
    return (
        <div className="restaurant-detail mt-32 md:mt-20 animate-pulse">
            <div className="restaurant-detail__container !max-w-7xl !pt-0">
                <div className="restaurant-detail__header">
                    <div className="restaurant-detail__info">
                        <div className="flex flex-col-reverse md:flex-col">
                            <div className="flex flex-col md:flex-row justify-between px-4 md:px-0">
                                <div className="mt-6 md:mt-0 space-y-3">
                                    <div className="h-10 w-48 bg-gray-300 rounded"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 bg-gray-300 rounded"></div>
                                        <div className="h-6 w-16 bg-gray-300 rounded"></div>
                                        <div className="h-6 w-16 bg-gray-300 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-4 mt-4 md:mt-0">
                                    <div className="h-10 w-32 bg-gray-300 rounded"></div>
                                    <div className="h-10 w-32 bg-gray-300 rounded"></div>
                                    <div className="h-10 w-24 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                            <div className="flex flex-row gap-6 mt-6 md:mt-10">
                                <div className="w-2/3 h-[307px] bg-gray-300 rounded-3xl"></div>
                                <div className="hidden md:flex flex-col justify-center w-1/3 gap-3">
                                    <div className="h-6 w-full bg-gray-300 rounded"></div>
                                    <div className="h-6 w-full bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two Column Layout Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-10">
                        {/* Left Column Skeleton (3/5 width) */}
                        <div className="lg:col-span-3 space-y-8">
                            {/* Featured Image Skeleton */}
                            <div className="h-64 md:h-80 bg-gray-300 rounded-2xl"></div>
                            
                            {/* Image Gallery Skeleton */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-32 bg-gray-300 rounded mb-4"></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-32 bg-gray-300 rounded"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Description Skeleton */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="h-6 w-16 bg-gray-300 rounded mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                                </div>
                            </div>

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
                                        <div
                                            key={i}
                                            className="flex flex-col items-center w-full lg:w-auto space-y-2"
                                        >
                                            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                                            <div className="h-6 w-12 bg-gray-300 rounded"></div>
                                            <div className="h-4 w-20 bg-gray-300 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column Skeleton (2/5 width) - Sticky */}
                        <div className="lg:col-span-2">
                            <div className="lg:sticky lg:top-24 space-y-6">
                                {/* Location Skeleton */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="h-6 w-20 bg-gray-300 rounded mb-4"></div>
                                    <div className="space-y-4">
                                        <div className="h-4 w-full bg-gray-300 rounded"></div>
                                        <div className="h-64 bg-gray-300 rounded-xl"></div>
                                    </div>
                                </div>

                                {/* Quick Actions Skeleton */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
                                        <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
                                        <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
                                    </div>
                                </div>

                                {/* Restaurant Details Skeleton */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="h-6 w-32 bg-gray-300 rounded mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-gray-300 rounded"></div>
                                        <div className="h-4 w-full bg-gray-300 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full-Width Reviews Section Skeleton */}
                    <div className="mt-12">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="h-8 w-24 bg-gray-300 rounded mb-6"></div>
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-5 w-32 bg-gray-300 rounded"></div>
                                                <div className="h-4 w-20 bg-gray-300 rounded"></div>
                                                <div className="h-4 w-full bg-gray-300 rounded"></div>
                                                <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                                            </div>
                                        </div>
                                        {i < 2 && <div className="border-t border-gray-200"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RestaurantDetailSkeleton;