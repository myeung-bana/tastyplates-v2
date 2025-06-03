"use client";
import React, { useState, useEffect, useRef } from "react";
import RestaurantCard, { Restaurant } from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_reviews.scss";
import { restaurants } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import { Tab, Tabs } from "@heroui/tabs";
import Image from "next/image";
import Link from "next/link";
import ReviewCard from "../ReviewCard";
import { Masonry } from "masonic";
import { getAllReviews } from "@/utils/reviewUtils";
import { ReviewService } from "@/services/Reviews/reviewService";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { useSession } from "next-auth/react";

const Profile = () => {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const isFirstLoad = useRef(true);
  const [hasMoreThanOnePage, setHasMoreThanOnePage] = useState(false);

  const loadMore = async () => {
    if (loading || !hasNextPage || !session?.user?.userId) return;
    setLoading(true);

    try {
      const userId = session.user.userId;
      const first = isFirstLoad.current ? 16 : 8;

      const { reviews: newReviews, pageInfo } = await ReviewService.fetchUserReviews(
        userId,
        null,
        first,
        endCursor
      );

      setReviews(prev => [...prev, ...newReviews]);
      setEndCursor(pageInfo.endCursor);
      setHasNextPage(pageInfo.hasNextPage);
      
      // Set flag if we've loaded more than one page
      if (!isFirstLoad.current || pageInfo.hasNextPage) {
        setHasMoreThanOnePage(true);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => {
    if (session?.user?.userId) {
      loadMore(); // Only load when userId is available
    }
  }, [session?.user?.userId]); // Reload when userId becomes available

  // Setup Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading]);

  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <section>
          <Masonry items={reviews} render={ReviewCard} columnGutter={32} maxColumnWidth={304} columnCount={4} maxColumnCount={4} />
          <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
            {loading && (
              <>
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="164"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Load more content</span>
              </>
            )}
            {hasMoreThanOnePage && !hasNextPage && !loading && (
              <p className="text-gray-400 text-sm">No more content to load.</p>
            )}
          </div>
        </section>
      ),
    },
    {
      id: "listings",
      label: "Listings",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest as unknown as Restaurant} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "wishlists",
      label: "Wishlists",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest as unknown as Restaurant} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "checkin",
      label: "Check-in",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest as unknown as Restaurant} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];
  // Filter restaurants based on the selected cuisine type
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.cuisineIds.some((cuisineId) =>
      cuisines
        .find((cuisine) => cuisine.id === cuisineId)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const handleFilterChange = (filterType: string, value: string) => {
    // TODO: Implement filter logic
    console.log(`Filter changed: ${filterType} = ${value}`);
  };

  const handleCuisineSelect = (cuisineName: string) => {
    setSearchTerm(cuisineName); // Set the search term to the selected cuisine
    setShowDropdown(false); // Hide the dropdown after selection
  };

  return (
    <>
      <div className="flex self-center justify-center items-center gap-8 mt-10 mb-8 max-w-[624px]">
        <Image src="/profile-icon.svg" width={120} height={120} className="rounded-full" alt="profile" />
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div>
              <h2 className="text-xl font-medium">JulienChange</h2>
              <div className="flex gap-1 mt-2">
                <span className="bg-[#FDF0EF] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]">Malaysian</span>
                <span className="bg-[#FDF0EF] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]">Chinese</span>
              </div>
            </div>
            <div>
              <Link href="/profile/edit" className="py-2 px-4 rounded-[50px] border-[1.2px] border-[#494D5D] text-[#494D5D] font-semibold text-sm">
                Edit Profile
              </Link>
            </div>
          </div>
          <p className="text-sm">Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
        </div>
      </div>
      <Tabs
        aria-label="Dynamic tabs"
        items={tabs}
        classNames={{
          tabWrapper: 'w-full',
          base: "w-full border-b justify-center",
          panel: "py-4 px-0 justify-start px-10 w-full max-w-[80rem] mx-auto",
          tabList: "gap-4 w-fit relative rounded-none p-0 overflow-x-hidden",
          cursor: "w-full bg-[#31343F]",
          tab: "px-6 py-3 h-[44px] font-semibold font-inter",
          tabContent:
            "group-data-[selected=true]:text-[#31343F] text-[#494D5D] text-base font-semibold",
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
    </>
  );
};

export default Profile;
