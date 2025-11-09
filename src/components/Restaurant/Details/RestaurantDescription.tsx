"use client";
import React, { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet/BottomSheet";
import { Listing } from "@/interfaces/restaurant/restaurant";

interface RestaurantDescriptionProps {
  restaurant: Listing;
}

const RestaurantDescription: React.FC<RestaurantDescriptionProps> = ({
  restaurant,
}) => {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (!restaurant.content) return null;

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg mb-4 font-neusans font-normal">
          Restaurant Description
        </h3>
        <div className="relative">
          <div
            className={`text-gray-700 leading-relaxed prose prose-sm max-w-none font-neusans font-normal ${
              restaurant.content.length > 300 && !isDescriptionExpanded
                ? "line-clamp-4"
                : ""
            }`}
            dangerouslySetInnerHTML={{ __html: restaurant.content }}
          />

          {restaurant.content.length > 300 && (
            <>
              {/* Mobile: Full-width button */}
              <button
                onClick={() => setShowDescriptionModal(true)}
                className="text-sm w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors md:hidden"
              >
                See More
              </button>

              {/* Desktop: Inline expansion */}
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-sm hidden md:inline text-[#E36B00] hover:text-[#D15A00] font-medium ml-1 transition-colors"
              >
                {isDescriptionExpanded ? "See Less" : "...See More"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description Modal */}
      <BottomSheet
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title={`${restaurant.title} - Description`}
        maxHeight="85vh"
        className="restaurant-description-modal"
      >
        <div className="p-6 pb-24">
          <div
            className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: restaurant.content }}
          />
        </div>
      </BottomSheet>
    </>
  );
};

export default RestaurantDescription;

