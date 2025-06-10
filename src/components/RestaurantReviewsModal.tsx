import React from "react";
import RestaurantReviews from "@/components/RestaurantReviews";
import { getRestaurantReviews } from "@/utils/reviewUtils";
import { Restaurant } from "./RestaurantCard";

interface RestaurantReviewsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  restaurant: Restaurant;
}

const RestaurantReviewsModal: React.FC<RestaurantReviewsModalProps> = ({ isOpen, setIsOpen, restaurant }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />
      {/* Right-side modal */}
      <div className="relative w-full max-w-xl h-full bg-white shadow-xl flex flex-col overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#31343F]">
            Reviews · {getRestaurantReviews(restaurant.id).length}
          </h2>
          <button
            className="text-2xl text-gray-400 hover:text-gray-700"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <RestaurantReviews
            reviewlist={[
              {
                reviews: getRestaurantReviews(restaurant.id).map((review) => ({
                  ...review,
                  user: ""
                }))
              }
            ]}
            hideFilters={true}
            hideTabs={true}
          />
        </div>
      </div>
      <style jsx global>{`
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantReviewsModal;
// Ensure RestaurantReviews component does not render any filter/sort UI when used in this modal.
