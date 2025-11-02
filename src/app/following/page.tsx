'use client';
import React, { useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useFollowingReviewsGraphQL } from '@/hooks/useFollowingReviewsGraphQL';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import SuggestedUsers from '@/components/SuggestedUsers';
import FollowingReviews from '@/components/FollowingReviews';
import ReviewCardSkeleton from '@/components/ui/Skeleton/ReviewCardSkeleton';
import { FaUsers } from 'react-icons/fa';

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const { 
    reviews, 
    loading, 
    initialLoading, 
    hasMore, 
    loadMore, 
    refreshFollowingReviews 
  } = useFollowingReviewsGraphQL();
  
  const { observerRef } = useInfiniteScroll({
    loadMore: async () => loadMore(),
    hasNextPage: hasMore,
    loading: loading
  });

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="bg-gray-50 py-8 mt-16 md:mt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E36B00] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!session) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <FaUsers className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sign in to see your following feed
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Follow other food lovers to see their latest reviews and discoveries
            </p>
            <button 
              onClick={() => window.location.href = '/api/auth/signin'}
              className="bg-[#E36B00] hover:bg-[#c55a00] text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 md:pt-[88px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Following
          </h1>
          <p className="text-gray-600">
            Discover the latest reviews from food lovers you follow
          </p>
        </div>

        {/* Initial Loading State */}
        {initialLoading ? (
          <div>
            {/* Reviews Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }, (_, i) => (
                <ReviewCardSkeleton key={`initial-skeleton-${i}`} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Empty State - No reviews */}
            {reviews.length === 0 && !loading && (
              <div className="text-center py-16">
                <FaUsers className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Your following feed is empty
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Start following other food lovers to see their reviews here
                </p>
                <button 
                  onClick={() => window.location.href = '/explore'}
                  className="bg-[#E36B00] hover:bg-[#c55a00] text-white px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  Discover Users
                </button>
              </div>
            )}

            {/* Reviews Feed */}
            {reviews.length > 0 && (
              <div>                
                <FollowingReviews 
                  reviews={reviews}
                  loading={loading}
                  hasMore={hasMore}
                  observerRef={observerRef}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}