'use client';
import React from 'react';
import { FollowingReview } from '@/repositories/http/following/followingReviewRepository';
import { ReviewedDataProps } from '@/interfaces/Reviews/review';
import ReviewCard2 from './ReviewCard2';
import ReviewCardSkeleton from './ui/Skeleton/ReviewCardSkeleton';

interface FollowingReviewsProps {
  reviews: FollowingReview[];
  loading: boolean;
  hasMore: boolean;
  observerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

// Helper function to convert FollowingReview to ReviewedDataProps
const mapFollowingReviewToReviewedDataProps = (review: FollowingReview): ReviewedDataProps => {
  return {
    databaseId: review.id,
    id: review.id.toString(),
    reviewMainTitle: review.title,
    commentLikes: "0", // Not available in following review data
    userLiked: false, // Not available in following review data
    content: review.content,
    uri: "", // Not available in following review data
    reviewStars: review.stars.toString(),
    date: review.date,
    reviewImages: review.images.map((imageUrl, index) => ({
      databaseId: review.id + index, // Generate unique ID
      id: `${review.id}-img-${index}`,
      sourceUrl: imageUrl
    })),
    palates: [], // Not available in following review data
    userAvatar: review.author.avatar,
    author: {
      node: {
        databaseId: review.author.id,
        name: review.author.display_name,
        username: review.author.username,
        avatar: {
          url: review.author.avatar
        }
      }
    },
    userId: review.author.id,
    commentedOn: {
      node: {
        databaseId: review.restaurant.id,
        title: review.restaurant.name,
        slug: "", // Not available
        uri: "", // Not available
        featuredImage: null // Not available
      }
    }
  };
};

const FollowingReviews: React.FC<FollowingReviewsProps> = ({ 
  reviews, 
  loading, 
  hasMore, 
  observerRef 
}) => {
  return (
    <div className="following-reviews">
      {/* Reviews Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {reviews.map((review) => (
          <ReviewCard2 
            key={review.id}
            data={mapFollowingReviewToReviewedDataProps(review)}
          />
        ))}
      </div>
      
      {/* Loading more content with skeletons */}
      {loading && hasMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
          {Array.from({ length: 5 }, (_, i) => (
            <ReviewCardSkeleton key={`loading-skeleton-${i}`} />
          ))}
        </div>
      )}
      
      {/* Observer element for infinite scroll */}
      {observerRef && (
        <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
          {!hasMore && reviews.length > 0 && (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">
                You've reached the end of your following feed
              </p>
              <p className="text-gray-300 text-xs">
                Follow more users to see more reviews
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowingReviews;
