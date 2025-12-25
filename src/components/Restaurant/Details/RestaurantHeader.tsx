"use client";
import React from "react";
import Image from "next/image";
import { FiEdit3 } from "react-icons/fi";
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
  // Uses price_range_id to fetch display_name from restaurant_price_ranges table
  const priceRangeDisplay = restaurant.restaurant_price_range?.display_name || '';

  // Check if palates exist
  const hasPalates = restaurant.palates?.nodes && restaurant.palates.nodes.length > 0;

  return (
    <div className="restaurant-detail__header">
      <div className="restaurant-detail__info">
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row justify-between px-2 gap-4 md:gap-0">
            {/* Left Section: Image + Title/Categories */}
            <div className="flex gap-3 md:gap-4 mt-6 md:mt-0 items-center">
              {/* Circular Featured Image - Both Mobile and Desktop */}
              {restaurant.featuredImage?.node?.sourceUrl ? (
                <div className="flex-shrink-0">
                  <div className="relative w-[150px] h-[150px] rounded-full overflow-hidden ring-2 ring-gray-200">
                    <Image
                      src={restaurant.featuredImage.node.sourceUrl}
                      alt={restaurant.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <div className="relative w-[150px] h-[150px] rounded-full overflow-hidden ring-2 ring-gray-200 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs md:text-sm">No Image</span>
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {/* Cuisine Categories - Above Title as pill-shaped tags */}
                {restaurant.listingCategories?.nodes && restaurant.listingCategories.nodes.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {restaurant.listingCategories.nodes.map((category: { name: string; slug: string }, index: number) => (
                      <span 
                        key={`category-${index}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans inline-block"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans inline-block">
                      Cuisine Pending
                    </span>
                  </div>
                )}

                {/* Restaurant Title */}
                <h1 className="restaurant-detail__name leading-7 font-neusans font-normal mb-2">
                  {restaurant.title}
                </h1>

                {/* Price Range Tag - Separate from Palates */}
                {priceRangeDisplay && (
                  <div className="mb-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans inline-block">
                      {priceRangeDisplay}
                    </span>
                  </div>
                )}

                {/* Palates or Establishment Categories */}
                <div className="restaurant-detail__meta mb-2">
                  <div className="restaurant-detail__cuisine">
                    {hasPalates ? (
                      <div className="flex flex-wrap gap-2">
                        {restaurant.palates.nodes.map((palate: { name: string }, index: number) => (
                          <span 
                            key={`palate-${index}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans inline-block"
                          >
                            {palate.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      (() => {
                        // Show Establishment Categories (from restaurant.categories) with "/" separator
                        // Prefer parent categories, but show all if no parent categories exist
                        const allCategories = restaurant.categories?.nodes || [];
                        const parentCategories = allCategories.filter(
                          (cat: { parent_id?: number | null }) => cat.parent_id === null || cat.parent_id === undefined
                        );
                        
                        // Use parent categories if available, otherwise use all categories
                        const categoriesToShow = parentCategories.length > 0 ? parentCategories : allCategories;
                        
                        if (categoriesToShow.length > 0) {
                          return (
                            <span className="cuisine-tag hover:!bg-transparent font-neusans font-normal text-gray-700">
                              {categoriesToShow.map((cat: { name: string }) => cat.name).join(' / ')}
                            </span>
                          );
                        }
                        
                        // If no establishment categories exist, show fallback
                        return (
                          <span className="cuisine-tag hover:!bg-transparent font-neusans font-normal text-gray-700">
                            General Restaurant
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Right Section: Action Buttons */}
            <div className="flex flex-row flex-wrap gap-3 items-center md:items-start">
              <CheckInRestaurantButton restaurantSlug={restaurant.slug} />
              <button
                onClick={onAddReview}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
              >
                <FiEdit3 className="w-4 h-4 text-gray-500" />
                <span>Write a Review</span>
              </button>
              <SaveRestaurantButton
                restaurantSlug={restaurant.slug}
                onShowSignin={onShowSignin}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;

