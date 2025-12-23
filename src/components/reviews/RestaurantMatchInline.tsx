"use client";

import React from 'react';
import Image from 'next/image';
import { RestaurantPlaceData, getPhotoUrl } from '@/lib/google-places-utils';
import { RestaurantV2 } from '@/app/api/v1/services/restaurantV2Service';
import { getBestAddress } from '@/utils/addressUtils';
import { MdClose } from 'react-icons/md';

interface RestaurantMatchInlineProps {
  googlePlaceData: RestaurantPlaceData;
  existingRestaurant: RestaurantV2 | null;
  onSelectExisting: (restaurant: RestaurantV2) => void;
  onCreateNew: (placeData: RestaurantPlaceData) => void;
  onClose: () => void;
}

/**
 * Inline component that shows restaurant match results below the search input
 * - If match found: Shows existing restaurant with recommendation to use it
 * - If no match: Shows new restaurant preview with option to create
 */
export function RestaurantMatchInline({
  googlePlaceData,
  existingRestaurant,
  onSelectExisting,
  onCreateNew,
  onClose,
}: RestaurantMatchInlineProps) {
  const photoUrl = googlePlaceData.photos && googlePlaceData.photos.length > 0
    ? getPhotoUrl(googlePlaceData.photos[0], 400)
    : null;

  const existingPhotoUrl = existingRestaurant?.featured_image_url || null;

  const handleUseExisting = () => {
    if (existingRestaurant) {
      onSelectExisting(existingRestaurant);
    }
  };

  const handleCreateNew = () => {
    onCreateNew(googlePlaceData);
  };

  return (
    <div className="mt-4 border border-[#E5E5E5] rounded-xl bg-white shadow-sm overflow-hidden font-neusans">
      {/* Close button */}
      <div className="flex justify-end p-2 border-b border-gray-100">
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <MdClose className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6">
        {existingRestaurant ? (
          <>
            {/* Existing Restaurant Found */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 font-neusans">
                We found this restaurant in our database. We recommend using the existing listing to keep reviews together.
              </p>
            </div>

            {/* Existing Restaurant Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex gap-4">
                {existingPhotoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={existingPhotoUrl}
                      alt={existingRestaurant.title}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-[#31343F] truncate font-neusans">
                    {existingRestaurant.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 font-neusans">
                    {getBestAddress(existingRestaurant.address as any, existingRestaurant.listing_street, 'Address not available')}
                  </p>
                  {existingRestaurant.average_rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium text-gray-700 font-neusans">
                        {existingRestaurant.average_rating.toFixed(1)}
                      </span>
                      {existingRestaurant.ratings_count && (
                        <span className="text-xs text-gray-500 font-neusans">
                          ({existingRestaurant.ratings_count} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleUseExisting}
                className="w-full bg-[#ff7c0a] text-white rounded-full py-3 px-6 font-semibold font-neusans hover:bg-[#e66d08] transition-colors"
              >
                Use This Restaurant
              </button>
              <button
                onClick={handleCreateNew}
                className="w-full border border-gray-300 text-gray-700 rounded-full py-3 px-6 font-semibold font-neusans hover:bg-gray-50 transition-colors"
              >
                Create New Listing Instead
              </button>
            </div>
          </>
        ) : (
          <>
            {/* No Match Found - New Restaurant */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 font-neusans">
                This restaurant is not in our database yet. You can create a new listing.
              </p>
            </div>

            {/* New Restaurant Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex gap-4">
                {photoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={photoUrl}
                      alt={googlePlaceData.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-[#31343F] truncate font-neusans">
                    {googlePlaceData.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 font-neusans">
                    {googlePlaceData.formatted_address || 'Address not available'}
                  </p>
                  {googlePlaceData.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium text-gray-700 font-neusans">
                        {googlePlaceData.rating.toFixed(1)}
                      </span>
                      {googlePlaceData.user_ratings_total && (
                        <span className="text-xs text-gray-500 font-neusans">
                          ({googlePlaceData.user_ratings_total} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCreateNew}
              className="w-full bg-[#ff7c0a] text-white rounded-full py-3 px-6 font-neusans hover:bg-[#e66d08] transition-colors"
            >
              Create New Restaurant Listing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
