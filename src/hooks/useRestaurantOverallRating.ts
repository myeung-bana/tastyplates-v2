import { useState, useEffect } from 'react';
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import { calculateOverallRating } from '@/utils/reviewUtils';
import { GraphQLReview } from '@/types/graphql';

interface OverallRatingResult {
  rating: number;
  count: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and calculate overall rating for a restaurant
 * Uses the same calculation logic as the restaurant detail page
 */
export function useRestaurantOverallRating(
  restaurantUuid: string | undefined,
  restaurantDatabaseId: number | undefined,
  enabled: boolean = true
): OverallRatingResult {
  const [rating, setRating] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !restaurantUuid || !restaurantDatabaseId) {
      return;
    }

    const fetchOverallRating = async () => {
      setLoading(true);
      setError(null);

      try {
        let allFetched: GraphQLReview[] = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        // Fetch all reviews using offset-based pagination (same as detail page)
        while (hasMore) {
          const response = await reviewV2Service.getReviewsByRestaurant(restaurantUuid, {
            limit,
            offset
          });

          // Transform ReviewV2 to GraphQLReview
          const transformed = response.reviews.map((review) => 
            transformReviewV2ToGraphQLReview(review, restaurantDatabaseId)
          );

          allFetched = allFetched.concat(transformed);
          hasMore = response.hasMore || false;
          offset += transformed.length;

          // Safety check to prevent infinite loops
          if (transformed.length === 0) break;
        }

        // Calculate overall rating using the same function as detail page
        const result = calculateOverallRating(allFetched);
        setRating(result.rating);
        setCount(result.count);
      } catch (err) {
        console.error('Error fetching overall rating:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rating');
        setRating(0);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOverallRating();
  }, [restaurantUuid, restaurantDatabaseId, enabled]);

  return { rating, count, loading, error };
}

