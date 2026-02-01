'use client'
import { reviewV2Service, ReviewV2 } from "@/app/api/v1/services/reviewV2Service";
import { transformReviewV2ToReviewedDataProps } from "@/utils/reviewTransformers";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard2 from "./ReviewCard2";
import ReviewCardSkeleton from "../ui/Skeleton/ReviewCardSkeleton";
import "@/styles/pages/_reviews.scss";
import { useState, useEffect, useCallback } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useFollowingReviewsGraphQL } from "@/hooks/useFollowingReviewsGraphQL";
import { useAuthModal } from "@/components/auth/AuthModalWrapper";
import { useIsMobile } from "@/utils/deviceUtils";
import ReviewScreen from "./ReviewScreen";
import ReviewScreenDesktop from "./ReviewScreenDesktop";
import { GraphQLReview } from "@/types/graphql";

type TabType = 'trending' | 'foryou';

const Reviews = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const { user } = useFirebaseSession();
  const { showSignin } = useAuthModal();
  const isMobile = useIsMobile();
  
  // Trending reviews state - simplified to show only 8 reviews
  const [trendingReviews, setTrendingReviews] = useState<ReviewedDataProps[]>([]);
  const [loading, setLoading] = useState(false);
  const LIMIT = 8; // Fixed at 8 reviews
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // Full-screen viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // For You reviews (using the hook)
  const {
    reviews: forYouReviews,
    loading: forYouLoading,
    initialLoading: forYouInitialLoading,
    hasMore: forYouHasMore,
    loadMore: loadMoreForYou
  } = useFollowingReviewsGraphQL(activeTab === 'foryou');

  // Get current reviews based on active tab
  const currentReviews = activeTab === 'trending' ? trendingReviews : forYouReviews;
  const currentLoading = activeTab === 'trending' ? loading : forYouLoading;
  const currentInitialLoading = activeTab === 'trending' ? !initialLoaded : forYouInitialLoading;

  // Simplified fetch - only loads 8 reviews, no pagination
  const fetchTrendingReviews = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Fetch only 8 reviews
      const response = await reviewV2Service.getAllReviews({
        limit: LIMIT
      });

      if (!response.reviews || response.reviews.length === 0) {
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

      // Transform to ReviewedDataProps
      const transformedReviews = reviewV2Items.map((reviewV2) => {
        return transformReviewV2ToReviewedDataProps(reviewV2);
      });

      // Set only 8 reviews, no pagination
      setTrendingReviews(transformedReviews);
    } catch (error: any) {
      console.error('Error fetching trending reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Load trending reviews on mount - simple, no pagination
  useEffect(() => {
    if (activeTab === 'trending' && !initialLoaded) {
      setInitialLoaded(true);
      fetchTrendingReviews();
    }
  }, [activeTab, initialLoaded, fetchTrendingReviews]);

  const handleTabClick = (tab: TabType) => {
    if (tab === 'foryou' && !user) {
      showSignin();
      return;
    }
    // Close viewer when switching tabs
    setViewerOpen(false);
    setActiveTab(tab);
  };

  if (currentInitialLoading) {
    return (
      <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
        <div className="reviews__container xl:!px-0">
          {/* Tabs - Segmented control style (matches main view) */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex justify-center py-2">
              <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => handleTabClick('trending')}
                  className={`px-4 py-2 text-sm md:text-base font-neusans font-normal transition-colors rounded-full ${
                activeTab === 'trending'
                      ? 'bg-white text-[#ff7c0a] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => handleTabClick('foryou')}
                  className={`px-4 py-2 text-sm md:text-base font-neusans font-normal transition-colors rounded-full ${
                activeTab === 'foryou'
                      ? 'bg-white text-[#ff7c0a] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For You
            </button>
              </div>
            </div>
          </div>
          
          {/* Skeleton loading */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 4 }, (_, i) => (
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
        {/* Tabs - Sticky segmented control (feels more like an app feed) */}
        <div className="sticky top-[60px] z-40 -mx-4 px-4 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex justify-center py-2">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
          <button
            onClick={() => handleTabClick('trending')}
                className={`px-4 py-2 text-sm md:text-base font-neusans font-normal transition-colors rounded-full ${
              activeTab === 'trending'
                    ? 'bg-white text-[#ff7c0a] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => handleTabClick('foryou')}
                className={`px-4 py-2 text-sm md:text-base font-neusans font-normal transition-colors rounded-full ${
              activeTab === 'foryou'
                    ? 'bg-white text-[#ff7c0a] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            For You
          </button>
            </div>
          </div>
        </div>

        {/* Simple Reviews Grid - Fixed 8 reviews */}
        {currentReviews.length > 0 ? (
          <>
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentReviews.map((review, index) => (
                  <ReviewCard2 
                    key={review.id}
                    data={review}
                    reviews={currentReviews}
                    reviewIndex={index}
                    viewerSource={activeTab === 'trending' ? { src: 'global' } : { src: 'following' }}
                    onOpenViewer={(idx) => {
                      setViewerIndex(idx);
                      setViewerOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : currentLoading || currentInitialLoading ? (
          /* Show skeletons when loading and no reviews yet */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ReviewCardSkeleton key={`empty-loading-skeleton-${i}`} />
            ))}
          </div>
        ) : activeTab === 'trending' ? (
          /* Empty state for Trending tab */
          <div className="text-center py-12 mt-4">
            <p className="text-gray-500 font-neusans">
              No reviews found. Be the first to share your dining experience!
            </p>
          </div>
        ) : activeTab === 'foryou' && user ? (
          /* Empty state for For You tab */
          <div className="text-center py-12 mt-4">
            <p className="text-gray-500 font-neusans">
              No reviews yet from people you follow. Start following food lovers to see their reviews here!
            </p>
          </div>
        ) : null}

        {/* Full-screen viewer (rendered via portal to document.body) */}
        {isMobile ? (
          <ReviewScreen
            reviews={currentReviews as unknown as GraphQLReview[]}
            initialIndex={viewerIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        ) : (
          <ReviewScreenDesktop
            reviews={currentReviews as unknown as GraphQLReview[]}
            initialIndex={viewerIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </div>
    </section>
  );
};

export default Reviews;
