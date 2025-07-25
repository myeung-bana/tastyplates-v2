import React  from "react";

const RestaurantDetailSkeleton = () => {
    return (
        <div className="restaurant-detail mt-32 md:mt-10 animate-pulse">
            <div className="restaurant-detail__container">
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
                            <div className="flex flex-row gap-6 mt-6 md:mt-0">
                                <div className="w-2/3 h-[307px] bg-gray-300 rounded-3xl"></div>
                                <div className="hidden md:flex flex-col justify-center w-1/3 gap-3">
                                    <div className="h-6 w-full bg-gray-300 rounded"></div>
                                    <div className="h-6 w-full bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 mt-10 mx-4 lg:mx-0 gap-4">
                        <div className="border border-[#CACACA] rounded-t-2xl lg:rounded-none lg:rounded-l-3xl p-4 space-y-4">
                            <div className="h-6 w-24 bg-gray-300 rounded mx-auto"></div>
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
                                <div className="h-[85%] border-l border-[#CACACA]"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-gray-300 rounded mx-auto"></div>
                                    <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
                                    <div className="h-3 w-16 bg-gray-300 rounded mx-auto"></div>
                                </div>
                            </div>
                        </div>
                        <div className="border border-[#CACACA] rounded-b-2xl lg:rounded-none lg:rounded-r-3xl p-4 space-y-4">
                            <div className="h-6 w-48 bg-gray-300 rounded mx-auto"></div>
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
                </div>

                <div className="restaurant-detail__content mt-10">
                    <div className="h-6 w-24 bg-gray-300 rounded mx-auto mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="border border-[#CACACA] rounded-lg p-4 space-y-2"
                            >
                                <div className="h-5 w-32 bg-gray-300 rounded"></div>
                                <div className="h-4 w-full bg-gray-300 rounded"></div>
                                <div className="h-4 w-full bg-gray-300 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RestaurantDetailSkeleton;