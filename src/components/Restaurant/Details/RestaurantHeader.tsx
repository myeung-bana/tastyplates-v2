"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiPhone, FiGlobe, FiNavigation } from "react-icons/fi";
import { Listing } from "@/interfaces/restaurant/restaurant";
import CheckInRestaurantButton from "@/components/Restaurant/CheckInRestaurantButton";
import SaveRestaurantButton from "./SaveRestaurantButton";

interface RestaurantHeaderProps {
  restaurant: Listing;
  onAddReview: () => void;
  onShowSignin: () => void;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurant,
  onAddReview,
  onShowSignin,
}) => {
  // Get price range display name from restaurant_price_range relationship
  const priceRangeDisplay = restaurant.restaurant_price_range?.display_name || '';

  // Extract location from listing_street or address
  const getLocation = () => {
    // First priority: Use listing_street as-is (full address from database)
    if (restaurant.listingStreet) {
      return restaurant.listingStreet;
    }
    
    // Second priority: Try to construct from normalized googleMapUrl (camelCase)
    const googleMapUrl = restaurant.listingDetails?.googleMapUrl;
    if (googleMapUrl) {
      const city = googleMapUrl.city;
      const state = googleMapUrl.stateShort || googleMapUrl.state;
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
    }
    
    return "Address not available";
  };

  // Get primary palate (ethnic category)
  const primaryPalate = restaurant.palates?.nodes?.[0]?.name || null;

  // Get categories (Bar, Family Restaurant, etc.)
  const categories = restaurant.listingCategories?.nodes || [];

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
    // Fallback to search by name + location
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.title + ' ' + getLocation())}`;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="p-4 md:p-6">
        {/* Main Content: Image + Info */}
        <div className="flex gap-4 mb-6">
          {/* Circular Image - 120x120px */}
          <div className="flex-shrink-0">
            {restaurant.featuredImage?.node?.sourceUrl ? (
              <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md">
                <Image
                  src={restaurant.featuredImage.node.sourceUrl}
                  alt={restaurant.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-4 ring-gray-100 shadow-md">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
          </div>

          {/* Restaurant Info */}
          <div className="flex-1 min-w-0">
          {/* Primary Ethnic Palate */}
          {primaryPalate && (
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-orange-50 text-[#ff7c0a] rounded-full text-sm font-medium font-neusans">
                  {primaryPalate}
                </span>
              </div>
            )}
            {/* Restaurant Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-neusans leading-tight">
              {restaurant.title}
            </h1>
            {/* Location Badge - Top */}
            <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-2">
              <FiMapPin className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{getLocation()}</span>
            </div>

            {/* Categories with Bullet Separator */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm mb-2 font-neusans">
                {categories.map((category: { name: string; slug: string }, index: number) => (
                  <React.Fragment key={`cat-${index}`}>
                    <Link
                      href={`/restaurants/cuisines/${category.slug}`}
                      className="hover:text-[#ff7c0a] transition-colors font-neusans"
                    >
                      {category.name}
                    </Link>
                    {index < categories.length - 1 && (
                      <span className="text-gray-400 font-neusans">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Price Range */}
            {priceRangeDisplay && (
              <div className="text-gray-600 text-sm font-medium">
                {priceRangeDisplay}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <SaveRestaurantButton
            restaurantSlug={restaurant.slug}
            onShowSignin={onShowSignin}
          />
          <CheckInRestaurantButton restaurantSlug={restaurant.slug} />
          
          {/* Directions */}
          <a
            href={getDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans"
          >
            <FiNavigation className="w-4 h-4 text-gray-500" />
            <span>Directions</span>
          </a>
          
          {/* Call */}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans"
            >
              <FiPhone className="w-4 h-4 text-gray-500" />
              <span>Call</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-[50px] cursor-not-allowed font-normal text-sm font-neusans opacity-50"
            >
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Call</span>
            </button>
          )}
          
          {/* Website */}
          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans"
            >
              <FiGlobe className="w-4 h-4 text-gray-500" />
              <span>Website</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-[50px] cursor-not-allowed font-normal text-sm font-neusans opacity-50"
            >
              <FiGlobe className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Website</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;

