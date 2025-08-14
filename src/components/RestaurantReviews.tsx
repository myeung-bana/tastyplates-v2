import "@/styles/pages/_restaurant-details.scss";
import { Tab, Tabs } from "@heroui/tabs";
import { Masonry } from "masonic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Photos from "./Restaurant/Details/Photos";
import Pagination from "./Pagination";
import ReviewBlock from "./ReviewBlock";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from '@/services/userService';
import { DEFAULT_USER_ICON } from "@/constants/images";
import CustomPopover from "./ui/Popover/Popover";

interface CustomType {
  text: string,
  value: string,
}

export default function RestaurantReviews({ restaurantId }: { restaurantId: number }) {
  // Session and user state
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;

  // Review and filter state
  const [allReviews, setAllReviews] = useState<any[]>([]);
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
    if (!review.reviewImages || review.reviewImages.length === 0) return [];
    return review.reviewImages.map((img: any, imgIndex: number) => ({
      image: img,
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
  const fetchAllReviews = async () => {
    setLoading(true);
    let allFetched: any[] = [];
    let after: string | undefined = undefined;
    let hasNext = true;
    try {
      while (hasNext) {
        const data = await ReviewService.getRestaurantReviews(
          restaurantId,
          session?.accessToken,
          50,
          after
        );
        allFetched = allFetched.concat(data.reviews);
        hasNext = data.pageInfo.hasNextPage;
        after = data.pageInfo.endCursor;
      }
      setAllReviews(allFetched);
    } catch (err) {
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch following user IDs on mount/session change
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!session?.user?.id || !session?.accessToken) return;
      try {
        const followingList = await UserService.getFollowingList(session.user.id, session.accessToken);
        setFollowingUserIds(followingList.map((u: any) => String(u.id)));
      } catch (e) {
        setFollowingUserIds([]);
      }
    };
    fetchFollowing();
  }, [session]);

  // Fetch reviews on restaurant, tab, or session change
  useEffect(() => {
    fetchAllReviews();
    setCurrentPage(1);
  }, [restaurantId, currentTab, session]);

  // Tab change handler
  const handleTabChange = (tabId: "all" | "photos") => {
    setCurrentTab(tabId);
    setCurrentPage(1);
  };

  // Helper: Ensure rating is always a number for filtering/sorting
  const getNumericRating = (review: any) => {
    if (typeof review.rating === 'number') return review.rating;
    if (typeof review.rating === 'string' && !isNaN(Number(review.rating))) return Number(review.rating);
    if (typeof review.reviewStars === 'number') return review.reviewStars;
    if (typeof review.reviewStars === 'string' && !isNaN(Number(review.reviewStars))) return Number(review.reviewStars);
    return 0;
  };

  // Filtering and sorting logic
  const filteredReviews = allReviews.filter((review) => {
    if (!selectedReviewFilter?.value) return true;
    if (selectedReviewFilter?.value === 'following') {
      const authorId = String(review?.author?.node?.databaseId ?? review?.authorId ?? '');
      return followingUserIds.includes(authorId);
    }
    if (selectedReviewFilter?.value === 'mine') {
      return String(review?.author?.node?.databaseId) === String(currentUserId);
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
            <div className="restaurant-detail__content mt-10">
              <div className="h-6 w-24 bg-gray-300 rounded mx-auto mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-[#CACACA] rounded-lg p-4 space-y-2">
                    <div className="h-5 w-32 bg-gray-300 rounded"></div>
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedReviews.length ? (
            <>
              {paginatedReviews.map((review) => (
                <ReviewBlock
                  key={review.databaseId}
                  review={{
                    databaseId: review.databaseId,
                    id: review.id,
                    authorId: review?.author?.node?.databaseId ?? "",
                    restaurantId: restaurantId.toString(),
                    user: review?.author?.node?.name ?? review?.author?.name ?? "Unknown",
                    rating: Number(review.reviewStars) || 0,
                    date: review.date,
                    title: review.reviewMainTitle,
                    comment: review.content ?? "",
                    images: review.reviewImages?.map((img: any) => img.sourceUrl) ?? [],
                    userImage: review?.userAvatar ?? DEFAULT_USER_ICON,
                    recognitions: Array.isArray(review.recognitions) ? review.recognitions : [],
                    palateNames: typeof review.palates === "string"
                      ? review.palates.split("|").map((p: string) => p.trim()).filter(Boolean)
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 animate-pulse rounded-2xl w-full"
                  style={{ height: "180px" }}
                />
              ))}
            </div>
          ) : (
            <>
              <Masonry
                key={`photo-page-${currentPage}`} // <-- Forces reset on page change
                items={paginatedPhotoItems}
                render={({ data }) => (
                  <Photos
                    key={data.image.id || `${data.review.databaseId}-${data.imageIndex}`}
                    data={data.review}
                    image={data.image}
                    index={data.imageIndex}
                    width={304}
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
          )}
        </>
      ),
    }
   ];

  // Render
  return (
    <section className="restaurant-reviews">
      <div className="flex justify-between items-center">
        <h2>Reviews</h2>
        <div className="flex gap-4">
          <div className="search-bar">
            <CustomPopover
              align="center"
              trigger={
                <button className="review-filter">
                  {!selectedReviewFilter.text ? 'All Reviews' : selectedReviewFilter.text}
                </button>
              }
              content={
                <ul className="bg-white flex flex-col rounded-2xl text-[#494D5D] border border-[#CACACA]">
                  {reviewFilterOptions.map((option, index) =>
                    <li key={index} className="text-left pl-3.5 pr-12 py-3.5 font-semibold" onClick={() => { setSelectedReviewFilter({text: option.label, value: option.value}); setCurrentPage(1); }}>
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
                <button className="review-filter">
                  {!sortOrder.text ? 'All Reviews' : sortOrder.text}
                </button>
              }
              content={
                <ul className="bg-white flex flex-col rounded-2xl text-[#494D5D] border border-[#CACACA]">
                  {sortOptions.map((option, index) =>
                    <li key={index} className="text-left pl-3.5 pr-12 py-3.5 font-semibold" onClick={() => { setSortOrder({text: option.label, value: option.value}); setCurrentPage(1); }}>
                      {option.label}
                    </li>
                  )}
                </ul>
              }
            />
            {/* <select
              className="review-filter"
              style={{ color: '#494D5D' }}
              value={sortOrder}
              onChange={e => { setSortOrder(e.target.value); setCurrentPage(1); }}
            >
              {sortOptions.map((option, index) =>
                <option value={option.value} key={index}>
                  {option.label}
                </option>
              )}
            </select> */}
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