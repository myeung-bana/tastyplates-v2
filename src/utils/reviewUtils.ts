import { Review, reviewlist } from "@/data/dummyReviews";
import { GraphQLReview } from "@/types/graphql";

export const getRestaurantReviews = (restaurantId: string): Review[] => {
  return reviewlist[0]?.reviews?.filter(
    (review) => review.restaurantId === restaurantId
  ) || [];
};

export const getRestaurantReviewsCount = (restaurantId: string): number => {
  return reviewlist[0]?.reviews?.filter(
    (review) => review.restaurantId === restaurantId
  ).length || 0;
};

export const getAllReviews = (): Review[] => {
  return reviewlist[0]?.reviews || [];
};

/**
 * Interface for rating calculation results
 */
export interface RatingMetrics {
  overallRating: number;
  overallCount: number;
  searchRating: number;
  searchCount: number;
  myPreferenceRating: number;
  myPreferenceCount: number;
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
    const rating = parseFloat(String(review.reviewStars || "0"));
    return !isNaN(rating) && rating > 0;
  });

  if (validReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => {
    return sum + parseFloat(String(review.reviewStars || "0"));
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
    const rating = parseFloat(String(review.reviewStars || "0"));
    return !isNaN(rating) && rating > 0;
  });

  if (validReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => {
    return sum + parseFloat(String(review.reviewStars || "0"));
  }, 0);

  const averageRating = totalRating / validReviews.length;
  
  return {
    rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
    count: validReviews.length
  };
}

/**
 * Calculate user preference rating based on reviews from users with matching palates
 * @param reviews - Array of all reviews for the restaurant
 * @param userPalates - Current user's palate string (pipe-separated)
 * @returns User preference rating and count
 */
export function calculateMyPreferenceRating(reviews: GraphQLReview[], userPalates: string | null): { rating: number; count: number } {
  if (!reviews || reviews.length === 0 || !userPalates) {
    return { rating: 0, count: 0 };
  }

  // Filter reviews where reviewer palates match the current user's palates
  const matchingReviews = reviews.filter(review => {
    const reviewerPalates = review.palates || "";
    const reviewerPalateArray = reviewerPalates.split("|").map(p => p.trim().toLowerCase());
    const userPalateArray = userPalates.split("|").map(p => p.trim().toLowerCase());
    
    // Check if any of the reviewer's palates match any of the user's palates
    return reviewerPalateArray.some(reviewerPalate => 
      userPalateArray.some(userPalate => 
        reviewerPalate.includes(userPalate) || 
        userPalate.includes(reviewerPalate)
      )
    );
  });

  if (matchingReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const validReviews = matchingReviews.filter(review => {
    const rating = parseFloat(String(review.reviewStars || "0"));
    return !isNaN(rating) && rating > 0;
  });

  if (validReviews.length === 0) {
    return { rating: 0, count: 0 };
  }

  const totalRating = validReviews.reduce((sum, review) => {
    return sum + parseFloat(String(review.reviewStars || "0"));
  }, 0);

  const averageRating = totalRating / validReviews.length;
  
  return {
    rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
    count: validReviews.length
  };
}

/**
 * Calculate all rating metrics for a restaurant
 * @param restaurantReviews - Reviews for the specific restaurant
 * @param allReviews - All reviews in the system (for search rating calculation)
 * @param searchTerm - The search term from URL parameters
 * @param userPalates - Current user's palate string (pipe-separated)
 * @returns Combined rating metrics
 */
export function calculateRatingMetrics(
  restaurantReviews: GraphQLReview[],
  allReviews: GraphQLReview[],
  searchTerm: string | null,
  userPalates: string | null = null
): RatingMetrics {
  const overall = calculateOverallRating(restaurantReviews);
  const search = searchTerm ? calculateSearchRating(allReviews, searchTerm) : { rating: 0, count: 0 };
  const myPreference = userPalates ? calculateMyPreferenceRating(restaurantReviews, userPalates) : { rating: 0, count: 0 };

  return {
    overallRating: overall.rating,
    overallCount: overall.count,
    searchRating: search.rating,
    searchCount: search.count,
    myPreferenceRating: myPreference.rating,
    myPreferenceCount: myPreference.count
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

/**
 * Interface for community recognition metrics
 */
export interface CommunityRecognitionMetrics {
  mustRevisit: number;
  instaWorthy: number;
  valueForMoney: number;
  bestService: number;
}

/**
 * Calculate community recognition metrics from reviews
 * @param reviews - Array of reviews for the restaurant
 * @returns Community recognition metrics with counts for each recognition type
 */
export function calculateCommunityRecognitionMetrics(reviews: GraphQLReview[]): CommunityRecognitionMetrics {
  if (!reviews || reviews.length === 0) {
    return {
      mustRevisit: 0,
      instaWorthy: 0,
      valueForMoney: 0,
      bestService: 0
    };
  }

  const metrics = {
    mustRevisit: 0,
    instaWorthy: 0,
    valueForMoney: 0,
    bestService: 0
  };

  reviews.forEach(review => {
    if (!review.recognitions || !Array.isArray(review.recognitions)) {
      return;
    }

    review.recognitions.forEach(recognition => {
      const trimmedRecognition = recognition.trim();
      switch (trimmedRecognition) {
        case "Must Revisit":
          metrics.mustRevisit++;
          break;
        case "Insta-Worthy":
          metrics.instaWorthy++;
          break;
        case "Value for Money":
          metrics.valueForMoney++;
          break;
        case "Best Service":
          metrics.bestService++;
          break;
        default:
          // Handle any unrecognized recognition types
          console.warn(`Unknown recognition type: ${trimmedRecognition}`);
          break;
      }
    });
  });

  return metrics;
}

/**
 * Get the total count of all recognitions
 * @param metrics - Community recognition metrics
 * @returns Total count of all recognitions
 */
export function getTotalRecognitionCount(metrics: CommunityRecognitionMetrics): number {
  return metrics.mustRevisit + metrics.instaWorthy + metrics.valueForMoney + metrics.bestService;
}

/**
 * Get recognition metrics as an array for easy iteration
 * @param metrics - Community recognition metrics
 * @returns Array of recognition objects with name and count
 */
export function getRecognitionMetricsArray(metrics: CommunityRecognitionMetrics): Array<{ name: string; count: number }> {
  return [
    { name: "Must Revisit", count: metrics.mustRevisit },
    { name: "Insta-Worthy", count: metrics.instaWorthy },
    { name: "Value for Money", count: metrics.valueForMoney },
    { name: "Best Service", count: metrics.bestService }
  ];
}