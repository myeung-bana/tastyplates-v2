import React from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiStar, FiThumbsUp } from "react-icons/fi";
import { BiLike } from "react-icons/bi";
import { palates } from "@/data/dummyPalate";
import { users } from "@/data/dummyUsers";
import PhotoSlider from "./Restaurant/Details/PhotoSlider";

// Styles
import "@/styles/pages/_restaurant-details.scss";
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'

interface ReviewBlockProps {
  review: {
    id: string;
    authorId: string;
    restaurantId: string;
    user: string;
    rating: number;
    date: string;
    title?: string,
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
            className="review-block__user-image size-6 md:size-10"
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
          {[...Array(review.rating)].map((i, index) =>
            <FiStar key={index} className="review-block__star fill-[#31343F] stroke-none size-3 md:size-3.5" />
          )}
        </div>
      </div>
      <div className="review-block__content">
        <h3 className="text-xs md:text-base font-medium mb-2">{review?.title ?? 'Sample'}</h3>
        <p className="review-block__text">{review.comment}</p>
      </div>
      <div className="">
        {" "}
        {/* {review.images.length > 0 && review.images?.map((image) => (
          <Image
            src={image} // Display the first image from the review
            alt="Review"
            width={400}
            height={400}
            className="review-block__image"
          />
        ))} */}
        <PhotoSlider reviewPhotos={review.images} />
      </div>
      <div className="review-block__actions">
          <button className="review-block__action-btn">
            <BiLike className="size-6 fill-[#494D5D]"/>
            <span className="ml-2 text-center leading-6">2</span>
          </button>
          {/* <button className="review-block__action-btn">
            <FiMessageCircle />
          </button> */}
        </div>
    </div>
  );
};

export default ReviewBlock;
