import "@/styles/pages/_restaurant-details.scss";
import { Tab, Tabs } from "@heroui/tabs";
import { Masonry } from "masonic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Photos from "./Restaurant/Details/Photos";
import Pagination from "./Pagination";
import ReviewBlock from "./ReviewBlock";
import ReviewBlockSkeleton from "./ui/Skeleton/ReviewBlockSkeleton";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from '@/services/user/userService';
import { DEFAULT_USER_ICON } from "@/constants/images";
import CustomPopover from "./ui/Popover/Popover";
import { GraphQLReview } from "@/types/graphql";

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

interface CustomType {
  text: string,
  value: string,
}

const userService = new UserService()
const reviewService = new ReviewService();

interface RestaurantReviewsProps {
  restaurantId: number;
  onReviewsUpdate?: (reviews: GraphQLReview[]) => void;
  reviewCount?: number;
}

export default function RestaurantReviews({ restaurantId, onReviewsUpdate, reviewCount }: RestaurantReviewsProps) {
  // Session and user state
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;

  // Review and filter state
  const [allReviews, setAllReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<"all" | "photos">("all");
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<CustomType>({text: "", value: ""});
  const [sortOrder, setSortOrder] = useState<CustomType>({text: "Newest First", value: "newest"});
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);

  // Constants
  const REVIEWS_PER_PAGE = 5;
  const reviewFilterOptions = [
    { value: '', label: 'All Reviews' },
    { value: 'following', label: 'Following' },
    { value: 'mine', label: 'My Reviews' },
  ];
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
  ];
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

  // Fetch all reviews for the restaurant (all pages)
  const fetchAllReviews = useCallback(async () => {
    setLoading(true);
    let allFetched: GraphQLReview[] = [];
    let after: string | undefined = undefined;
    let hasNext = true;
    try {
      while (hasNext) {
        const data = await reviewService.getRestaurantReviews(
          restaurantId,
          session?.accessToken,
          50,
          after
        );
        allFetched = allFetched.concat(data.reviews);
        hasNext = data.pageInfo.hasNextPage;
        after = data.pageInfo.endCursor ?? undefined;
      }
      setAllReviews(allFetched);
    } catch {
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, session?.accessToken]);

  // Fetch following user IDs on mount/session change
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!session?.user?.id || !session?.accessToken) return;
      try {
        const followingList = await userService.getFollowingList(session.user.id, session.accessToken);
        setFollowingUserIds(followingList.map((u: Record<string, unknown>) => String(u.id)));
      } catch {
        setFollowingUserIds([]);
      }
    };
    fetchFollowing();
  }, [session, fetchAllReviews]);

  // Fetch reviews on restaurant, tab, or session change
  useEffect(() => {
    fetchAllReviews();
    setCurrentPage(1);
  }, [restaurantId, currentTab, session, fetchAllReviews]);

  // Notify parent component when reviews are updated
  useEffect(() => {
    if (onReviewsUpdate && allReviews.length > 0) {
      onReviewsUpdate(allReviews);
    }
  }, [allReviews, onReviewsUpdate]);

  // Tab change handler
  const handleTabChange = (tabId: "all" | "photos") => {
    setCurrentTab(tabId);
    setCurrentPage(1);
  };

  // Helper: Ensure rating is always a number for filtering/sorting
  const getNumericRating = (review: GraphQLReview) => {
    if (typeof review.reviewStars === 'number') return review.reviewStars;
    if (typeof review.reviewStars === 'string' && !isNaN(Number(review.reviewStars))) return Number(review.reviewStars);
    return 0;
  };

  // Filtering and sorting logic
  const filteredReviews = allReviews.filter((review) => {
    if (!selectedReviewFilter?.value) return true;
    if (selectedReviewFilter?.value === 'following') {
      const authorId = String(review.author?.node?.databaseId ?? '');
      return followingUserIds.includes(authorId);
    }
    if (selectedReviewFilter?.value === 'mine') {
      return String(review.author?.node?.databaseId) === String(currentUserId);
    }
    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortOrder?.value === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOrder?.value === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortOrder?.value === "highest") {
      return getNumericRating(b) - getNumericRating(a);
    } else if (sortOrder?.value === "lowest") {
      return getNumericRating(a) - getNumericRating(b);
    }
    return 0;
  });

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
              {paginatedReviews.map((review) => (
                <ReviewBlock
                  key={review.databaseId.toString()}
                  review={{
                    databaseId: review.databaseId,
                    id: review.id,
                    authorId: review.author?.node?.databaseId ?? 0,
                    restaurantId: restaurantId.toString(),
                    user: review.author?.node?.name ?? review.author?.name ?? "Unknown",
                    rating: Number(review.reviewStars) || 0,
                    date: review.date,
                    title: review.reviewMainTitle,
                    comment: review.content,
                    images: review.reviewImages?.map(img => img.sourceUrl) ?? [],
                    userImage: review.userAvatar ?? DEFAULT_USER_ICON,
                    recognitions: review.recognitions ?? [],
                    palateNames: typeof review.palates === "string"
                      ? review.palates.split("|").map(p => p.trim()).filter(Boolean)
                      : [],
                    commentLikes: review.commentLikes ?? 0,
                    userLiked: review.userLiked ?? false,
                  }}
                />
              ))}
              <Pagination
                currentPage={currentPage}
                hasNextPage={currentPage < totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          ) : (
            <h1>No reviews</h1>
          )}
        </div>
      ),
    },
    {
      id: "photos",
      label: "Photos",
      content: (
        <>
          <Masonry
            key={`photo-page-${currentPage}`} // <-- Forces reset on page change
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
      ),
    }
   ];

  // Render
  return (
    <section className="restaurant-reviews">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <h2 className="text-lg font-bold text-[#31343F]">
            Recommended Reviews ({reviewCount || allReviews.length})
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="search-bar">
            <CustomPopover
              align="center"
              trigger={
                <button className="review-filter text-sm">
                  {!selectedReviewFilter.text ? 'All Reviews' : selectedReviewFilter.text}
                </button>
              }
              content={
                <ul className="bg-white flex flex-col rounded-2xl text-[#494D5D] border border-[#CACACA]">
                  {reviewFilterOptions.map((option, index) =>
                    <li key={index} className="text-left pl-3.5 pr-12 py-3.5 font-semibold text-sm" onClick={() => { setSelectedReviewFilter({text: option.label, value: option.value}); setCurrentPage(1); }}>
                      {option.label}
                    </li>
                  )}
                </ul>
              }
            />
          </div>
          <div className="search-bar">
            <CustomPopover
              align="center"
              trigger={
                <button className="review-filter text-sm">
                  {!sortOrder.text ? 'All Reviews' : sortOrder.text}
                </button>
              }
              content={
                <ul className="bg-white flex flex-col rounded-2xl text-[#494D5D] border border-[#CACACA]">
                  {sortOptions.map((option, index) =>
                    <li key={index} className="text-left pl-3.5 pr-12 py-3.5 font-semibold text-sm" onClick={() => { setSortOrder({text: option.label, value: option.value}); setCurrentPage(1); }}>
                      {option.label}
                    </li>
                  )}
                </ul>
              }
            />
          </div>
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