'use client';
import React from 'react';
import { GraphQLReview } from '@/types/graphql';
import ReviewCard2 from './ReviewCard2';
import ReviewCardSkeleton from './ui/Skeleton/ReviewCardSkeleton';

interface FollowingReviewsProps {
  reviews: GraphQLReview[];
  loading: boolean;
  hasMore: boolean;
  observerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

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
            data={review as any} // GraphQLReview is compatible with ReviewedDataProps
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