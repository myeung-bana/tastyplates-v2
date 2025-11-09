"use client";
import React from "react";
import { FiMapPin } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";
import RestaurantMap from "./RestaurantMap";
import { getBestAddress } from "@/utils/addressUtils";

interface RestaurantLocationSectionProps {
  restaurant: Listing;
}

const RestaurantLocationSection: React.FC<RestaurantLocationSectionProps> = ({
  restaurant,
}) => {
  const lat = parseFloat(
    restaurant?.listingDetails?.googleMapUrl?.latitude || "0"
  );
  const lng = parseFloat(
    restaurant?.listingDetails?.googleMapUrl?.longitude || "0"
  );
  const address = getBestAddress(
    restaurant?.listingDetails?.googleMapUrl,
    restaurant?.listingStreet,
    "No address available"
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">Location</h3>
      <div className="space-y-4">
        {(lat && lng) || address || restaurant?.listingDetails?.googleMapUrl ? (
          <div className="h-64 rounded-xl overflow-hidden">
            <RestaurantMap
              lat={lat}
              lng={lng}
              googleMapUrl={restaurant?.listingDetails?.googleMapUrl}
              address={address}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500 rounded-xl font-neusans">
            <FiMapPin className="w-5 h-5 mr-2" />
            <span className="font-normal">Map location not available</span>
          </div>
        )}

        {address && address !== "No address available" && (
          <div className="flex items-start gap-3 pt-2">
            <FiMapPin className="text-gray-500 mt-1" />
            <span className="text-gray-700 font-neusans text-sm font-normal">
              {address}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantLocationSection;

