"use client";
import React, { useState } from "react";
import { FiX, FiStar } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  onSubmit: (review: { rating: number; comment: string; date: string }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating,
      comment,
      date: new Date().toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <button className="review-modal__close" onClick={onClose}>
          <FiX />
        </button>
        <h2 className="review-modal__title">Write a Review</h2>
        <form onSubmit={handleSubmit} className="review-modal__form">
          <div className="review-modal__rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${
                  star <= (hoveredRating || rating) ? "active" : ""
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <FiStar />
              </button>
            ))}
          </div>
          <textarea
            className="review-modal__input"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={4}
          />
          <button type="submit" className="review-modal__submit">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
