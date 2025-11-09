"use client";
import React from "react";
import Image from "next/image";
import { FaPen, FaRegHeart, FaHeart } from "react-icons/fa";
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
  return (
    <div className="restaurant-detail__header">
      <div className="restaurant-detail__info">
        <div className="flex flex-col md:flex-col">
          <div className="flex flex-col md:flex-row justify-between px-2">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-6 md:mt-0">
              {/* Circular Featured Image - Desktop Only */}
              {restaurant.featuredImage?.node?.sourceUrl && (
                <div className="hidden md:block flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-gray-200">
                    <Image
                      src={restaurant.featuredImage.node.sourceUrl}
                      alt={restaurant.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h1 className="restaurant-detail__name leading-7 font-neusans font-normal">
                  {restaurant.title}
                </h1>
                <div className="restaurant-detail__meta">
                  <div className="restaurant-detail__cuisine">
                    {restaurant.palates.nodes.map((palate: { name: string }, index: number) => (
                      <div className="flex items-center gap-2" key={`palate-${index}`}>
                        {index > 0 && <span>&#8226;</span>}
                        <span className="cuisine-tag hover:!bg-transparent font-neusans font-normal">
                          {palate.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  &#8226;
                  <div className="restaurant-detail__price">
                    <span className="font-neusans font-normal">{restaurant.priceRange}</span>
                  </div>
                </div>
                
                {/* Categories Section */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {restaurant.listingCategories?.nodes?.length > 0 ? (
                      restaurant.listingCategories.nodes.map(
                        (category: { name: string; slug: string }, index: number) => (
                          <span
                            key={`category-${index}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans"
                          >
                            {category.name}
                          </span>
                        )
                      )
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-normal hover:bg-gray-200 transition-colors font-neusans">
                        Uncategorized
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row flex-wrap gap-3 items-center">
              <CheckInRestaurantButton restaurantSlug={restaurant.slug} />
              <button
                onClick={onAddReview}
                className="flex items-center gap-2 px-3 py-2 text-sm font-normal text-gray-700 hover:text-gray-900 hover:underline transition-colors font-neusans"
              >
                <FaPen className="w-4 h-4" />
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

