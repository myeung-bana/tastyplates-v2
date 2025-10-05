import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Masonry } from 'masonic';
import ReviewCard2 from '../ReviewCard2';
import ReviewCardSkeleton from '../ui/Skeleton/ReviewCardSkeleton';
import { ReviewedDataProps } from '@/interfaces/Reviews/review';
import { ReviewService } from '@/services/Reviews/reviewService';
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

      setUserReviewCount(userCommentCount || 0);
      
      // Notify parent component of review count change
      if (onReviewCountChange && userCommentCount !== undefined) {
        onReviewCountChange(userCommentCount);
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
    setReviews([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    return () => {
      setReviews([]);
      setEndCursor(null);
      isFirstLoad.current = true;
    };
  }, [targetUserId]);

  useEffect(() => {
    setReviews([]);
    if (status !== "loading" && targetUserId) {
      loadMore();
    }
  }, [status, targetUserId, loadMore]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {Array.from({ length: 6 }, (_, i) => (
            <ReviewCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 mt-10">
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
