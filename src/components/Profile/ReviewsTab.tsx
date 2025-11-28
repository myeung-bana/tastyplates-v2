import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Masonry } from 'masonic';
import ReviewCard2 from '../review/ReviewCard2';
import ReviewCardSkeleton2 from '../ui/Skeleton/ReviewCardSkeleton2';
import { ReviewedDataProps } from '@/interfaces/Reviews/review';
import { ReviewService } from '@/services/Reviews/reviewService';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ReviewsTabProps {
  targetUserId: number;
  status: string;
  onReviewCountChange?: (count: number) => void;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ targetUserId, status, onReviewCountChange }) => {
  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const reviewService = useRef(new ReviewService()).current;
  const restaurantService = useRef(new RestaurantService()).current;

  // Helper function to fetch restaurant details if needed
  const fetchRestaurantDetails = useCallback(async (restaurantId: string | number) => {
    try {
      const restaurantDetails = await restaurantService.fetchRestaurantById(
        restaurantId.toString(),
        'DATABASE_ID'
      );
      return restaurantDetails;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }
  }, [restaurantService]);

  const loadMore = useCallback(async () => {
    if (reviewsLoading || !hasNextPage || !targetUserId) return;
    
    setReviewsLoading(true);

    try {
      const first = isFirstLoad.current ? 16 : 8;
      const { reviews: newReviews, pageInfo, userCommentCount } =
        await reviewService.fetchUserReviews(targetUserId, first, endCursor);

      if (isFirstLoad.current) {
        setReviews([]);
        setTimeout(() => {
          setReviews(newReviews as unknown as ReviewedDataProps[]);
        }, 0);
      } else {
        setReviews((prev) => {
          const existingIds = new Set(prev.map((review) => review.id));
          const uniqueNewReviews = newReviews.filter(
            (review) => !existingIds.has(review.id)
          );
          return [...prev, ...(uniqueNewReviews as unknown as ReviewedDataProps[])];
        });
      }

      const reviewCount = userCommentCount ?? 0;
      setUserReviewCount(reviewCount);
      
      // Notify parent component of review count change
      if (onReviewCountChange) {
        onReviewCountChange(reviewCount);
      }
      
      setEndCursor(pageInfo.endCursor as string | null);
      setHasNextPage(pageInfo.hasNextPage as boolean);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setReviewsLoading(false);
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    }
  }, [reviewsLoading, hasNextPage, targetUserId, endCursor, onReviewCountChange]);

  const { observerRef } = useInfiniteScroll({
    loadMore,
    hasNextPage,
    loading: reviewsLoading
  });

  useEffect(() => {
    if (status !== "loading" && targetUserId) {
      // Reset state for new user
      setReviews([]);
      setEndCursor(null);
      setHasNextPage(true);
      isFirstLoad.current = true;
      
      // Trigger initial load
      loadMore();
    }
  }, [status, targetUserId]); // Remove loadMore from dependencies

  const getItemSize = (index: number) => {
    try {
      const review = reviews[index];
      if (!review) return 200;
      
      const baseHeight = 200;
      const titleHeight = review.reviewMainTitle ? 20 : 0;
      const contentHeight = review.content ? Math.min(Math.max(review.content.length * 0.5, 0), 100) : 0;
      const imageHeight = (review.reviewImages && Array.isArray(review.reviewImages) && review.reviewImages.length > 0) ? 150 : 0;
      
      const totalHeight = baseHeight + titleHeight + contentHeight + imageHeight;
      
      // Ensure we return a valid number
      if (isNaN(totalHeight) || totalHeight <= 0) {
        return 200;
      }
      
      return Math.round(totalHeight);
    } catch (error) {
      console.warn('Error calculating item size:', error);
      return 200;
    }
  };

  return (
    <>
      {reviewsLoading && reviews.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
          {Array.from({ length: 4 }, (_, i) => (
            <ReviewCardSkeleton2 key={`skeleton-${i}`} />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
          {reviews.map((review, index) => (
            <ReviewCard2 
              key={review.id}
              data={review}
            />
          ))}
        </div>
      ) : (
        !reviewsLoading && (
          <div className="text-center text-gray-400 py-12">
            No Reviews Yet.
          </div>
        )
      )}
      <div ref={observerRef} />
    </>
  );
};

export default ReviewsTab;
