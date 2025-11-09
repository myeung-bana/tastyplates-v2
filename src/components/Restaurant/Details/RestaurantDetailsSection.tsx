"use client";
import React from "react";
import { FiClock, FiPhone, FiDollarSign } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";

interface RestaurantDetailsSectionProps {
  restaurant: Listing;
}

const RestaurantDetailsSection: React.FC<RestaurantDetailsSectionProps> = ({
  restaurant,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">
        Restaurant Details
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <FiClock className="w-5 h-5 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-normal font-neusans text-gray-500">
              Opening Hours
            </span>
            <span className="text-gray-700 font-neusans font-normal">
              {restaurant.listingDetails?.openingHours || "Not available"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FiPhone className="w-5 h-5 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-normal font-neusans text-gray-500">
              Phone
            </span>
            <span className="text-gray-700 font-neusans font-normal">
              {restaurant.listingDetails?.phone || "Not available"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FiDollarSign className="w-5 h-5 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-normal font-neusans text-gray-500">
              Price Range
            </span>
            <span className="text-gray-700 font-neusans font-normal">
              {restaurant.priceRange || "Not available"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsSection;

