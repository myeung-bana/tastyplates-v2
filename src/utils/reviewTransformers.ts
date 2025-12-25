// Data transformation utilities for reviews
// Transforms between WordPress format, Hasura format, and component format

import { ReviewV2, ReviewImage } from '@/app/api/v1/services/reviewV2Service';
import { ReviewedDataProps } from '@/interfaces/Reviews/review';
import { GraphQLReview, GraphQLReviewImage, GraphQLAuthor, GraphQLCommentedOn } from '@/types/graphql';
import { DEFAULT_USER_ICON } from '@/constants/images';

/**
 * Transform WordPress review image format to Hasura ReviewImage format
 */
export function transformWordPressImagesToReviewImages(
  wordpressImages: string[] | any[]
): ReviewImage[] {
  if (!Array.isArray(wordpressImages) || wordpressImages.length === 0) {
    return [];
  }

  return wordpressImages.map((img, index) => {
    // If it's already a URL string
    if (typeof img === 'string') {
      return {
        id: `img-${Date.now()}-${index}`,
        url: img,
        thumbnail_url: img, // Use same URL as thumbnail if not provided
        alt_text: '',
        display_order: index,
      };
    }

    // If it's an object with WordPress structure
    if (typeof img === 'object' && img !== null) {
      return {
        id: img.id || img.attachment_id || `img-${Date.now()}-${index}`,
        url: img.url || img.sourceUrl || img.source_url || '',
        thumbnail_url: img.thumbnailUrl || img.thumbnail_url || img.url || img.sourceUrl || '',
        alt_text: img.alt || img.alt_text || '',
        display_order: img.display_order !== undefined ? img.display_order : index,
        width: img.width,
        height: img.height,
        file_size: img.file_size,
        mime_type: img.mime_type || img.mimeType,
      };
    }

    // Fallback
    return {
      id: `img-${Date.now()}-${index}`,
      url: String(img),
      thumbnail_url: String(img),
      alt_text: '',
      display_order: index,
    };
  });
}

/**
 * Transform Hasura ReviewImage format to simple URL array (for backward compatibility)
 */
export function transformReviewImagesToUrls(images: ReviewImage[] | null): string[] {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  return images.map(img => img.url).filter(Boolean);
}

/**
 * Transform Hasura ReviewV2 to component-friendly format
 */
export interface TransformedReview {
  id: string;
  databaseId?: string; // For backward compatibility
  title?: string;
  content: string;
  rating: number;
  review_stars: number; // Alias for rating
  review_main_title?: string; // Alias for title
  review_images: string[]; // Transformed from images array
  images: ReviewImage[] | null; // Original images array
  palates?: string[];
  hashtags?: string[];
  mentions?: any[];
  recognitions?: string[];
  likes_count: number;
  replies_count: number;
  status: string;
  created_at: string;
  published_at?: string;
  author?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image?: any;
  };
  restaurant?: {
    uuid: string;
    title: string;
    slug: string;
  };
  user_liked?: boolean;
}

export function transformReviewV2ToComponent(review: ReviewV2): TransformedReview {
  return {
    id: review.id,
    databaseId: review.id, // Use UUID as databaseId for compatibility
    title: review.title || undefined,
    content: review.content,
    rating: review.rating,
    review_stars: review.rating, // Alias
    review_main_title: review.title || undefined, // Alias
    review_images: transformReviewImagesToUrls(review.images),
    images: review.images,
    palates: review.palates || undefined,
    hashtags: review.hashtags || undefined,
    mentions: review.mentions || undefined,
    recognitions: review.recognitions || undefined,
    likes_count: review.likes_count,
    replies_count: review.replies_count,
    status: review.status,
    created_at: review.created_at,
    published_at: review.published_at || undefined,
    author: review.author,
    restaurant: review.restaurant,
    user_liked: review.user_liked,
  };
}

/**
 * Transform component review data to CreateReviewInput format
 */
export function transformComponentToCreateInput(data: {
  restaurant_uuid?: string;
  restaurant_slug?: string;
  author_id: string;
  title?: string;
  review_main_title?: string;
  content: string;
  rating?: number;
  review_stars?: number;
  review_images?: string[];
  images?: ReviewImage[];
  palates?: string[];
  hashtags?: string[];
  mentions?: any[];
  recognitions?: string[];
  status?: 'draft' | 'pending';
  parent_review_id?: string;
}): {
  restaurant_uuid: string;
  author_id: string;
  title?: string;
  content: string;
  rating: number;
  images?: ReviewImage[];
  palates?: string[];
  hashtags?: string[];
  mentions?: any[];
  recognitions?: string[];
  status?: 'draft' | 'pending';
  parent_review_id?: string;
} {
  // Determine rating
  const rating = data.rating ?? data.review_stars ?? 0;

  // Determine title
  const title = data.title || data.review_main_title;

  // Transform images
  let images: ReviewImage[] | undefined;
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    images = data.images;
  } else if (data.review_images && Array.isArray(data.review_images) && data.review_images.length > 0) {
    images = transformWordPressImagesToReviewImages(data.review_images);
  }

  return {
    restaurant_uuid: data.restaurant_uuid || '', // Will need to be fetched if only slug provided
    author_id: data.author_id,
    title,
    content: data.content,
    rating,
    images,
    palates: data.palates,
    hashtags: data.hashtags,
    mentions: data.mentions,
    recognitions: data.recognitions,
    status: data.status || 'draft',
    parent_review_id: data.parent_review_id,
  };
}

/**
 * Extract restaurant UUID from slug (helper for components that only have slug)
 */
export async function getRestaurantUuidFromSlug(slug: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/v1/restaurants-v2/get-restaurant-by-id?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.data?.uuid || null;
  } catch {
    return null;
  }
}

/**
 * Helper function to extract profile image URL from JSONB format
 */
function getProfileImageUrl(profileImage: any): string | null {
  if (!profileImage) return null;
  
  // If it's a string, return it directly
  if (typeof profileImage === 'string') {
    return profileImage;
  }
  
  // If it's an object, extract the URL
  if (typeof profileImage === 'object') {
    // Try different possible URL fields
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  
  return null;
}

/**
 * Transform ReviewV2 (Hasura) to ReviewedDataProps (component format)
 * Used for ReviewsTab in profile pages
 */
export function transformReviewV2ToReviewedDataProps(review: ReviewV2): ReviewedDataProps {
  // Parse images from JSONB
  const images = Array.isArray(review.images) ? review.images : [];
  const reviewImages = images.map((img: any, index: number) => ({
    databaseId: index,
    id: img.id || `${review.id}-${index}`,
    sourceUrl: typeof img === 'string' ? img : (img.url || img.sourceUrl || '')
  }));

  // Get author info
  const authorName = review.author?.display_name || review.author?.username || 'Unknown User';
  const authorAvatar = review.author?.profile_image 
    ? (getProfileImageUrl(review.author.profile_image) || DEFAULT_USER_ICON)
    : DEFAULT_USER_ICON;

  // Get restaurant info
  const restaurantTitle = review.restaurant?.title || '';
  const restaurantSlug = review.restaurant?.slug || '';
  const restaurantImage = review.restaurant?.featured_image_url || '';

  // Parse palates
  const palatesArray = Array.isArray(review.palates) ? review.palates : [];
  const palatesString = palatesArray.join('|');

  // Format date
  const date = review.published_at || review.created_at;

  // Generate databaseId from UUID (for compatibility)
  // Use a hash or simple numeric conversion
  const databaseId = parseInt(review.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647;

  // Generate userId from author_id UUID
  const userId = review.author?.id 
    ? parseInt(review.author.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647
    : 0;

  return {
    databaseId,
    id: review.id,
    reviewMainTitle: review.title || '',
    commentLikes: String(review.likes_count || 0),
    userLiked: review.user_liked || false,
    content: review.content,
    uri: '',
    reviewStars: String(review.rating || 0),
    date,
    reviewImages,
    palates: palatesString,
    userAvatar: authorAvatar,
    author: {
      name: authorName,
      node: {
        id: review.author_id,
        databaseId: userId,
        name: authorName,
        username: review.author?.username, // Include username for profile URLs
        avatar: {
          url: authorAvatar
        }
      }
    },
    userId,
    commentedOn: {
      node: {
        databaseId: review.restaurant?.id || parseInt(review.restaurant?.uuid?.replace(/-/g, '').substring(0, 8) || '0', 16) % 2147483647 || 0,
        title: restaurantTitle,
        slug: restaurantSlug,
        fieldMultiCheck90: '',
        featuredImage: {
          node: {
            databaseId: restaurantImage,
            altText: restaurantTitle,
            mediaItemUrl: restaurantImage,
            mimeType: 'image/jpeg',
            mediaType: 'image',
          }
        }
      }
    }
  };
}

/**
 * Transform ReviewV2 (Hasura) to GraphQLReview (component format)
 * Used for RestaurantReviews component on restaurant detail pages
 */
export function transformReviewV2ToGraphQLReview(review: ReviewV2, restaurantDatabaseId?: number): GraphQLReview {
  // Parse images from JSONB
  const images = Array.isArray(review.images) ? review.images : [];
  const reviewImages: GraphQLReviewImage[] = images.map((img: any, index: number) => ({
    databaseId: index,
    id: img.id || `${review.id}-${index}`,
    sourceUrl: typeof img === 'string' ? img : (img.url || img.sourceUrl || '')
  }));

  // Get author info - ensure we have all required fields
  // Use author_id from review as primary source, fallback to author.id
  const authorId = review.author_id || review.author?.id || '';
  const authorName = review.author?.display_name || review.author?.username || 'Unknown User';
  const authorUsername = review.author?.username || '';
  const authorAvatar = review.author?.profile_image 
    ? (getProfileImageUrl(review.author.profile_image) || DEFAULT_USER_ICON)
    : DEFAULT_USER_ICON;

  // Generate databaseId from UUID (for compatibility)
  const databaseId = parseInt(review.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647;

  // Generate userId from author_id UUID - ensure we use the actual author_id
  const userId = authorId 
    ? parseInt(authorId.replace(/-/g, '').substring(0, 8), 16) % 2147483647
    : 0;

  // Get restaurant info
  const restaurantTitle = review.restaurant?.title || '';
  const restaurantSlug = review.restaurant?.slug || '';
  const restaurantImage = review.restaurant?.featured_image_url || '';
  const restaurantDbId = restaurantDatabaseId 
    || review.restaurant?.id 
    || parseInt(review.restaurant?.uuid?.replace(/-/g, '').substring(0, 8) || '0', 16) % 2147483647 
    || 0;

  // Parse palates - use author's palates if available (for My Preference rating)
  // Otherwise fall back to review's palates (for display)
  // For "My Preference" rating, we need author palates, not review palates
  const authorPalatesArray = Array.isArray(review.author?.palates) 
    ? review.author.palates 
    : [];
  const reviewPalatesArray = Array.isArray(review.palates) ? review.palates : [];
  // Prefer author palates for matching, but fall back to review palates for display
  const palatesArray = authorPalatesArray.length > 0 ? authorPalatesArray : reviewPalatesArray;
  const palatesString = palatesArray.join('|');

  // Format date
  const date = review.published_at || review.created_at;

  return {
    id: review.id,
    databaseId,
    uri: '',
    reviewMainTitle: review.title || '',
    commentLikes: review.likes_count || 0,
    userLiked: review.user_liked || false,
    reviewStars: String(review.rating || 0),
    date,
    content: review.content,
    reviewImages,
    palates: palatesString,
    userAvatar: authorAvatar, // Ensure this is set
    author: {
      name: authorName,
      node: {
        id: authorId, // Use author_id from review, fallback to author.id
        databaseId: userId, // Numeric conversion for compatibility
        name: authorName,
        username: authorUsername, // CRITICAL: Ensure username is included
        avatar: {
          url: authorAvatar
        }
      }
    },
    commentedOn: {
      node: {
        databaseId: restaurantDbId,
        title: restaurantTitle,
        slug: restaurantSlug,
        fieldMultiCheck90: '',
        featuredImage: {
          node: {
            databaseId: restaurantImage,
            altText: restaurantTitle,
            mediaItemUrl: restaurantImage,
            mimeType: 'image/jpeg',
            mediaType: 'image',
          }
        }
      }
    },
    recognitions: review.recognitions || [],
    userId: authorId, // Use the actual UUID
    hashtags: review.hashtags || []
  };
}

