'use client'
import { ReviewService } from "@/services/Reviews/reviewService";
import { GraphQLReview } from "@/types/graphql";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard2 from "./ReviewCard2";
import ReviewCardSkeleton from "../ui/Skeleton/ReviewCardSkeleton";
import "@/styles/pages/_reviews.scss";
import { useState, useEffect, useRef, useCallback } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useFollowingReviewsGraphQL } from "@/hooks/useFollowingReviewsGraphQL";
import { useAuthModal } from "@/components/auth/AuthModalWrapper";

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

type TabType = 'trending' | 'foryou';

const Reviews = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const { user } = useFirebaseSession();
  const { showSignin } = useAuthModal();
  
  // Trending reviews state
  const [trendingReviews, setTrendingReviews] = useState<GraphQLReview[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const MAX_REVIEWS = 25;
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // For You reviews (using the hook)
  const {
    reviews: forYouReviews,
    loading: forYouLoading,
    initialLoading: forYouInitialLoading,
    hasMore: forYouHasMore,
    loadMore: loadMoreForYou
  } = useFollowingReviewsGraphQL();

  // Get current reviews based on active tab
  const currentReviews = activeTab === 'trending' ? trendingReviews : forYouReviews;
  const currentLoading = activeTab === 'trending' ? loading : forYouLoading;
  const currentInitialLoading = activeTab === 'trending' ? !initialLoaded : forYouInitialLoading;
  const currentHasMore = activeTab === 'trending' ? hasNextPage && !hasReachedLimit : forYouHasMore;

  const loadMoreTrending = useCallback(async () => {
    if (loading || !hasNextPage || hasReachedLimit) return;
    
    setLoading(true);
    const first = isFirstLoad.current ? 16 : 8;
    
    // Get Firebase ID token for API call
    let token: string | undefined = undefined;
    if (user?.firebase_uuid) {
      try {
        const { auth } = await import('@/lib/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken();
        }
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    }
    
    const { reviews: newReviews, pageInfo } = await reviewService.fetchAllReviews(first, endCursor, token);
    
    // Calculate how many reviews we can add without exceeding the limit
    const currentCount = trendingReviews.length;
    const remainingSlots = MAX_REVIEWS - currentCount;
    const reviewsToAdd = newReviews.slice(0, remainingSlots);
    
    setTrendingReviews(prev => [...prev, ...reviewsToAdd]);
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
  }, [loading, hasNextPage, hasReachedLimit, trendingReviews.length, endCursor, user]);

  // Load trending reviews on mount or when switching to trending tab
  useEffect(() => {
    if (activeTab === 'trending' && !initialLoaded) {
      setInitialLoaded(true);
    }
  }, [activeTab, initialLoaded]);

  useEffect(() => {
    if (activeTab === 'trending' && initialLoaded) {
      loadMoreTrending();
    }
  }, [activeTab, initialLoaded, loadMoreTrending]);

  // Setup Intersection Observer for trending
  useEffect(() => {
    if (activeTab !== 'trending' || !initialLoaded || hasReachedLimit) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !loading && !hasReachedLimit) {
          loadMoreTrending();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading, initialLoaded, hasReachedLimit, loadMoreTrending, activeTab]);

  // Setup Intersection Observer for For You
  useEffect(() => {
    if (activeTab !== 'foryou' || !user) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && forYouHasMore && !forYouLoading && !forYouInitialLoading) {
          loadMoreForYou();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [forYouHasMore, forYouLoading, forYouInitialLoading, loadMoreForYou, activeTab, user]);

  const handleTabClick = (tab: TabType) => {
    if (tab === 'foryou' && !user) {
      showSignin();
      return;
    }
    setActiveTab(tab);
  };

  if (currentInitialLoading) {
    return (
      <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
        <div className="reviews__container xl:!px-0">
          {/* Tabs - Centered */}
          <div className="flex justify-center gap-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => handleTabClick('trending')}
              className={`px-4 py-2 text-base md:text-lg font-neusans font-normal transition-colors relative ${
                activeTab === 'trending'
                  ? 'text-[#E36B00]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trending
              {activeTab === 'trending' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E36B00]" />
              )}
            </button>
            <button
              onClick={() => handleTabClick('foryou')}
              className={`px-4 py-2 text-base md:text-lg font-neusans font-normal transition-colors relative ${
                activeTab === 'foryou'
                  ? 'text-[#E36B00]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For You
              {activeTab === 'foryou' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E36B00]" />
              )}
            </button>
          </div>
          
          {/* Skeleton loading */}
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
        {/* Tabs - Centered */}
        <div className="flex justify-center gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabClick('trending')}
            className={`px-4 py-2 text-base md:text-lg font-neusans font-normal transition-colors relative ${
              activeTab === 'trending'
                ? 'text-[#E36B00]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trending
            {activeTab === 'trending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E36B00]" />
            )}
          </button>
          <button
            onClick={() => handleTabClick('foryou')}
            className={`px-4 py-2 text-base md:text-lg font-neusans font-normal transition-colors relative ${
              activeTab === 'foryou'
                ? 'text-[#E36B00]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            For You
            {activeTab === 'foryou' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E36B00]" />
            )}
          </button>
        </div>

        {/* Reviews Grid */}
        {currentReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-10">
              {currentReviews.map((review, index) => (
                <ReviewCard2 
                  key={review.id}
                  data={mapToReviewedDataProps(review)}
                  reviews={currentReviews}
                  reviewIndex={index}
                />
              ))}
            </div>
            
            {/* Loading more content with skeletons */}
            {currentLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <ReviewCardSkeleton key={`loading-skeleton-${i}`} />
                ))}
              </div>
            )}
            
            <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
              {activeTab === 'trending' && hasReachedLimit && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">
                    Showing {currentReviews.length} of the latest reviews
                  </p>
                  <p className="text-gray-500 text-xs">
                    Visit our restaurants page to see more reviews
                  </p>
                </div>
              )}
              {!currentHasMore && !currentLoading && activeTab === 'foryou' && (
                <p className="text-gray-400 text-sm">No more reviews to load.</p>
              )}
            </div>
          </>
        ) : activeTab === 'foryou' && user ? (
          <div className="text-center py-12 mt-10">
            <p className="text-gray-500 font-neusans">
              {forYouInitialLoading 
                ? 'Loading...'
                : 'No reviews yet from people you follow. Start following food lovers to see their reviews here!'
              }
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Reviews;
