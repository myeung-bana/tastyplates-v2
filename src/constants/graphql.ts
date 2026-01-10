// GraphQL Query Limits and Constants
// Standardized limits to optimize Hasura free tier usage and prevent overfetching

export const GRAPHQL_LIMITS = {
  // Feed/List Views
  REVIEWS_FEED: 16,              // Homepage trending/following feeds
  RESTAURANTS_LIST: 8,            // Restaurant list page
  USERS_SUGGESTIONS: 10,          // Suggested users
  FOLLOWING_FEED: 4,              // Following feed initial load
  FOLLOWING_FEED_LOAD_MORE: 4,    // Following feed pagination
  
  // Detail Views
  REVIEW_REPLIES: 20,             // Comments/replies per page
  USER_REVIEWS: 16,               // Profile reviews tab
  RESTAURANT_REVIEWS: 10,         // Restaurant page reviews
  
  // Batch Operations (Safety Caps)
  BATCH_USERS_MAX: 100,           // Max users to fetch at once
  BATCH_RESTAURANTS_MAX: 100,     // Max restaurants to fetch at once
  BATCH_REVIEWS_MAX: 100,         // Max reviews to fetch at once
  BATCH_FOLLOWING_MAX: 100,       // Max followed users for feed generation
  
  // API Endpoints
  API_DEFAULT: 50,                // Default for API routes
  API_MAX: 100,                   // Maximum allowed by API
  
  // Mobile Optimizations
  MOBILE_REVIEWS: 5,              // Fewer on mobile for speed
  MOBILE_RESTAURANTS: 6,          // Fewer on mobile
  
  // Review Viewer
  REVIEW_VIEWER_WINDOW: 3,        // Window size for swipeable viewer (prev + current + next)
} as const;

// Query Complexity Limits (for Hasura configuration)
export const HASURA_CONFIG = {
  QUERY_DEPTH_LIMIT: 10,          // Maximum query nesting depth
  NODE_LIMIT: 1000,               // Maximum nodes per query
  RATE_LIMIT_PER_MINUTE: 60,      // Free tier limit
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  REVIEWS: 300,                   // 5 minutes
  RESTAURANTS: 600,               // 10 minutes
  USERS: 300,                     // 5 minutes
  TAXONOMIES: 3600,               // 1 hour (rarely changes)
  PRICE_RANGES: 3600,             // 1 hour (rarely changes)
} as const;

// Helper function to get appropriate limit based on context
export function getQueryLimit(context: keyof typeof GRAPHQL_LIMITS): number {
  return GRAPHQL_LIMITS[context];
}

// Helper function to cap user input to safe limits
export function capLimit(requestedLimit: number, maxLimit: number = GRAPHQL_LIMITS.API_MAX): number {
  return Math.min(Math.max(1, requestedLimit), maxLimit);
}
