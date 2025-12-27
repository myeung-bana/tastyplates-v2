import "@/styles/pages/_restaurant-details.scss";
import { Tab, Tabs } from "@heroui/tabs";
import { Masonry } from "masonic";
import { useEffect, useState, useCallback, useRef } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import Photos from "./Details/Photos";
import Pagination from "../common/Pagination";
import ReviewBlock from "../review/ReviewBlock";
import ReviewBlockSkeleton from "../ui/Skeleton/ReviewBlockSkeleton";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { ReviewService } from "@/services/Reviews/reviewService";
import { DEFAULT_USER_ICON } from "@/constants/images";
import { GraphQLReview } from "@/types/graphql";
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import EmptyState from '../ui/EmptyState/EmptyState';

// Type definitions for raw review data from API
interface RawReviewAuthor {
  node?: {
    databaseId?: number;
    name?: string;
    avatar?: {
      url?: string;
    };
  };
  name?: string;
}

interface RawReviewCommentedOn {
  node?: {
    databaseId?: number;
  };
}

interface RawReviewImage {
  sourceUrl: string;
  id?: string | number;
}

interface RawReview {
  databaseId: number;
  id: string;
  author?: RawReviewAuthor;
  authorId?: number;
  commentedOn?: RawReviewCommentedOn;
  restaurantId?: string;
  user?: string;
  reviewStars?: string | number;
  rating?: string | number;
  date: string;
  reviewMainTitle: string;
  content: string;
  reviewImages?: RawReviewImage[];
  userAvatar?: string;
  recognitions?: string[];
  palates?: string;
  commentLikes?: number;
  userLiked?: boolean;
}

// Helper to map RawReview to ReviewBlockProps["review"]
function toReviewBlockReview(raw: RawReview) {
  return {
    databaseId: raw.databaseId,
    id: raw.id,
    authorId: raw.author?.node?.databaseId ?? raw.authorId ?? 0,
    restaurantId: raw.commentedOn?.node?.databaseId?.toString() ?? raw.restaurantId ?? '',
    user: raw.author?.node?.name ?? raw.user ?? '',
    rating: Number(raw.reviewStars ?? raw.rating ?? 0),
    date: raw.date,
    title: raw.reviewMainTitle,
    comment: raw.content,
    images: Array.isArray(raw.reviewImages) ? raw.reviewImages.map(img => img.sourceUrl) : [],
    userImage: raw.author?.node?.avatar?.url ?? raw.userAvatar ?? '',
    recognitions: raw.recognitions,
    palateNames: typeof raw.palates === 'string' ? raw.palates.split('|') : [],
    commentLikes: raw.commentLikes ?? 0,
    userLiked: Boolean(raw.userLiked),
  };
}

// Helper to map ReviewBlockProps["review"] to ReviewedDataProps
const mapToReviewedDataProps = (review: ReturnType<typeof toReviewBlockReview>): ReviewedDataProps => {
  const reviewImages: ReviewedDataProps["reviewImages"] = review.images.map((src, index) => ({
    databaseId: index,
    id: `${review.id}-${index}`,
    sourceUrl: src,
  }));

  // Encode relay global ID for user
  const encodeRelayId = (type: string, id: number) => {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(`${type}:${id}`);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(`${type}:${id}`).toString('base64');
    }
    return `${type}:${id}`;
  };

  const userRelayId = encodeRelayId('user', review.authorId);

  return {
    databaseId: review.databaseId,
    id: review.id,
    reviewMainTitle: review.title || "",
    commentLikes: String(review.commentLikes ?? 0),
    userLiked: review.userLiked ?? false,
    content: review.comment,
    uri: "",
    reviewStars: String(review.rating),
    date: review.date,
    reviewImages,
    palates: review.palateNames?.join("|") ?? "",
    userAvatar: review.userImage || DEFAULT_USER_ICON,
    author: {
      name: review.user,
      node: {
        id: userRelayId,
        databaseId: review.authorId,
        name: review.user,
        avatar: {
          url: review.userImage || DEFAULT_USER_ICON,
        },
      },
    },
    userId: review.authorId,
    commentedOn: {
      node: {
        databaseId: parseInt(review.restaurantId),
        title: "",
        slug: "",
        fieldMultiCheck90: "",
        featuredImage: {
          node: {
            databaseId: "",
            altText: "",
            mediaItemUrl: "",
            mimeType: "",
            mediaType: "",
          },
        },
      },
    },
  };
};

const reviewService = new ReviewService();

interface RestaurantReviewsProps {
  restaurantId: number;
  restaurantUuid?: string; // Restaurant UUID for V2 API
  reviews?: GraphQLReview[]; // Optional reviews from parent (like mobile)
  onReviewsUpdate?: (reviews: GraphQLReview[]) => void;
  reviewCount?: number;
}

export default function RestaurantReviews({ restaurantId, restaurantUuid, restaurantTitle, restaurantSlug, reviews: initialReviews, onReviewsUpdate, reviewCount }: RestaurantReviewsProps) {
  // Session state
  const { user } = useFirebaseSession();

  // Review state (simplified like mobile)
  const [allReviews, setAllReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<"all" | "photos">("all");
  
  // Track if reviews came from parent or fetch to prevent circular updates
  const reviewsSourceRef = useRef<'parent' | 'fetch' | null>(null);

  // Constants
  const REVIEWS_PER_PAGE = 5;
  const PHOTOS_PER_PAGE = 18;
  // Flattened photo items from allReviews
  const allPhotoItems = allReviews.flatMap((review) => {
    if (!review.reviewImages || !Array.isArray(review.reviewImages) || review.reviewImages.length === 0) return [];
    return review.reviewImages.map((img, imgIndex) => ({
      image: {
        sourceUrl: img.sourceUrl,
        id: img.id,
      },
      review,
      imageIndex: imgIndex,
    }));
  });
  // Paginated photo items
  const paginatedPhotoItems = allPhotoItems.slice(
    (currentPage - 1) * PHOTOS_PER_PAGE,
    currentPage * PHOTOS_PER_PAGE
  );
  const totalPhotoPages = Math.ceil(allPhotoItems.length / PHOTOS_PER_PAGE);

  // Fetch all reviews for the restaurant using V2 API
  const fetchAllReviews = useCallback(async () => {
    if (!restaurantUuid) {
      console.warn('RestaurantReviews: restaurantUuid is required for V2 API');
      setLoading(false);
      return;
    }

    setLoading(true);
    let allFetched: GraphQLReview[] = [];
    
    try {
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await reviewV2Service.getReviewsByRestaurant(restaurantUuid, {
          limit,
          offset
        });

        // Transform ReviewV2 to GraphQLReview
        const transformed = response.reviews.map((review) => 
          transformReviewV2ToGraphQLReview(review, restaurantId)
        );

        allFetched = allFetched.concat(transformed);
        hasMore = response.hasMore || false;
        offset += transformed.length;

        // Safety check to prevent infinite loops
        if (transformed.length === 0) break;
      }
      
      console.log('RestaurantReviews - Fetched reviews:', {
        total: allFetched.length,
        restaurantUuid,
        restaurantId
      });
      
      reviewsSourceRef.current = 'fetch'; // Mark that reviews came from fetch
      setAllReviews(allFetched);
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error);
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, restaurantUuid]);


  // Handle initialReviews updates from parent (separate effect to prevent circular updates)
  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      // Only update if reviews actually changed to prevent unnecessary re-renders
      setAllReviews((prev) => {
        // Compare by length and first review ID to detect actual changes
        if (prev.length !== initialReviews.length || 
            (prev.length > 0 && initialReviews.length > 0 && prev[0]?.id !== initialReviews[0]?.id)) {
          reviewsSourceRef.current = 'parent'; // Mark that reviews came from parent
          return initialReviews;
        }
        return prev;
      });
      setLoading(false);
    }
  }, [initialReviews]);

  // Fetch reviews if not provided from parent
  useEffect(() => {
    if ((!initialReviews || initialReviews.length === 0) && restaurantUuid) {
      fetchAllReviews();
      setCurrentPage(1);
    } else if (!restaurantUuid && (!initialReviews || initialReviews.length === 0)) {
      setLoading(false);
    }
  }, [restaurantId, restaurantUuid, fetchAllReviews, initialReviews]);

  // Notify parent component when reviews are updated (only when we fetch, not when parent provides)
  useEffect(() => {
    // Only call onReviewsUpdate if we fetched reviews ourselves to prevent circular updates
    if (onReviewsUpdate && allReviews.length > 0 && reviewsSourceRef.current === 'fetch') {
      onReviewsUpdate(allReviews);
    }
  }, [allReviews, onReviewsUpdate]);

  // Tab change handler
  const handleTabChange = (tabId: "all" | "photos") => {
    setCurrentTab(tabId);
    setCurrentPage(1);
  };

  // Simple sorting logic (like mobile) - sort by newest first
  const sortedReviews = [...allReviews].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination
  const paginatedReviews = sortedReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);

  // Tab content
  const tabs = [
    {
      id: "all",
      label: "All",
      content: (
        <div className="reviews-container">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <ReviewBlockSkeleton key={i} />
              ))}
            </>
          ) : paginatedReviews.length ? (
            <>
              {paginatedReviews.map((review) => {
                // Get the UUID string from author.node.id or userId field (both are UUIDs from restaurant_users)
                const authorUuid = review.author?.node?.id ?? review.userId ?? undefined;
                // Get numeric databaseId for backward compatibility
                const authorDatabaseId = review.author?.node?.databaseId ?? 0;
                
                return (
                  <ReviewBlock
                    key={review.databaseId.toString()}
                    review={{
                      databaseId: review.databaseId,
                      id: review.id,
                      authorId: authorDatabaseId, // Numeric ID for backward compatibility
                      authorUuid: authorUuid ? String(authorUuid) : undefined, // UUID string for restaurant_users lookup
                      restaurantId: restaurantId.toString(),
                      restaurantTitle: restaurantTitle || review.commentedOn?.node?.title || "",
                      restaurantSlug: restaurantSlug || review.commentedOn?.node?.slug || "",
                      user: review.author?.node?.name ?? review.author?.name ?? "Unknown User",
                      rating: Number(review.reviewStars) || 0,
                      date: review.date,
                      title: review.reviewMainTitle,
                      comment: review.content,
                      images: review.reviewImages?.map(img => img.sourceUrl) ?? [],
                      userImage: review.userAvatar ?? review.author?.node?.avatar?.url ?? DEFAULT_USER_ICON,
                      recognitions: review.recognitions ?? [],
                      palateNames: typeof review.palates === "string"
                        ? review.palates.split("|").map(p => p.trim()).filter(Boolean)
                        : [],
                      commentLikes: review.commentLikes ?? 0,
                      userLiked: review.userLiked ?? false,
                    }}
                  />
                );
              })}
              <Pagination
                currentPage={currentPage}
                hasNextPage={currentPage < totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          ) : (
            <div className="col-span-full">
              <EmptyState 
                heading="No Reviews Found"
                message="No reviews have been made yet."
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "photos",
      label: "Photos",
      content: (
        <>
          {loading && allPhotoItems.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : paginatedPhotoItems.length > 0 ? (
            <>
              <Masonry
                key={`photo-page-${currentPage}`}
                items={paginatedPhotoItems}
                render={({ data }) => (
                  <Photos
                    key={(data.image.id as string) || `${data.review.databaseId}-${data.imageIndex}`}
                    data={mapToReviewedDataProps(toReviewBlockReview(data.review))}
                    image={data.image}
                    index={data.imageIndex}
                  />
                )}
                columnGutter={32}
                columnWidth={304}
                maxColumnCount={4}
              />
              {totalPhotoPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  hasNextPage={currentPage < totalPhotoPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </>
          ) : (
            <EmptyState 
              heading="No Photos Found"
              message="No photos have been uploaded yet."
            />
          )}
        </>
      ),
    }
   ];

  // Render
  return (
    <section className="restaurant-reviews font-neusans">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <h2 className="text-lg font-normal text-[#31343F]">
            Recommended Reviews ({reviewCount || allReviews.length})
          </h2>
        </div>
      </div>
      <Tabs
        aria-label="Dynamic tabs"
        items={tabs}
        classNames={{
          base: 'w-full border-b',
          panel: 'py-4 md:py-8 px-0',
          tabList: 'gap-4 w-fit relative rounded-none p-0 overflow-x-hidden',
          cursor: "w-full bg-[#31343F]",
          tab: "px-6 py-3 h-[44px] font-semibold font-inter",
          tabContent:
            "group-data-[selected=true]:text-[#31343F] text-xs md:text-base font-semibold text-[#31343F]",
        }}
        variant="underlined"
        selectedKey={currentTab}
        onSelectionChange={(key) => handleTabChange(key as "all" | "photos")}
      >
        {(item) => (
          <Tab key={item.id} title={item.label}>
            <div className="bg-none rounded-none">
              <div>{item.content}</div>
            </div>
          </Tab>
        )}
      </Tabs>
    </section>
  );
}