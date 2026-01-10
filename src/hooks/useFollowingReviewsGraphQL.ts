import { useState, useEffect, useCallback } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import { GraphQLReview } from '@/types/graphql';

interface UseFollowingReviewsGraphQLReturn {
  reviews: GraphQLReview[];
  loading: boolean;
  initialLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshFollowingReviews: () => Promise<void>;
}

export const useFollowingReviewsGraphQL = (enabled: boolean = true): UseFollowingReviewsGraphQLReturn => {
  const { user } = useFirebaseSession();
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const userId = user?.id ? String(user.id) : '';
  const isUuidUserId = !!userId && UUID_REGEX.test(userId);

  const LIMIT = 4;
  const LOAD_MORE_LIMIT = 4;

  const loadFollowingReviews = useCallback(async (append: boolean) => {
    if (!enabled) return;

    if (!isUuidUserId) {
      setInitialLoading(false);
      setLoading(false);
      setHasMore(false);
      if (!append) setReviews([]);
      return;
    }

    const currentOffset = append ? offset : 0;
    if (!append) setInitialLoading(true);
    setLoading(true);

    try {
      const response = await reviewV2Service.getFollowingFeed({
        userId,
        limit: append ? LOAD_MORE_LIMIT : LIMIT,
        offset: currentOffset,
      });

      const transformed = (response.reviews || []).map((review) =>
        transformReviewV2ToGraphQLReview(review)
      );

      setReviews((prev) => {
        const all = append ? [...prev, ...transformed] : transformed;
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setOffset(currentOffset + transformed.length);
      setHasMore(!!response.hasMore);
    } catch (error) {
      console.error('Error loading following feed:', error);
      if (!append) setReviews([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [enabled, isUuidUserId, offset, userId]);

  const loadMore = useCallback(() => {
    if (!enabled) return;
    if (!loading && hasMore && !initialLoading) {
      loadFollowingReviews(true);
    }
  }, [enabled, loading, hasMore, initialLoading, loadFollowingReviews]);

  const refreshFollowingReviews = useCallback(async () => {
    if (!enabled) return;
    setOffset(0);
    setHasMore(true);
    await loadFollowingReviews(false);
  }, [enabled, loadFollowingReviews]);

  // Initial load / user changes
  useEffect(() => {
    if (!enabled) return;
    setReviews([]);
    setOffset(0);
    setHasMore(true);
    setInitialLoading(true);
    void loadFollowingReviews(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]); // intentionally exclude loadFollowingReviews to avoid re-fetch loops

  return {
    reviews,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    refreshFollowingReviews
  };
};