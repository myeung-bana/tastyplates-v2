import React from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiStar } from "react-icons/fi";
import "@/styles/pages/_restaurant-details.scss";
import { palates } from "@/data/dummyPalate";
import { users } from "@/data/dummyUsers";

interface ReviewBlockProps {
  review: {
    id: string;
    authorId: string;
    restaurantId: string;
    user: string;
    rating: number;
    date: string;
    comment: string;
    images: string[];
    userImage: string;
  };
}

const ReviewBlock = ({ review }: ReviewBlockProps) => {
  const author = users.find((user) => user.id === review.authorId);
  const palateNames = author?.palateIds
    .map((id) => {
      const palate = palates.find((p) => p.id === id);
      return palate ? palate.name : null; // Return the name or null if not found
    })
    .filter((name) => name); // Filter out any null values

  return (
    <div className="review-block">
      <div className="review-block__header">
        <div className="review-block__user">
          <Image
            src={author?.image || "/images/default_user.png"} // Fallback image if author is not found
            alt={author?.name || "User"} // Fallback name if author is not found
            width={40}
            height={40}
            className="review-block__user-image"
          />
          <div className="review-block__user-info">
            <h3 className="review-block__username">
              {author?.name || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags">
              {palateNames?.map((tag, index) => (
                <span key={index} className="review-block__palate-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="review-block__rating">
          <FiStar className="review-block__star" /> <span>{review.rating}</span>
        </div>
      </div>
      <div className="review-block__image-container">
        {" "}
        {review.images.length > 0 && (
          <Image
            src={review.images[0]} // Display the first image from the review
            alt="Review"
            width={400}
            height={400}
            className="review-block__image"
          />
        )}
      </div>
      <div className="review-block__content">
        <div className="review-block__actions">
          <button className="review-block__action-btn">
            <FiHeart />
            <span>2</span>
          </button>
          <button className="review-block__action-btn">
            <FiMessageCircle />
          </button>
        </div>
        <p className="review-block__text">{review.comment}</p>
      </div>
    </div>
  );
};

export default ReviewBlock;
