import { useMemo } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { normalizePalates, hasMatchingPalates, calculatePalateSimilarity } from '@/utils/palateUtils';
import { GraphQLReview } from '@/types/graphql';

export interface SimilarPalatesOptions<T> {
  /**
   * Array of items to filter (reviews, users, etc.)
   */
  items: T[];
  
  /**
   * Function to extract palates from each item
   */
  getPalates: (item: T) => string | string[] | any[] | null | undefined;
  
  /**
   * Optional: Function to extract rating from each item (for reviews)
   */
  getRating?: (item: T) => number | null | undefined;
  
  /**
   * Optional: Minimum similarity threshold (0-1)
   * Default: 0 (any match)
   */
  minSimilarity?: number;
  
  /**
   * Optional: Custom user palates (overrides current user's palates)
   */
  customUserPalates?: string | string[] | any[] | null;
}

export interface SimilarPalatesResult<T> {
  /**
   * Filtered items that match user's palates
   */
  matchingItems: T[];
  
  /**
   * Count of matching items
   */
  count: number;
  
  /**
   * Average rating from matching items (if getRating provided)
   */
  averageRating: number;
  
  /**
   * Items with similarity scores
   */
  itemsWithSimilarity: Array<{
    item: T;
    similarity: number;
  }>;
  
  /**
   * Sorted items by similarity (highest first)
   */
  sortedBySimilarity: T[];
}

/**
 * Generic hook to filter items based on similar palates
 * Can be used for reviews, users, restaurants, etc.
 * 
 * @example
 * ```tsx
 * const { matchingItems, averageRating, count } = useSimilarPalates({
 *   items: reviews,
 *   getPalates: (review) => review.palates,
 *   getRating: (review) => parseFloat(String(review.reviewStars || "0"))
 * });
 * ```
 */
export function useSimilarPalates<T>(options: SimilarPalatesOptions<T>): SimilarPalatesResult<T> {
  const { user } = useFirebaseSession();
  const {
    items,
    getPalates,
    getRating,
    minSimilarity = 0,
    customUserPalates
  } = options;
  
  // Use custom palates if provided, otherwise use current user's palates
  const userPalates = customUserPalates !== undefined 
    ? customUserPalates 
    : (user?.palates || null);
  
  return useMemo(() => {
    if (!userPalates || items.length === 0) {
      return {
        matchingItems: [],
        count: 0,
        averageRating: 0,
        itemsWithSimilarity: [],
        sortedBySimilarity: []
      };
    }
    
    // Calculate similarity for each item
    const itemsWithSimilarity = items.map(item => {
      const itemPalates = getPalates(item);
      const similarity = calculatePalateSimilarity(userPalates, itemPalates);
      
      return {
        item,
        similarity
      };
    });
    
    // Filter by minimum similarity threshold
    const filtered = itemsWithSimilarity.filter(
      ({ similarity }) => similarity >= minSimilarity
    );
    
    // Sort by similarity (highest first)
    const sorted = [...filtered].sort((a, b) => b.similarity - a.similarity);
    
    // Calculate average rating if getRating function provided
    let averageRating = 0;
    if (getRating) {
      const ratings = filtered
        .map(({ item }) => getRating(item))
        .filter((rating): rating is number => rating !== null && rating !== undefined && rating > 0);
      
      if (ratings.length > 0) {
        averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        averageRating = Math.round(averageRating * 100) / 100; // Round to 2 decimal places
      }
    }
    
    return {
      matchingItems: filtered.map(({ item }) => item),
      count: filtered.length,
      averageRating,
      itemsWithSimilarity: filtered,
      sortedBySimilarity: sorted.map(({ item }) => item)
    };
  }, [items, userPalates, minSimilarity, getPalates, getRating]);
}

/**
 * Specialized hook for filtering reviews by similar palates
 * 
 * @example
 * ```tsx
 * const { matchingItems, averageRating, count } = useSimilarPalatesReviews(reviews);
 * ```
 */
export function useSimilarPalatesReviews(reviews: GraphQLReview[]) {
  const { user } = useFirebaseSession();
  
  return useSimilarPalates({
    items: reviews,
    getPalates: (review) => review.palates || null,
    getRating: (review) => {
      const rating = parseFloat(String(review.reviewStars || "0"));
      return !isNaN(rating) && rating > 0 ? rating : null;
    }
  });
}

/**
 * Specialized hook for filtering users by similar palates
 * 
 * @example
 * ```tsx
 * const { sortedBySimilarity } = useSimilarPalatesUsers(users);
 * ```
 */
export function useSimilarPalatesUsers<T extends { palates?: any }>(users: T[]) {
  const { user } = useFirebaseSession();
  
  return useSimilarPalates({
    items: users,
    getPalates: (user) => user.palates || null
  });
}

