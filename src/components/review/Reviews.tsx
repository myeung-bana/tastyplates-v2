'use client'
import { reviewV2Service, ReviewV2 } from "@/app/api/v1/services/reviewV2Service";
import { transformReviewV2ToReviewedDataProps } from "@/utils/reviewTransformers";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard2 from "./ReviewCard2";
import ReviewCardSkeleton from "../ui/Skeleton/ReviewCardSkeleton";
import "@/styles/pages/_reviews.scss";
import { useState, useEffect, useRef, useCallback } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useFollowingReviewsGraphQL } from "@/hooks/useFollowingReviewsGraphQL";
import { useAuthModal } from "@/components/auth/AuthModalWrapper";

type TabType = 'trending' | 'foryou';

const Reviews = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const { user } = useFirebaseSession();
  const { showSignin } = useAuthModal();
  
  // Trending reviews state
  const [trendingReviews, setTrendingReviews] = useState<ReviewedDataProps[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 16; // Initial load
  const LOAD_MORE_LIMIT = 8; // Subsequent loads
  const observerRef = useRef<HTMLDivElement | null>(null);
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
  const currentHasMore = activeTab === 'trending' ? hasNextPage : forYouHasMore;

  const fetchTrendingReviews = useCallback(async (
    limit = LIMIT,
    currentOffset = 0
  ) => {
    if (loading || !hasNextPage) return;
    
    setLoading(true);
    
    try {
      console.log('Reviews - fetchTrendingReviews called:', {
        limit,
        currentOffset
      });
      
      // Fetch reviews from new API
      const response = await reviewV2Service.getAllReviews({
        limit,
        offset: currentOffset
      });

      console.log('Reviews - API Response:', {
        success: response.reviews ? true : false,
        dataLength: response.reviews?.length,
        meta: { total: response.total, hasMore: response.hasMore },
        firstItem: response.reviews?.[0]
      });

      if (!response.reviews || response.reviews.length === 0) {
        console.log('Reviews - No reviews returned');
        setHasNextPage(false);
        setLoading(false);
        return;
      }

      // Transform ReviewV2 items to ReviewedDataProps format (same as profile tab)
      const reviewV2Items: ReviewV2[] = response.reviews.map((item: any) => {
        const reviewV2: ReviewV2 = {
          id: item.id,
          restaurant_uuid: item.restaurant_uuid || item.restaurant?.uuid || '',
          author_id: item.author_id,
          parent_review_id: null,
          title: item.title,
          content: item.content,
          rating: item.rating,
          images: item.images,
          palates: item.palates,
          hashtags: item.hashtags,
          mentions: null,
          recognitions: item.recognitions,
          likes_count: item.likes_count || 0,
          replies_count: item.replies_count || 0,
          status: item.status as any,
          is_pinned: false,
          is_featured: false,
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at,
          published_at: item.published_at,
          deleted_at: null,
          author: item.author,
          restaurant: item.restaurant,
          user_liked: false
        };
        return reviewV2;
      });

      console.log('Reviews - ReviewV2 items created:', reviewV2Items.length);

      // Transform to ReviewedDataProps (same as profile tab)
      const transformedReviews = reviewV2Items.map((reviewV2) => {
        return transformReviewV2ToReviewedDataProps(reviewV2);
      });

      console.log('Reviews - Transformed reviews:', transformedReviews.length);

      setTrendingReviews((prev) => {
        if (currentOffset === 0) {
          return transformedReviews;
        }
        const all = [...prev, ...transformedReviews];
        // Remove duplicates
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setOffset(currentOffset + transformedReviews.length);
      setHasNextPage(response.hasMore || false);
      
      console.log('Reviews - Final state:', {
        reviewsCount: transformedReviews.length,
        total: response.total,
        offset: currentOffset + transformedReviews.length,
        hasNextPage: response.hasMore || false
      });
    } catch (error) {
      console.error('Error loading trending reviews:', error);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage]);

  const loadMoreTrending = useCallback(async () => {
    if (loading || !hasNextPage) return;
    await fetchTrendingReviews(LOAD_MORE_LIMIT, offset);
  }, [loading, hasNextPage, offset, fetchTrendingReviews]);

  // Load trending reviews on mount or when switching to trending tab
  useEffect(() => {
    if (activeTab === 'trending' && !initialLoaded) {
      console.log('Reviews - Starting initial fetch');
      setTrendingReviews([]);
      setOffset(0);
      setHasNextPage(true);
      setInitialLoaded(true);
      fetchTrendingReviews(LIMIT, 0);
    }
    return () => {
      if (activeTab !== 'trending') {
        setTrendingReviews([]);
      }
    };
  }, [activeTab, initialLoaded, fetchTrendingReviews]);

  // Setup Intersection Observer for trending
  useEffect(() => {
    if (activeTab !== 'trending' || !initialLoaded) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !loading) {
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
  }, [hasNextPage, loading, initialLoaded, loadMoreTrending, activeTab]);

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
                  data={review}
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
              {!currentHasMore && !currentLoading && activeTab === 'trending' && (
                <p className="text-gray-400 text-sm">No more reviews to load.</p>
              )}
              {!currentHasMore && !currentLoading && activeTab === 'foryou' && (
                <p className="text-gray-400 text-sm">No more reviews to load.</p>
              )}
            </div>
          </>
        ) : currentLoading || currentInitialLoading ? (
          /* Show skeletons when loading and no reviews yet */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-10">
            {Array.from({ length: 10 }, (_, i) => (
              <ReviewCardSkeleton key={`empty-loading-skeleton-${i}`} />
            ))}
          </div>
        ) : activeTab === 'trending' ? (
          /* Empty state for Trending tab */
          <div className="text-center py-12 mt-10">
            <p className="text-gray-500 font-neusans">
              No reviews found. Be the first to share your dining experience!
            </p>
          </div>
        ) : activeTab === 'foryou' && user ? (
          /* Empty state for For You tab */
          <div className="text-center py-12 mt-10">
            <p className="text-gray-500 font-neusans">
              No reviews yet from people you follow. Start following food lovers to see their reviews here!
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Reviews;
