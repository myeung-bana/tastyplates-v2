"use client";
import { useState } from "react";
import ReviewDetailModal from "./ReviewDetailModal";
import InstagramReviewModal from "./InstagramReviewModal";
import { GraphQLReview } from "@/types/graphql";

interface ReviewModalComparisonProps {
  data: GraphQLReview;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModalComparison: React.FC<ReviewModalComparisonProps> = ({ data, isOpen, onClose }) => {
  const [useInstagramModal, setUseInstagramModal] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Modal Comparison</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setUseInstagramModal(true)}
              className={`px-3 py-1 text-xs rounded ${
                useInstagramModal 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Instagram Style
            </button>
            <button
              onClick={() => setUseInstagramModal(false)}
              className={`px-3 py-1 text-xs rounded ${
                !useInstagramModal 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Original
            </button>
          </div>
        </div>
      </div>

      {/* Modal Content */}
      <div className="relative z-10">
        {useInstagramModal ? (
          <InstagramReviewModal
            data={data}
            isOpen={isOpen}
            onClose={onClose}
          />
        ) : (
          <ReviewDetailModal
            data={data}
            isOpen={isOpen}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default ReviewModalComparison;
