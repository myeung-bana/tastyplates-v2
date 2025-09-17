'use client'
import { ReviewService } from "@/services/Reviews/reviewService";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard from "./ReviewCard";
import "@/styles/pages/_reviews.scss";
import { Masonry } from "masonic";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const reviewService = new ReviewService();

const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const { data: session } = useSession();
  // Removed unused state variables
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  
  // Cap reviews at 25
  const MAX_REVIEWS = 25;
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  // const isLoadingOnce = useRef(false);

  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, []);

  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };

  const loadMore = async () => {
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
  };

  useEffect(() => {
    if (!initialLoaded && status !== "loading") {
      setInitialLoaded(true);
    }
  }, [session, status]);

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
        if (entries[0].isIntersecting && hasNextPage && !loading && !hasReachedLimit) {
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
  }, [hasNextPage, loading, initialLoaded, hasReachedLimit]);

  if (!initialLoaded) {
    return (
      <div className="!w-full mt-10">
        <div className="flex justify-center text-center min-h-[40px] ml-50">
          <span className="text-gray-500 text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
      <div className="reviews__container xl:!px-0">
        <h2 className="reviews__title">Latest Reviews</h2>
        <p className="reviews__subtitle">
          See what others are saying about their dining experiences
        </p>

        <Masonry items={reviews} render={ReviewCard} columnGutter={width > 1280 ? 32 : width > 767 ? 20 : 12} maxColumnWidth={304} columnCount={getColumns()} maxColumnCount={4} />
        <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
          {loading && !hasReachedLimit && (
            <>
              <svg
                className="w-5 h-5 text-gray-500 animate-spin"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray="164"
                  strokeDashoffset="40"
                />
              </svg>
              <span className="text-gray-500 text-sm">Load more content</span>
            </>
          )}
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
