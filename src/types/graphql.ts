// Centralized GraphQL type definitions for type consistency

export interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// Review Types
export interface GraphQLReview {
  id: string;
  databaseId: number;
  uri?: string;
  reviewMainTitle: string;
  commentLikes: number;
  userLiked: boolean;
  reviewStars: string | number;
  date: string;
  content: string;
  reviewImages: GraphQLReviewImage[];
  palates: string;
  userAvatar?: string;
  author: GraphQLAuthor;
  commentedOn: GraphQLCommentedOn;
  recognitions?: string[];
  userId?: string;
  hashtags?: string[];
}

export interface GraphQLReviewImage {
  databaseId: number;
  id: string;
  sourceUrl: string;
}

// Hashtag Types
export interface GraphQLHashtag {
  id: string;
  name: string;
  slug: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface HashtagSearchResult {
  hashtag: string;
  posts: number;
  recentPosts: Array<{
    id: string;
    title: string;
    image?: string;
    date: string;
  }>;
}

export interface GraphQLAuthor {
  name: string;
  node: {
    id: string;
    databaseId: number;
    name: string;
    nicename?: string;
    avatar: {
      url: string;
    };
  };
}

export interface GraphQLCommentedOn {
  node: {
    databaseId: number;
    title: string;
    slug: string;
    fieldMultiCheck90?: string;
    featuredImage: {
      node: {
        databaseId: string;
        altText: string;
        mediaItemUrl: string;
        mimeType: string;
        mediaType: string;
      };
    };
  };
}

// Restaurant Types
export interface GraphQLRestaurant {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  priceRange: string;
  averageRating: number;
  listingStreet: string;
  status: string;
  palates: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
  featuredImage?: {
    node: {
      sourceUrl: string;
    };
  };
  listingCategories: {
    nodes: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  };
  listingDetails: {
    googleMapUrl: {
      streetAddress: string;
    };
  };
  isFavorite?: boolean;
  ratingsCount?: number;
}

// User Types
export interface GraphQLUser {
  id: string;
  databaseId: number;
  name: string;
  nicename: string;
  avatar: {
    url: string;
  };
}

// API Response Types
export interface ReviewsResponse {
  reviews: GraphQLReview[];
  pageInfo: PageInfo;
}

export interface RestaurantsResponse {
  nodes: GraphQLRestaurant[];
  pageInfo: PageInfo;
}

// Component Props Types
export interface ReviewBlockProps {
  review: {
    databaseId: number;
    id: string;
    authorId: number;
    restaurantId: string;
    user: string;
    rating: number;
    date: string;
    title?: string;
    comment: string;
    images: string[];
    userImage: string;
    recognitions?: string[];
    palateNames?: string[];
    commentLikes?: number;
    userLiked?: boolean;
  };
}

// RestaurantCardProps moved to src/types/restaurant.ts
// This export is kept for backward compatibility but will be deprecated
export type { RestaurantCardProps } from "./restaurant"
