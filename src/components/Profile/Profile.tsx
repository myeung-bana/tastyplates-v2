"use client";
import React, { useEffect, useRef, useState } from "react";
import RestaurantCard from "@/components/RestaurantCard";
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
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
  databaseId: number;
}

const Profile = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
      rating: 4.5,
      databaseId: item.databaseId || 0, // Default to 0 if not present
      cuisineNames: item.cuisines || [],
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: "$$"
    }));
  };

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes);

      setRestaurants(prev => {
        if (!after) {
          // New search: replace list
          return transformed;
        }
        // Pagination: append unique restaurants only
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map(r => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setAfterCursor(data.pageInfo.endCursor);
      setHasMore(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, []);

  const reviews = getAllReviews();

  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <div className="reviews__container items-start">
          {/* // <Masonry items={reviews} render={ReviewCard} columnGutter={32} maxColumnWidth={304} columnCount={4} maxColumnCount={4} /> */}
        </div>
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
                <RestaurantCard key={rest.id} restaurant={rest} />
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
                <RestaurantCard key={rest.id} restaurant={rest} />
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
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];
  // Filter restaurants based on the selected cuisine type
  // const filteredRestaurants = restaurants.filter((restaurant) =>
  //   restaurant.cuisineIds.some((cuisineId) =>
  //     cuisines
  //       .find((cuisine) => cuisine.id === cuisineId)
  //       ?.name.toLowerCase()
  //       .includes(searchTerm.toLowerCase())
  //   )
  // );

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
