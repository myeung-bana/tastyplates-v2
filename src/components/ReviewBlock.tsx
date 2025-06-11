import React from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiStar, FiThumbsUp } from "react-icons/fi";
import { BiLike } from "react-icons/bi";
// import { palates } from "@/data/dummyPalate";
// import { users } from "@/data/dummyUsers";
import PhotoSlider from "./Restaurant/Details/PhotoSlider";

// Styles
import "@/styles/pages/_restaurant-details.scss";
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import { formatDate, formatDateT, stripTags } from "@/lib/utils";

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
    recognitions?: string[];
    palateNames?: string[];      // <-- add this
    commentLikes?: number;       // <-- add this
    userLiked?: boolean;         // <-- add this
  };
}

const ReviewBlock = ({ review }: ReviewBlockProps) => {
  // const author = users.find((user) => user.id === review.authorId);
  // const palateNames = (review?.palateNames ?? [])
  //   .map((id) => {
  //     const palate = palates.find((p) => p.id === id);
  //     return palate ? palate.name : null; // Return the name or null if not found
  //   })
  //   .filter((name) => name); // Filter out any null values

  return (
    <div className="review-block px-4 py-4">
      <div className="review-block__header">
        <div className="review-block__user">
          <Image
            src={review?.userImage || "/profile-icon.svg"} // Fallback image if author is not found
            alt={review?.user || "User"} // Fallback name if author is not found
            width={40}
            height={40}
            className="review-block__user-image size-6 md:size-10"
          />
          <div className="review-block__user-info">
            <h3 className="review-block__username">
              {review?.user || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags">
              {review.palateNames?.map((tag, index) => (
                <span key={index} className="review-block__palate-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="review-block__rating">
          {Array.from({ length: 5 }, (_, i) => {
            const full = i + 1 <= review.rating;
            const half = !full && i + 0.5 <= review.rating;
            return full ? (
              <Image src="/star-filled.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
            ) : (
              <Image src="/star.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
            );
          })}
          {/* {[...Array(review.rating)].map((i, index) =>
            <FiStar key={index} className="review-block__star fill-[#31343F] stroke-none size-3 md:size-3.5" />
          )} */}
          <span className="text-[#494D5D] text-[10px] md:text-sm p-2">&#8226;</span>
          <span className="review-card__timestamp">
            {formatDateT(review.date)}
          </span>
        </div>
        <div className="review-block__recognitions flex gap-2">
          {Array.isArray(review.recognitions) && review.recognitions.filter(tag => tag && tag.trim() !== '').length > 0 && (
            <div className="review-block__recognitions flex gap-2">
              {review.recognitions
                .filter(tag => tag && tag.trim() !== '')
                .map((tag, index) => (
                  <span key={index} className="review-block__recognitions flex items-center !w-fit !rounded-[50px] !px-3 !py-1 border-[1.5px] border-[#494D5D]">
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
      <div className="review-block__content">
        <h3 className="text-xs md:text-base font-medium mb-2">{stripTags(review?.title || "") ?? "Dorem ipsum dolor title."}</h3>
        <p className="review-block__text">{stripTags(review.comment || "") || "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}</p>
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
          <BiLike className="size-6 fill-[#494D5D]" />
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