"use client";
import React, { useMemo } from "react";
import { GraphQLReview } from "@/types/graphql";
import { useIsMobile } from "@/utils/deviceUtils";
import { formatDistanceToNow } from "date-fns";
import { FiStar, FiHeart, FiMessageCircle } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { generateProfileUrl, formatDate, capitalizeWords, stripTags } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import PalateTags from "../ui/PalateTags/PalateTags";
import "@/styles/components/_restaurant-reviews-mobile.scss";

interface RestaurantReviewsMobileProps {
  reviews: GraphQLReview[];
  restaurantId: number;
  onOpenModal: () => void;
}

const RestaurantReviewsMobile: React.FC<RestaurantReviewsMobileProps> = ({
  reviews,
  onOpenModal,
}) => {
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      let date: Date;
      
      if (dateString.includes('T') && dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('T')) {
        date = new Date(dateString + 'Z');
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          if (!year || !month || !day) return formatDate(dateString);
          const validDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(validDate.getTime())) {
            const relativeTime = formatDistanceToNow(validDate, { addSuffix: true });
            return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
          }
        }
        return formatDate(dateString);
      }
      
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch {
      return formatDate(dateString);
    }
  };

  // Sort reviews by date (newest first) and take first 3
  const displayReviews = useMemo(() => {
    const sorted = [...reviews].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted.slice(0, 3);
  }, [reviews]);

  const hasMoreReviews = reviews.length > 3;

  // Parse palate names from review
  const getPalateNames = (review: GraphQLReview): string[] => {
    if (!review.palates) return [];
    if (typeof review.palates === 'string') {
      return review.palates.split('|').map(p => p.trim()).filter(Boolean);
    }
    return [];
  };

  // Only render on mobile
  if (!isMobile) return null;

  if (displayReviews.length === 0) {
    return (
      <div className="restaurant-reviews-mobile">
        <h2 className="restaurant-reviews-mobile__title">
          Recommended Reviews ({reviews.length})
        </h2>
        <div className="restaurant-reviews-mobile__empty">
          <p>No reviews yet. Be the first to review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-reviews-mobile">
      <h2 className="restaurant-reviews-mobile__title">
        Recommended Reviews ({reviews.length})
      </h2>

      <div className="restaurant-reviews-mobile__list">
        {displayReviews.map((review) => {
          const images = review.reviewImages || [];
          const mainImage = images[0]?.sourceUrl || DEFAULT_REVIEW_IMAGE;
          const palateNames = getPalateNames(review);
          const reviewContent = stripTags(review.content || "");
          const truncatedContent = reviewContent.length > 150 
            ? reviewContent.slice(0, 150) + "..." 
            : reviewContent;

          return (
            <div key={review.id || review.databaseId} className="restaurant-reviews-mobile__card">
              {/* User Info */}
              <div className="restaurant-reviews-mobile__user-info">
                {review.author?.node?.databaseId ? (
                  session?.user?.id &&
                  String(session.user.id) === String(review.author?.node?.databaseId) ? (
                    <Link href={PROFILE}>
                      <FallbackImage
                        src={review.userAvatar || DEFAULT_USER_ICON}
                        alt={review.author?.node?.name || "User"}
                        width={40}
                        height={40}
                        className="restaurant-reviews-mobile__avatar"
                        type={FallbackImageType.Icon}
                      />
                    </Link>
                  ) : session ? (
                    <Link href={generateProfileUrl(review.author?.node?.databaseId)} prefetch={false}>
                      <FallbackImage
                        src={review.userAvatar || DEFAULT_USER_ICON}
                        alt={review.author?.node?.name || "User"}
                        width={40}
                        height={40}
                        className="restaurant-reviews-mobile__avatar"
                        type={FallbackImageType.Icon}
                      />
                    </Link>
                  ) : (
                    <FallbackImage
                      src={review.userAvatar || DEFAULT_USER_ICON}
                      alt={review.author?.node?.name || "User"}
                      width={40}
                      height={40}
                      className="restaurant-reviews-mobile__avatar"
                      type={FallbackImageType.Icon}
                    />
                  )
                ) : (
                  <FallbackImage
                    src={review.userAvatar || DEFAULT_USER_ICON}
                    alt={review.author?.node?.name || "User"}
                    width={40}
                    height={40}
                    className="restaurant-reviews-mobile__avatar"
                    type={FallbackImageType.Icon}
                  />
                )}

                <div className="restaurant-reviews-mobile__user-details">
                  <div className="restaurant-reviews-mobile__user-header">
                    <h3 className="restaurant-reviews-mobile__username">
                      {review.author?.node?.name || review.author?.name || "Unknown User"}
                    </h3>
                    {review.date && (
                      <span className="restaurant-reviews-mobile__timestamp">
                        {formatRelativeTime(review.date)}
                      </span>
                    )}
                  </div>
                  {review.reviewStars && (
                    <div className="restaurant-reviews-mobile__rating">
                      <FiStar className="w-3 h-3" />
                      <span>{review.reviewStars}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Content */}
              {review.reviewMainTitle && (
                <h4 className="restaurant-reviews-mobile__title-text">
                  {capitalizeWords(stripTags(review.reviewMainTitle))}
                </h4>
              )}
              
              {review.content && (
                <p className="restaurant-reviews-mobile__content">
                  {truncatedContent}
                </p>
              )}

              {/* Palate Tags */}
              {palateNames.length > 0 && (
                <div className="restaurant-reviews-mobile__palates">
                  <PalateTags palateNames={palateNames} maxTags={2} />
                </div>
              )}

              {/* Review Images */}
              {images.length > 0 && (
                <div className="restaurant-reviews-mobile__images">
                  {images.slice(0, 2).map((img, index) => (
                    <FallbackImage
                      key={index}
                      src={img.sourceUrl || DEFAULT_REVIEW_IMAGE}
                      alt={`Review image ${index + 1}`}
                      width={130}
                      height={130}
                      className="restaurant-reviews-mobile__image"
                      type={FallbackImageType.Default}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="restaurant-reviews-mobile__actions">
                <div className="restaurant-reviews-mobile__action-item">
                  <FiHeart className="w-4 h-4" />
                  <span>{review.commentLikes || 0}</span>
                </div>
                <div className="restaurant-reviews-mobile__action-item">
                  <FiMessageCircle className="w-4 h-4" />
                  <span>0</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* See All Reviews Button */}
      {hasMoreReviews && (
        <button
          className="restaurant-reviews-mobile__see-all-btn"
          onClick={onOpenModal}
        >
          See All Reviews
        </button>
      )}
    </div>
  );
};

export default RestaurantReviewsMobile;

