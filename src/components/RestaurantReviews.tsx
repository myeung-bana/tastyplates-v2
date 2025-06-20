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
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<"all" | "photos">("all");
  const [pageCursors, setPageCursors] = useState<{ [page: number]: string | null }>({ 1: null });
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchReviews = async (page: number, pageSize: number = 5) => {
    setLoading(true);
    try {
      const after = pageCursors[page] ?? undefined;

      const data = await ReviewService.getRestaurantReviews(
        restaurantId,
        session?.accessToken,
        pageSize,
        after
      );

      setReviews(data.reviews);
      setHasNextPage(data.pageInfo.hasNextPage);

      if (data.pageInfo.endCursor && !pageCursors[page + 1]) {
        setPageCursors((prev) => ({
          ...prev,
          [page + 1]: data.pageInfo.endCursor,
        }));
      }

      setCurrentPage(page);
    } catch (err) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "photos") {
      fetchReviews(1, 20);
    } else {
      fetchReviews(1, 5);
    }
  }, [restaurantId, currentTab]);

  const handleTabChange = (tabId: "all" | "photos") => {
    setCurrentTab(tabId);
    setPageCursors({ 1: null });
    setCurrentPage(1);
  };

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
          ) : reviews.length ? (
            <>
              {reviews.map((review) => (
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
                hasNextPage={hasNextPage}
                onPageChange={(page) => fetchReviews(page, 5)}
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
                items={reviews}
                render={Photos}
                columnGutter={32}
                columnWidth={304}
                maxColumnCount={4}
              />
              {reviews.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  hasNextPage={hasNextPage}
                  onPageChange={(page) => fetchReviews(page, 20)}
                />
              )}
            </>
          )}
        </>
      ),
    },
  ];
  const filterOptions = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
  ]
  return (
    <section className="restaurant-reviews">
      <div className="flex justify-between items-center">
        <h2>Reviews</h2>
        <div className="flex gap-4">
          <div className="search-bar">
            <select
              className="review-filter"
            >
              {filterOptions.map((option, index) =>
                <option value={option.value} key={index}>
                  {option.label}
                </option>
              )}
            </select>
          </div>
          <div className="search-bar">
            <select
              className="review-filter"
            >
              {filterOptions.map((option, index) =>
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