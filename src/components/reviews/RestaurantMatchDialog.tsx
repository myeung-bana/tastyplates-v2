"use client";

import React from 'react';
import Image from 'next/image';
import CustomModal from '@/components/ui/Modal/Modal';
import { RestaurantPlaceData, getPhotoUrl } from '@/lib/google-places-utils';
import { RestaurantV2 } from '@/app/api/v1/services/restaurantV2Service';
import { getBestAddress } from '@/utils/addressUtils';

interface RestaurantMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googlePlaceData: RestaurantPlaceData;
  existingRestaurant: RestaurantV2 | null;
  onSelectExisting: (restaurant: RestaurantV2) => void;
  onCreateNew: (placeData: RestaurantPlaceData) => void;
}

/**
 * Dialog component that shows restaurant match results
 * - If match found: Shows existing restaurant with recommendation to use it
 * - If no match: Shows new restaurant preview with option to create
 */
export function RestaurantMatchDialog({
  open,
  onOpenChange,
  googlePlaceData,
  existingRestaurant,
  onSelectExisting,
  onCreateNew,
}: RestaurantMatchDialogProps) {
  const photoUrl = googlePlaceData.photos && googlePlaceData.photos.length > 0
    ? getPhotoUrl(googlePlaceData.photos[0], 400)
    : null;

  const existingPhotoUrl = existingRestaurant?.featured_image_url || null;

  const handleUseExisting = () => {
    if (existingRestaurant) {
      onSelectExisting(existingRestaurant);
      onOpenChange(false);
    }
  };

  const handleCreateNew = () => {
    onCreateNew(googlePlaceData);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-4">
      {existingRestaurant ? (
        <>
          {/* Existing Restaurant Found */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              We found this restaurant in our database. We recommend using the existing listing to keep reviews together.
            </p>
          </div>

          {/* Existing Restaurant Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {existingRestaurant.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {getBestAddress(existingRestaurant.address as any, existingRestaurant.listing_street, 'Address not available')}
                </p>
                {existingRestaurant.average_rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-700">
                      {existingRestaurant.average_rating.toFixed(1)}
                    </span>
                    {existingRestaurant.ratings_count && (
                      <span className="text-xs text-gray-500">
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
              className="w-full bg-[#ff7c0a] text-white rounded-lg py-3 px-4 font-semibold hover:bg-[#e66d08] transition-colors"
            >
              Use This Restaurant
            </button>
            <button
              onClick={handleCreateNew}
              className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 px-4 font-semibold hover:bg-gray-50 transition-colors"
            >
              Create New Listing Instead
            </button>
          </div>
        </>
      ) : (
        <>
          {/* No Match Found - New Restaurant */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              This restaurant is not in our database yet. You can create a new listing.
            </p>
          </div>

          {/* New Restaurant Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {googlePlaceData.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {googlePlaceData.formatted_address || 'Address not available'}
                </p>
                {googlePlaceData.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-700">
                      {googlePlaceData.rating.toFixed(1)}
                    </span>
                    {googlePlaceData.user_ratings_total && (
                      <span className="text-xs text-gray-500">
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
            className="w-full bg-[#ff7c0a] text-white rounded-lg py-3 px-4 font-semibold hover:bg-[#e66d08] transition-colors"
          >
            Create New Restaurant Listing
          </button>
        </>
      )}
    </div>
  );

  return (
    <CustomModal
      isOpen={open}
      setIsOpen={onOpenChange}
      header="Tag Restaurant Location"
      content={content}
      hasFooter={false}
      baseClass="max-w-md"
    />
  );
}
