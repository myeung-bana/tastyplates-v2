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

// interface Review {
//   id: string;
//   authorId: string;
//   restaurantId: string;
//   user: string;
//   rating: number;
//   date: string;
//   title?: string,
//   comment: string;
//   images: string[];
//   userImage: string;
// }

// interface ReviewList {
//   reviews: Array<Review>;
// }

export default function RestaurantReviews({ restaurantId }: { restaurantId: number }) {
  // const params = useParams() as { slug: string };
  // const slug = params.slug;
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const data = await ReviewService.fetchRestaurantReview(restaurantId, session?.accessToken);
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchReviews();
  }, [restaurantId, session]);

  const tabs = [
    {
      id: "all",
      label: "All",
      content:
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
            reviews.map((review) => (
              <ReviewBlock
                key={review.id}
                review={{
                  id: review.id,
                  authorId: review.author,
                  restaurantId: review.post,
                  user: review.author_name,
                  rating: Number(review.review_stars) || 0,
                  date: review.date,
                  title: review.review_main_title,
                  comment: review.content?.rendered || "",
                  images: review.review_images?.map((img: any) => img.sourceUrl) || [],
                  userImage: (review.author_avatar_urls && Object.values(review.author_avatar_urls).find(Boolean)) || "/profile-icon.svg",
                  recognitions: review.recognitions || [],
                  palateNames: Array.isArray(review.palates) && review.palates[0]
                    ? review.palates[0].split("|").map((p: string) => p.trim()).filter(Boolean)
                    : [],
                  commentLikes: review._comment_likes || 0,
                  userLiked: review.userLiked
                }}
              />
            ))
          ) : (
            <h1>No reviews</h1>
          )}
        </div>
    },
    {
      id: "photos",
      label: "Photos",
      content:
        <Masonry items={reviews} render={Photos} columnGutter={32} columnWidth={304} maxColumnCount={4} />
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