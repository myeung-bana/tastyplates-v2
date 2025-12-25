'use client';
import React from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { useFollowingReviewsGraphQL } from '@/hooks/useFollowingReviewsGraphQL';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import ReviewCard2 from '@/components/review/ReviewCard2';
import ReviewCardSkeleton from '@/components/ui/Skeleton/ReviewCardSkeleton';
import SuggestedUsers from '@/components/following/SuggestedUsers';
import { FaUsers, FaCompass } from 'react-icons/fa';
import { FiUsers, FiTrendingUp, FiHeart } from 'react-icons/fi';
import Link from 'next/link';

export default function FollowingPage() {
  const { user, loading: sessionLoading } = useFirebaseSession();
  const { 
    reviews, 
    loading, 
    initialLoading, 
    hasMore, 
    loadMore
  } = useFollowingReviewsGraphQL();
  
  const { observerRef } = useInfiniteScroll({
    loadMore: async () => loadMore(),
    hasNextPage: hasMore,
    loading: loading
  });

  // Show sign-in prompt if not authenticated (but don't show spinner)
  if (!user && !sessionLoading) {
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
              onClick={() => window.location.href = '/signin'}
              className="bg-[#ff7c0a] hover:bg-[#e66d08] text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton while session is loading or initial data is loading
  if (sessionLoading || (user && initialLoading)) {
    return (
      <div className="py-8 md:pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2 flex items-center gap-3 font-neusans">
              Following
            </h1>
            <p className="text-gray-600">
              Discover the latest reviews from food lovers you follow
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <ReviewCardSkeleton key={`initial-skeleton-${i}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:pt-[88px]">
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

        {/* Content */}
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
            {/* Enhanced Empty State - No reviews */}
            {reviews.length === 0 && !loading && (
              <div className="max-w-5xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full mb-6">
                    <FiUsers className="h-12 w-12 text-[#ff7c0a]" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Build Your Culinary Network
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Follow food enthusiasts to see their latest discoveries, get personalized recommendations, and never miss a great meal.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <FiTrendingUp className="w-6 h-6 text-[#ff7c0a]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Personalized Feed</h3>
                    <p className="text-sm text-gray-600">
                      See reviews from people whose taste you trust, tailored to your preferences.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <FiHeart className="w-6 h-6 text-[#ff7c0a]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Never Miss Out</h3>
                    <p className="text-sm text-gray-600">
                      Get instant updates when your favorite reviewers discover hidden gems.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <FaCompass className="w-6 h-6 text-[#ff7c0a]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Discover Together</h3>
                    <p className="text-sm text-gray-600">
                      Build connections with fellow food lovers and share your experiences.
                    </p>
                  </div>
                </div>

                {/* Suggested Users Component */}
                <div className="mb-12">
                  <SuggestedUsers onFollowSuccess={loadMore} />
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Ready to explore more?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Browse our community and discover reviewers whose taste resonates with yours
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/"
                      className="inline-flex items-center justify-center gap-2 bg-[#ff7c0a] hover:bg-[#e66d08] text-white px-8 py-3 rounded-full font-semibold transition-colors"
                    >
                      <FiTrendingUp className="w-5 h-5" />
                      Browse Trending Reviews
                    </Link>
                    <Link 
                      href="/restaurants"
                      className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-full font-semibold border-2 border-gray-200 transition-colors"
                    >
                      <FaCompass className="w-5 h-5" />
                      Explore Restaurants
                    </Link>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">💡</span>
                    Pro Tips for Building Your Feed
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Follow reviewers who explore the same cuisines or areas you love</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Check out profiles with detailed reviews and quality photos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Start with 5-10 users to build a diverse and engaging feed</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Reviews Feed - Same structure as homepage */}
            {reviews.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {reviews.map((review, index) => (
                    <ReviewCard2 
                      key={review.id}
                      data={review as any} // GraphQLReview is compatible with ReviewedDataProps
                      reviews={reviews}
                      reviewIndex={index}
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
                <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
                  {!hasMore && reviews.length > 0 && (
                    <p className="text-gray-400 text-sm">No more reviews to load.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}