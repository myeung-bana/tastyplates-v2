import "@/styles/pages/_restaurant-details.scss";
import ReviewBlock from "./ReviewBlock"; // Import the ReviewBlock component
import { users } from "@/data/dummyUsers"; // Import users data
import { useEffect, useState } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { cn } from "@/lib/utils";
import { Masonry } from "masonic";
import Photos from "./Restaurant/Details/Photos";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ReviewService } from "@/services/Reviews/reviewService";
import Pagination from "./Pagination";

export default function RestaurantReviews({ restaurantId }: { restaurantId: number }) {
  const { data: session } = useSession();
  const [allReviews, setAllReviews] = useState<any[]>([]); // All fetched reviews
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<"all" | "photos">("all");
  const [selectedStarRating, setSelectedStarRating] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const REVIEWS_PER_PAGE = 5;

  // Star rating filter options
  const starOptions = [
    { value: '', label: 'All Reviews' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
  ];
  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
  ];

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
          9999,
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

  useEffect(() => {
    fetchAllReviews();
    setCurrentPage(1);
  }, [restaurantId, currentTab, session]);

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
    if (!selectedStarRating) return true;
    // Filter by star rating (compare as integer)
    const rating = getNumericRating(review);
    return parseInt(selectedStarRating) === Math.round(Number(rating));
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortOrder === "highest") {
      return getNumericRating(b) - getNumericRating(a);
    } else if (sortOrder === "lowest") {
      return getNumericRating(a) - getNumericRating(b);
    }
    return 0;
  });

  // Paginate the sorted/filtered reviews
  const paginatedReviews = sortedReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);

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
                  <div
                    key={i}
                    className="border border-[#CACACA] rounded-lg p-4 space-y-2"
                  >
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
                    id: review.databaseId,
                    authorId: review?.author?.node?.databaseId ?? "",
                    restaurantId: restaurantId.toString(),
                    user:
                      review?.author?.node?.name ??
                      review?.author?.name ??
                      "Unknown",
                    rating: Number(review.reviewStars) || 0,
                    date: review.date,
                    title: review.reviewMainTitle,
                    comment: review.content ?? "",
                    images:
                      review.reviewImages?.map((img: any) => img.sourceUrl) ?? [],
                    userImage:
                      review?.author?.node?.avatar?.url ??
                      review?.userAvatar ??
                      "/profile-icon.svg",
                    recognitions: Array.isArray(review.recognitions)
                      ? review.recognitions
                      : [],
                    palateNames: typeof review.palates === "string"
                      ? review.palates
                        .split("|")
                        .map((p: string) => p.trim())
                        .filter(Boolean)
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
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="review-card__image-container"
                  style={{ width: "304px", height: "400px" }}
                >
                  <div className="bg-gray-300 animate-pulse rounded-2xl w-full h-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Masonry
                items={allReviews}
                render={Photos}
                columnGutter={32}
                columnWidth={304}
                maxColumnCount={4}
              />
              {allReviews.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  hasNextPage={currentPage < Math.ceil(allReviews.length / 20)}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </>
          )}
        </>
      ),
    },
  ];
  return (
    <section className="restaurant-reviews">
      <div className="flex justify-between items-center">
        <h2>Reviews</h2>
        <div className="flex gap-4">
          <div className="search-bar">
            <select
              className="review-filter"
              style={{ color: '#494D5D' }}
              value={selectedStarRating}
              onChange={e => { setSelectedStarRating(e.target.value); setCurrentPage(1); }}
            >
              {starOptions.map((option, index) =>
                <option value={option.value} key={index}>
                  {option.label}
                </option>
              )}
            </select>
          </div>
          <div className="search-bar">
            <select
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
            </select>
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