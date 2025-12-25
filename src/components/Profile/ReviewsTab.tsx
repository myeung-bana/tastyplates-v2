import React, { useState, useEffect, useCallback } from 'react';
import ReviewCard2 from '../review/ReviewCard2';
import ReviewCardSkeleton2 from '../ui/Skeleton/ReviewCardSkeleton2';
import TabContentGrid from '../ui/TabContentGrid/TabContentGrid';
import { ReviewedDataProps } from '@/interfaces/Reviews/review';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import { transformReviewV2ToReviewedDataProps } from '@/utils/reviewTransformers';
import { ReviewV2 } from '@/app/api/v1/services/reviewV2Service';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { GraphQLReview } from '@/types/graphql';

interface ReviewsTabProps {
  targetUserId: string; // Only UUID string (from userData?.id)
  status: string;
  onReviewCountChange?: (count: number) => void;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ targetUserId, status, onReviewCountChange }) => {
  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 16; // Initial load
  const LOAD_MORE_LIMIT = 8; // Subsequent loads

  const fetchReviews = useCallback(async (
    limit = LIMIT,
    currentOffset = 0,
    userId: string
  ) => {
    if (!userId) {
      console.log('ReviewsTab - fetchReviews: No userId provided');
      return;
    }
    
    console.log('ReviewsTab - fetchReviews called:', {
      userId,
      limit,
      currentOffset,
      status: status || 'all'
    });
    
    setReviewsLoading(true);
    try {
      const response = await restaurantUserService.getReviews({
        user_id: userId, // user_id maps to author_id in restaurant_reviews table
        limit,
        offset: currentOffset,
        status: status || undefined // Filter by status if provided (e.g., 'approved')
      });

      console.log('ReviewsTab - API Response:', {
        success: response.success,
        dataLength: response.data?.length,
        meta: response.meta,
        firstItem: response.data?.[0],
        error: response.error
      });

      if (!response.success || !response.data) {
        console.error('ReviewsTab - API Error:', response.error);
        throw new Error(response.error || 'Failed to fetch reviews');
      }

      // Transform review items to ReviewV2 format for the transformer
      // Note: API returns restaurant_uuid directly on the review object, not nested in restaurant
      const reviewV2Items: ReviewV2[] = response.data.map((item: any) => {
        const reviewV2 = {
          id: item.id,
          restaurant_uuid: item.restaurant_uuid || item.restaurant?.uuid || '',
          author_id: userId,
          parent_review_id: null,
          title: item.title,
          content: item.content,
          rating: item.rating,
          images: item.images,
          palates: item.palates,
          hashtags: item.hashtags,
          mentions: null,
          recognitions: null,
          likes_count: item.likes_count,
          replies_count: 0,
          status: item.status as any,
          is_pinned: false,
          is_featured: false,
          created_at: item.created_at,
          updated_at: item.created_at,
          published_at: item.published_at,
          deleted_at: null,
          author: item.author,
          restaurant: item.restaurant,
          user_liked: false
        };
        
        // Debug first item only to avoid console spam
        if (response.data.indexOf(item) === 0) {
          console.log('ReviewsTab - First ReviewV2 item structure:', {
            rawItem: item,
            mappedReviewV2: reviewV2,
            restaurant_uuid_source: item.restaurant_uuid ? 'direct' : (item.restaurant?.uuid ? 'nested' : 'missing'),
            hasAuthor: !!reviewV2.author,
            hasRestaurant: !!reviewV2.restaurant
          });
        }
        
        return reviewV2;
      });

      console.log('ReviewsTab - ReviewV2 items created:', reviewV2Items.length);

      const transformedReviews = reviewV2Items.map((reviewV2, index) => {
        const transformed = transformReviewV2ToReviewedDataProps(reviewV2);
        if (index === 0) {
          console.log('ReviewsTab - First transformed review:', {
            id: transformed.id,
            databaseId: transformed.databaseId,
            reviewMainTitle: transformed.reviewMainTitle,
            hasImages: transformed.reviewImages?.length > 0,
            authorName: transformed.author?.name,
            restaurantTitle: transformed.commentedOn?.node?.title
          });
        }
        return transformed;
      });

      setReviews((prev) => {
        if (currentOffset === 0) {
          return transformedReviews;
        }
        const all = [...prev, ...transformedReviews];
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      const totalCount = response.meta?.total || 0;
      setUserReviewCount(totalCount);
      
      if (onReviewCountChange) {
        onReviewCountChange(totalCount);
      }
      
      setOffset(currentOffset + transformedReviews.length);
      setHasNextPage(response.meta?.hasMore || false);
      
      console.log('ReviewsTab - Final state:', {
        reviewsCount: transformedReviews.length,
        totalCount,
        offset: currentOffset + transformedReviews.length,
        hasNextPage: response.meta?.hasMore || false
      });
    } catch (error) {
      console.error("ReviewsTab - Error loading reviews:", error);
      setHasNextPage(false);
    } finally {
      setReviewsLoading(false);
    }
  }, [onReviewCountChange]);

  // Infinite scroll handler
  const loadMore = useCallback(async () => {
    if (reviewsLoading || !hasNextPage || !targetUserId) return;
    await fetchReviews(LOAD_MORE_LIMIT, offset, targetUserId);
  }, [reviewsLoading, hasNextPage, offset, targetUserId, fetchReviews]);

  const { observerRef } = useInfiniteScroll({
    loadMore,
    hasNextPage,
    loading: reviewsLoading
  });

  useEffect(() => {
    // Debug: Log targetUserId
    console.log('ReviewsTab - useEffect triggered:', {
      targetUserId,
      isEmpty: !targetUserId || targetUserId.trim() === '',
      type: typeof targetUserId
    });

    // Simple check like ListingsTab - only fetch if we have a valid UUID (not empty string)
    if (targetUserId && targetUserId.trim() !== '') {
      console.log('ReviewsTab - Starting fetch with userId:', targetUserId);
      setReviews([]);
      setOffset(0);
      setHasNextPage(true);
      fetchReviews(LIMIT, 0, targetUserId);
    } else {
      // If no valid userId, stop loading
      console.log('ReviewsTab - No valid userId, stopping loading');
      setReviewsLoading(false);
    }
    return () => {
      setReviews([]);
    };
  }, [targetUserId, fetchReviews]);

  // Convert reviews to GraphQLReview format for SwipeableViewers
  const reviewsAsGraphQL = reviews.map(r => r as unknown as GraphQLReview);

  return (
    <>
      <TabContentGrid
        items={reviews}
        loading={reviewsLoading}
        ItemComponent={({ restaurant, ...props }: { restaurant: ReviewedDataProps; [key: string]: any }) => {
          const index = reviews.findIndex(r => r.id === restaurant.id);
          return (
            <ReviewCard2 
              data={restaurant}
              reviews={reviewsAsGraphQL}
              reviewIndex={index >= 0 ? index : 0}
              {...props}
            />
          );
        }}
        SkeletonComponent={ReviewCardSkeleton2}
        emptyHeading="No Reviews Found"
        emptyMessage="No reviews have been made yet."
        skeletonKeyPrefix="review-skeleton"
        gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      />
      <div ref={observerRef} className="h-10" />
    </>
  );
};

export default ReviewsTab;
