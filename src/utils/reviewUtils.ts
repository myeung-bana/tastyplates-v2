import { Review, reviewlist } from "@/data/dummyReviews";
import { GraphQLReview } from "@/types/graphql";

export const getRestaurantReviews = (restaurantId: string): Review[] => {
  return reviewlist[0].reviews.filter(
    (review) => review.restaurantId === restaurantId
  );
};

export const getRestaurantReviewsCount = (restaurantId: string): number => {
  return reviewlist[0].reviews.filter(
    (review) => review.restaurantId === restaurantId
  ).length;
};

export const getAllReviews = (): Review[] => {
  return reviewlist[0].reviews;
};

/**
 * Interface for rating calculation results
 */
export interface RatingMetrics {
  overallRating: number;
  overallCount: number;
  searchRating: number;
  searchCount: number;
}

/**
 * Calculate overall rating for a specific restaurant
 * @param reviews - Array of reviews for the restaurant
 * @returns Overall rating and count
 */
export function calculateOverallRating(reviews: GraphQLReview[]): { rating: number; count: number } {
  if (!reviews || reviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const validReviews = reviews.filter(review => {
    const rating = parseFloat(review.reviewStars || "0");
    return !isNaN(rating) && rating > 0;
  });

  if (validReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => {
    return sum + parseFloat(review.reviewStars || "0");
  }, 0);

  const averageRating = totalRating / validReviews.length;
  
  return {
    rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
    count: validReviews.length
  };
}

/**
 * Calculate search rating based on user palates matching the search term
 * @param reviews - Array of all reviews
 * @param searchTerm - The search term (e.g., "Japanese", "Italian")
 * @returns Search rating and count
 */
export function calculateSearchRating(reviews: GraphQLReview[], searchTerm: string): { rating: number; count: number } {
  if (!reviews || reviews.length === 0 || !searchTerm) {
    return { rating: 0, count: 0 };
  }

  // Filter reviews where user palates match the search term
  const matchingReviews = reviews.filter(review => {
    const userPalates = review.palates || "";
    const palateArray = userPalates.split("|").map(p => p.trim().toLowerCase());
    const searchTermLower = searchTerm.toLowerCase();
    
    // Check if any of the user's palates match the search term
    return palateArray.some(palate => 
      palate.includes(searchTermLower) || 
      searchTermLower.includes(palate)
    );
  });

  if (matchingReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const validReviews = matchingReviews.filter(review => {
    const rating = parseFloat(review.reviewStars || "0");
    return !isNaN(rating) && rating > 0;
  });

  if (validReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => {
    return sum + parseFloat(review.reviewStars || "0");
  }, 0);

  const averageRating = totalRating / validReviews.length;
  
  return {
    rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
    count: validReviews.length
  };
}

/**
 * Calculate both overall and search ratings for a restaurant
 * @param restaurantReviews - Reviews for the specific restaurant
 * @param allReviews - All reviews in the system (for search rating calculation)
 * @param searchTerm - The search term from URL parameters
 * @returns Combined rating metrics
 */
export function calculateRatingMetrics(
  restaurantReviews: GraphQLReview[],
  allReviews: GraphQLReview[],
  searchTerm: string | null
): RatingMetrics {
  const overall = calculateOverallRating(restaurantReviews);
  const search = searchTerm ? calculateSearchRating(allReviews, searchTerm) : { rating: 0, count: 0 };

  return {
    overallRating: overall.rating,
    overallCount: overall.count,
    searchRating: search.rating,
    searchCount: search.count
  };
}

/**
 * Format rating for display (handles whole numbers vs decimals)
 * @param rating - The rating value
 * @returns Formatted rating string
 */
export function formatRating(rating: number): string {
  if (rating === 0) return "0";
  return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(2);
}

/**
 * Get rating display text with count
 * @param rating - The rating value
 * @param count - The number of reviews
 * @returns Formatted rating text
 */
export function getRatingDisplayText(rating: number, count: number): string {
  const formattedRating = formatRating(rating);
  const reviewText = count === 1 ? "review" : "reviews";
  return `${formattedRating} (${count} ${reviewText})`;
}

/**
 * Check if a user's palate matches the search term
 * @param userPalates - User's palate string (pipe-separated)
 * @param searchTerm - The search term to match against
 * @returns True if there's a match
 */
export function doesPalateMatchSearch(userPalates: string, searchTerm: string): boolean {
  if (!userPalates || !searchTerm) return false;
  
  const palateArray = userPalates.split("|").map(p => p.trim().toLowerCase());
  const searchTermLower = searchTerm.toLowerCase();
  
  return palateArray.some(palate => 
    palate.includes(searchTermLower) || 
    searchTermLower.includes(palate)
  );
}
