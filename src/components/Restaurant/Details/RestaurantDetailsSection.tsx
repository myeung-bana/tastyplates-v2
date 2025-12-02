"use client";
import React from "react";
import { FiPhone, FiDollarSign } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";
import OpeningHoursDisplay from "./OpeningHoursDisplay";
import { usePriceRanges } from "@/hooks/usePriceRanges";

interface RestaurantDetailsSectionProps {
  restaurant: Listing;
}

const RestaurantDetailsSection: React.FC<RestaurantDetailsSectionProps> = ({
  restaurant,
}) => {
  // Use the price ranges hook to get display name
  const { getDisplayNameById } = usePriceRanges();
  
  // Get price range display name - try relationship first, then hook, then fallback
  const priceRangeDisplay = restaurant.restaurant_price_range?.display_name 
    || (restaurant.price_range_id ? getDisplayNameById(restaurant.price_range_id) : null)
    || restaurant.priceRange
    || 'Not available';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">
        Restaurant Details
      </h3>
      <div className="space-y-4">
        {/* Restaurant Description */}
        {restaurant.content && (
          <div className="pb-4 border-b border-gray-200">
            <div
              className="text-gray-700 leading-relaxed prose prose-sm max-w-none font-neusans font-normal text-sm line-clamp-6"
              dangerouslySetInnerHTML={{ __html: restaurant.content }}
            />
          </div>
        )}

        {/* Opening Hours - New Component */}
        <OpeningHoursDisplay openingHours={restaurant.listingDetails?.openingHours} />

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
              {priceRangeDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsSection;

