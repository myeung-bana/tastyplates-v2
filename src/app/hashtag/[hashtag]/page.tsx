'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import client from '@/app/graphql/client';
import { SEARCH_REVIEWS_BY_HASHTAG } from '@/app/graphql/Reviews/reviewsQueries';
import { GraphQLReview } from '@/types/graphql';
import ReviewCard2 from '@/components/review/ReviewCard2';
import ReviewCardSkeleton from '@/components/ui/Skeleton/ReviewCardSkeleton';

const HashtagPage = () => {
  const params = useParams();
  const hashtag = (params?.hashtag as string) || '';
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);

  useEffect(() => {
    if (hashtag) {
      loadHashtagReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtag]);

  const loadHashtagReviews = async (append: boolean = false) => {
    if (!hashtag) return;

    setLoading(true);
    try {
      const { data } = await client.query({
        query: SEARCH_REVIEWS_BY_HASHTAG,
        variables: { hashtag, first: append ? 8 : 16, after: append ? endCursor : null },
        context: {
          headers: {
            ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
          },
        },
        fetchPolicy: 'no-cache',
      });

      const newReviews = data?.comments?.nodes || [];
      const pageInfo = data?.comments?.pageInfo || { endCursor: null, hasNextPage: false };

      if (append) {
        setReviews((prev) => [...prev, ...newReviews]);
      } else {
        setReviews(newReviews);
      }

      setEndCursor(pageInfo.endCursor);
      setHasMore(pageInfo.hasNextPage);
    } catch (error) {
      console.error('Error loading hashtag reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHashtagReviews(true);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">#{hashtag}</h1>
          <p className="text-gray-600">{reviews.length} reviews tagged with #{hashtag}</p>
        </div>

        {/* Reviews Grid */}
        {loading && reviews.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <ReviewCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {reviews.map((review, index) => (
                <ReviewCard2 
                  key={review.id} 
                  data={review as any}
                  reviews={reviews}
                  reviewIndex={index}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-[#E36B00] hover:bg-[#c55a00] text-white px-8 py-3 rounded-full font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No reviews found for #{hashtag}</h2>
            <p className="text-lg text-gray-600">Be the first to post a review with this hashtag!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagPage;


