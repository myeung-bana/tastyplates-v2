"use client";
import React from "react";
import { FiMapPin, FiExternalLink } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";
import RestaurantMap from "./RestaurantMap";
import { formatAddressMultiLine, formatAddressSingleLine } from "@/utils/addressUtils";

interface RestaurantLocationSectionProps {
  restaurant: Listing;
  isWide?: boolean;
}

const RestaurantLocationSection: React.FC<RestaurantLocationSectionProps> = ({
  restaurant,
  isWide = false,
}) => {
  const lat = parseFloat(
    restaurant?.listingDetails?.googleMapUrl?.latitude || "0"
  );
  const lng = parseFloat(
    restaurant?.listingDetails?.googleMapUrl?.longitude || "0"
  );
  
  const googleMapUrl = restaurant?.listingDetails?.googleMapUrl;
  const hasLocationData = (lat && lng && !isNaN(lat) && !isNaN(lng)) || 
                          googleMapUrl?.placeId || 
                          googleMapUrl?.streetAddress ||
                          restaurant?.listingStreet;

  // Format address for display (single line)
  const singleLineAddress = formatAddressSingleLine(googleMapUrl || null) || restaurant?.listingStreet || null;

  // Generate Google Maps URL
  const getGoogleMapsUrl = (): string | null => {
    if (googleMapUrl?.placeId) {
      return `https://www.google.com/maps/place/?q=place_id:${googleMapUrl.placeId}`;
    }
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (singleLineAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(singleLineAddress)}`;
    }
    return null;
  };

  const googleMapsUrl = getGoogleMapsUrl();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">Location</h3>
      <div className="space-y-4">
        {hasLocationData ? (
          <div className={`${isWide ? 'h-96' : 'h-64'} rounded-xl overflow-hidden`}>
            <RestaurantMap
              lat={lat && !isNaN(lat) ? lat : undefined}
              lng={lng && !isNaN(lng) ? lng : undefined}
              googleMapUrl={googleMapUrl}
              address={singleLineAddress || restaurant?.listingStreet || undefined}
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center ${isWide ? 'h-96 md:h-[500px]' : 'h-40'} bg-gray-100 text-gray-500 rounded-xl font-neusans`}>
            <FiMapPin className="w-5 h-5 mr-2" />
            <span className="font-normal">Map location not available</span>
          </div>
        )}

        {singleLineAddress && (
          <div className="flex items-center gap-3 pt-2">
            <FiMapPin className="text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 font-neusans text-sm font-normal flex-1 min-w-0">
              {singleLineAddress}
            </span>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-[#ff7c0a] hover:text-[#e66d08] transition-colors"
                aria-label="Open in Google Maps"
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantLocationSection;

