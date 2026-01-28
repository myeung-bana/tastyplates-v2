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
import { useIsMobile } from "@/utils/deviceUtils";
import SwipeableReviewViewer from "./SwipeableReviewViewer";
import SwipeableReviewViewerDesktop from "./SwipeableReviewViewerDesktop";
import { GraphQLReview } from "@/types/graphql";

type TabType = 'trending' | 'foryou';

const Reviews = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const { user } = useFirebaseSession();
  const { showSignin } = useAuthModal();
  const isMobile = useIsMobile();
  
  // Trending reviews state
  const [trendingReviews, setTrendingReviews] = useState<ReviewedDataProps[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null); // Phase 2: Cursor pagination
  const LIMIT = 8;
  const LOAD_MORE_LIMIT = 16;
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialFetchRef = useRef(false);
  
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
  const currentHasMore = activeTab === 'trending' ? hasNextPage : forYouHasMore;

  const fetchTrendingReviews = useCallback(async (
    limit = LIMIT,
    currentCursor: string | null = null
  ) => {
    if (loading || !hasNextPage) return;
    
    // Cancel previous request if it exists (only for pagination, not initial load)
    if (abortControllerRef.current && currentCursor !== null) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Track if this is the initial fetch
    const isInitialFetch = currentCursor === null;
    if (isInitialFetch) {
      isInitialFetchRef.current = true;
    }
    
    setLoading(true);
    
    try {
      // Fetch reviews with cursor pagination (Phase 2 - Fast!)
      const response = await reviewV2Service.getAllReviews({
        limit,
        cursor: currentCursor || undefined,
        signal: abortController.signal
      });
      
      // Check if request was aborted after fetch completes
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.reviews || response.reviews.length === 0) {
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

      // Transform to ReviewedDataProps (same as profile tab)
      const transformedReviews = reviewV2Items.map((reviewV2) => {
        return transformReviewV2ToReviewedDataProps(reviewV2);
      });

      setTrendingReviews((prev) => {
        if (isInitialFetch) {
          return transformedReviews;
        }
        const all = [...prev, ...transformedReviews];
        // Remove duplicates
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      // Phase 2: Store cursor for next page
      setCursor(response.cursor || null);
      setHasNextPage(response.hasMore || false);
      
      // Mark initial fetch as complete
      if (isInitialFetch) {
        isInitialFetchRef.current = false;
      }
    } catch (error) {
      // Ignore abort errors (request was intentionally canceled)
      if (error instanceof Error && error.name === 'AbortError') {
        // Mark initial fetch as complete if it was aborted
        if (isInitialFetch) {
          isInitialFetchRef.current = false;
        }
        return;
      }
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setHasNextPage(false);
        setLoading(false);
        // Mark initial fetch as complete on error
        if (isInitialFetch) {
          isInitialFetchRef.current = false;
        }
      }
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [loading, hasNextPage]);

  const loadMoreTrending = useCallback(async () => {
    if (loading || !hasNextPage) return;
    await fetchTrendingReviews(LOAD_MORE_LIMIT, cursor);
  }, [loading, hasNextPage, cursor, fetchTrendingReviews]);

  // Load trending reviews on mount or when switching to trending tab
  useEffect(() => {
    // Only fetch if we're on trending tab and haven't loaded yet
    if (activeTab === 'trending' && !initialLoaded) {
      setTrendingReviews([]);
      setCursor(null); // Phase 2: Reset cursor
      setHasNextPage(true);
      setInitialLoaded(true);
      
      // Fetch reviews - don't await, let it run
      // The initial fetch will not be aborted by cleanup
      fetchTrendingReviews(LIMIT, null); // Phase 2: Pass null cursor for first page
    }
    
    // No cleanup here - we don't want to abort the initial fetch
    // Cleanup will be handled by the tab switching effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, initialLoaded]); // Removed fetchTrendingReviews from deps to prevent re-render loop
  
  // Separate effect to handle tab switching cleanup
  useEffect(() => {
    // When switching away from trending, clean up any pending requests
    // But only if it's not the initial fetch
    if (activeTab !== 'trending') {
      if (abortControllerRef.current && !isInitialFetchRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // DON'T clear reviews - preserve them for when user switches back
      // This provides better UX and avoids unnecessary re-fetching
    }
  }, [activeTab]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!observerRef.current || currentInitialLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentHasMore && !currentLoading) {
          if (activeTab === 'trending') {
          loadMoreTrending();
          } else if (activeTab === 'foryou' && user) {
            loadMoreForYou();
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [activeTab, currentHasMore, currentLoading, currentInitialLoading, loadMoreTrending, loadMoreForYou, user]);

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

        {/* Simple Reviews Grid - Infinite Scroll */}
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
              
              {/* Infinite scroll trigger */}
              <div ref={observerRef} className="h-4" />
              
              {/* Loading indicator at bottom */}
              {currentLoading && (
                <div className="py-6 flex justify-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    {Array.from({ length: 4 }, (_, i) => (
                      <ReviewCardSkeleton key={`loading-skeleton-${i}`} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* End message */}
              {!currentHasMore && !currentLoading && (
                <div className="flex justify-center text-center py-6">
                  <p className="text-gray-400 text-sm">No more reviews to load.</p>
                </div>
              )}
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
          <SwipeableReviewViewer
            reviews={currentReviews as unknown as GraphQLReview[]}
            initialIndex={viewerIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        ) : (
          <SwipeableReviewViewerDesktop
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
