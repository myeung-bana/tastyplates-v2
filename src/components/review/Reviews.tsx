'use client'
import { ReviewService } from "@/services/Reviews/reviewService";
import { GraphQLReview } from "@/types/graphql";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard2 from "./ReviewCard2";
import ReviewCardSkeleton from "../ui/Skeleton/ReviewCardSkeleton";
import "@/styles/pages/_reviews.scss";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

const reviewService = new ReviewService();

// Helper function to convert GraphQLReview to ReviewedDataProps
const mapToReviewedDataProps = (review: GraphQLReview): ReviewedDataProps => {
  return {
    databaseId: review.databaseId,
    id: review.id,
    reviewMainTitle: review.reviewMainTitle,
    commentLikes: String(review.commentLikes),
    userLiked: review.userLiked,
    content: review.content,
    uri: "", // Not available in GraphQLReview
    reviewStars: String(review.reviewStars),
    date: review.date,
    reviewImages: review.reviewImages,
    palates: review.palates,
    userAvatar: review.userAvatar,
    author: review.author,
    userId: review.author.node.databaseId,
    commentedOn: review.commentedOn,
  };
};

const Reviews = () => {
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
  const { data: session } = useSession();
  // Removed unused state variables
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cap reviews at 25
  const MAX_REVIEWS = 25;
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasNextPage || hasReachedLimit) return;
    
    setLoading(true);
    const first = isFirstLoad.current ? 16 : 8;
    const { reviews: newReviews, pageInfo } = await reviewService.fetchAllReviews(first, endCursor, session?.accessToken);
    
    // Calculate how many reviews we can add without exceeding the limit
    const currentCount = reviews.length;
    const remainingSlots = MAX_REVIEWS - currentCount;
    const reviewsToAdd = newReviews.slice(0, remainingSlots);
    
    setReviews(prev => [...prev, ...reviewsToAdd]);
    setEndCursor(pageInfo.endCursor);
    setHasNextPage(pageInfo.hasNextPage);
    
    // Check if we've reached the limit
    if (currentCount + reviewsToAdd.length >= MAX_REVIEWS) {
      setHasReachedLimit(true);
      setHasNextPage(false); // Stop further loading
    }
    
    setLoading(false);

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, [loading, hasNextPage, hasReachedLimit, reviews.length, endCursor, session?.accessToken]);

  useEffect(() => {
    if (!initialLoaded) {
      setInitialLoaded(true);
    }
  }, [initialLoaded]);

  // Call loadMore only when initialLoaded becomes true
  useEffect(() => {
    if (initialLoaded) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded]);

  // Setup Intersection Observer, but only after initial load
  useEffect(() => {
    if (!initialLoaded || hasReachedLimit) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !loading && !hasReachedLimit) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading, initialLoaded, hasReachedLimit, loadMore]);

  if (!initialLoaded) {
    return (
      <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
        <div className="reviews__container xl:!px-0">
          <h2 className="reviews__title">Latest Reviews</h2>
          <p className="reviews__subtitle">
            See what others are saying about their dining experiences
          </p>
          
          {/* Skeleton loading for initial load */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-10">
            {Array.from({ length: 10 }, (_, i) => (
              <ReviewCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
      <div className="reviews__container xl:!px-0">
        <h2 className="reviews__title">Latest Reviews</h2>
        <p className="reviews__subtitle">
          See what others are saying about their dining experiences
        </p>

        {/* Standard Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-10">
          {reviews.map((review, index) => (
            <ReviewCard2 
              key={review.id}
              data={mapToReviewedDataProps(review)}
              reviews={reviews}
              reviewIndex={index}
            />
          ))}
        </div>
        
        {/* Loading more content with skeletons */}
        {loading && !hasReachedLimit && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {Array.from({ length: 5 }, (_, i) => (
              <ReviewCardSkeleton key={`loading-skeleton-${i}`} />
            ))}
          </div>
        )}
        
        <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
          {hasReachedLimit && (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">
                Showing {reviews.length} of the latest reviews
              </p>
              <p className="text-gray-500 text-xs">
                Visit our restaurants page to see more reviews
              </p>
            </div>
          )}
          {!hasNextPage && !loading && !hasReachedLimit && (
            <p className="text-gray-400 text-sm">No more content to load.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
