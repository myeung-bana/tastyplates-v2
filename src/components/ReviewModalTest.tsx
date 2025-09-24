"use client";
import { useState } from "react";
import ReviewDetailModal from "./ReviewDetailModal";
import ReviewDetailModal2 from "./ReviewDetailModal2";
import { GraphQLReview } from "@/types/graphql";

interface ReviewModalTestProps {
  data: GraphQLReview;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModalTest: React.FC<ReviewModalTestProps> = ({ data, isOpen, onClose }) => {
  const [useNewModal, setUseNewModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setUseNewModal(!useNewModal)}
          className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          {useNewModal ? "Switch to Original" : "Switch to Instagram Style"}
        </button>
      </div>

      {/* Modal Content */}
      <div className="relative z-10">
        {useNewModal ? (
          <ReviewDetailModal2
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

export default ReviewModalTest;
