"use client";
import React from "react";
import { FiEdit3 } from "react-icons/fi";

interface RestaurantQuickActionsProps {
  onAddReview: () => void;
}

const RestaurantQuickActions: React.FC<RestaurantQuickActionsProps> = ({
  onAddReview,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={onAddReview}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-neusans font-normal"
        >
          <FiEdit3 className="w-4 h-4" />
          <span className="font-neusans font-normal text-white">
            Write a Review
          </span>
        </button>
      </div>
    </div>
  );
};

export default RestaurantQuickActions;

