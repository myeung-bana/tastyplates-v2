"use client";
import React from "react";
import { FiEdit3, FiPhone, FiGlobe, FiNavigation } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";

interface RestaurantQuickActionsProps {
  onAddReview: () => void;
  restaurant: Listing;
}

const RestaurantQuickActions: React.FC<RestaurantQuickActionsProps> = ({
  onAddReview,
  restaurant,
}) => {
  // Get phone number
  const phone = restaurant.listingDetails?.phone;
  
  // Get website/menu URL
  const websiteUrl = restaurant.listingDetails?.menuUrl;
  
  // Get directions URL
  const getDirectionsUrl = () => {
    const lat = restaurant.listingDetails?.latitude;
    const lng = restaurant.listingDetails?.longitude;
    if (lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    // Fallback to search by name
    const city = restaurant.listingDetails?.googleMapUrl?.city;
    const state = restaurant.listingDetails?.googleMapUrl?.stateShort || restaurant.listingDetails?.googleMapUrl?.state;
    const location = city && state ? `${city}, ${state}` : restaurant.listingStreet || '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.title + ' ' + location)}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {/* Write a Review */}
        <button
          onClick={onAddReview}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-50 transition-colors font-neusans font-normal"
        >
          <FiEdit3 className="w-4 h-4" />
          <span className="font-neusans font-normal">
            Write a Review
          </span>
        </button>

        {/* Website */}
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-50 transition-colors font-neusans font-normal"
          >
            <FiGlobe className="w-4 h-4" />
            <span className="font-neusans font-normal">Website</span>
          </a>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-400 border-2 border-gray-200 rounded-xl cursor-not-allowed font-neusans font-normal"
          >
            <FiGlobe className="w-4 h-4" />
            <span className="font-neusans font-normal">Website</span>
          </button>
        )}

        {/* Call */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-50 transition-colors font-neusans font-normal"
          >
            <FiPhone className="w-4 h-4" />
            <span className="font-neusans font-normal">Call</span>
          </a>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-400 border-2 border-gray-200 rounded-xl cursor-not-allowed font-neusans font-normal"
          >
            <FiPhone className="w-4 h-4" />
            <span className="font-neusans font-normal">Call</span>
          </button>
        )}

        {/* Directions */}
        <a
          href={getDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-50 transition-colors font-neusans font-normal"
        >
          <FiNavigation className="w-4 h-4" />
          <span className="font-neusans font-normal">Directions</span>
        </a>
      </div>
    </div>
  );
};

export default RestaurantQuickActions;

