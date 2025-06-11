import "@/styles/pages/_restaurant-details.scss";
import ReviewBlock from "./ReviewBlock"; // Import the ReviewBlock component
import { users } from "@/data/dummyUsers"; // Import users data
import { useState } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { cn } from "@/lib/utils";
import { Masonry } from "masonic";
import Photos from "./Restaurant/Details/Photos";

interface Review {
  id: string;
  authorId: string;
  restaurantId: string;
  user: string;
  rating: number;
  date: string;
  title?: string,
  comment: string;
  images: string[];
  userImage: string;
}

interface ReviewList {
  reviews: Array<Review>;
}

export default function RestaurantReviews({
  reviewlist,
  hideFilters = false,
  hideTabs = false,
}: {
  reviewlist: ReviewList[];
  hideFilters?: boolean;
  hideTabs?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const tabs = [
    {
      id: "all",
      label: "All",
      content:
        <div className="reviews-container">
          {reviewlist[0]?.reviews.length ? reviewlist[0]?.reviews.map((review) => {
            // Find the author based on authorId
            const author = users.find((user) => user.id === review.authorId);
            const authorData = author || {
              name: "Unknown User",
              image: "/images/default_user.png",
              palate: [],
            };

            return <ReviewBlock key={review?.id} review={review} />;
          }) : (
            <h1>No reviews</h1>
          )}
        </div>
    },
    {
      id: "photos",
      label: "Photos",
      content:
        <Masonry items={reviewlist[0]?.reviews} render={Photos} columnGutter={32} columnWidth={304} maxColumnCount={4} />
    },
  ];
  const filterOptions = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
  ]
  if (hideFilters && hideTabs) {
    // Just plain reviews, no filters, no tabs
    return (
      <section className="restaurant-reviews">
        <div className="reviews-container">
          {reviewlist[0]?.reviews.length ? reviewlist[0]?.reviews.map((review) => (
            <ReviewBlock key={review?.id} review={review} />
          )) : (
            <h1>No reviews</h1>
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="restaurant-reviews">
      {!hideFilters && (
        <div className="flex justify-between items-center">
          <h2>Reviews</h2>
          <div className="flex gap-4">
            <div className="search-bar">
              <select className="review-filter">
                {filterOptions.map((option, index) => (
                  <option value={option.value} key={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="search-bar">
              <select className="review-filter">
                {filterOptions.map((option, index) => (
                  <option value={option.value} key={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {!hideTabs ? (
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
      ) : null}
    </section>
  );
}
