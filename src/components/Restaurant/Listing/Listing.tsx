"use client";
import React, { FormEvent, useEffect, useState } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
// import { Restaurant, restaurants } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import { FiSearch } from "react-icons/fi";
import ListingCard from "./ListingCard";
import CustomModal from "@/components/ui/Modal/Modal";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService";

interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
}

const ListingPage = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [listing, setListing] = useState<string>("");
  const [isShowDelete, setIsShowDelete] = useState<boolean>(false)
  const [loading, setLoading] = useState(true);
  // const [hasMore, setHasMore] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  // const [afterCursor, setAfterCursor] = useState<string | null>(null);

  //TEMPORARY DATA
  // Helper: transform GraphQL node to Restaurant
    const transformNodes = (nodes: any[]): Restaurant[] => {
      return nodes.map((item: any) => ({
        id: item.id,
        databaseId: item.databaseId || 0, // Default to 0 if not present
        slug: item.slug,
        name: item.title,
        image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
        rating: 4.5, // Default rating since it's not in the API response
        cuisineNames: item.cuisines || [],
        countries: item.countries?.nodes.map((c: any) => c.name).join(", ") || "Default Location",
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
  
        // setAfterCursor(data.pageInfo.endCursor);
        // setHasMore(data.pageInfo.hasNextPage);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

      useEffect(() => {
        fetchRestaurants("", 8, null);
      }, []);

  // Filter restaurants based on the selected cuisine type
  // const filteredRestaurants = restaurants.filter((restaurant) =>
  //   restaurant.cuisineIds.some((cuisineId) =>
  //     cuisines
  //       .find((cuisine) => cuisine.id === cuisineId)
  //       ?.name.toLowerCase()
  //       .includes(searchTerm.toLowerCase())
  //   )
  // );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    console.log('here')
  }

  const removeListing = (item: Restaurant, index: number) => {
    setIsShowDelete(true)
    console.log(item, 'item to remove')
    restaurants.splice(index, 1)
  }

  const filteredRestaurants = searchTerm
    ? restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : restaurants;

  return (
    <>
      <div className="font-inter max-w-[82rem] mx-auto mt-16">
        <div className="py-6 md:py-8 flex flex-col justify-center items-center">
          <h1 className="text-lg md:text-2xl text-[#31343F] text font-medium">Find a listing to review</h1>
          <form onSubmit={handleSearch} className="my-6 md:my-10 max-w-[525px] w-full px-6 lg:px-0">
            <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
              <div className="hero__search-restaurant !bg-transparent">
                <FiSearch className="hero__search-icon" />
                <input
                  type="text"
                  placeholder="Search by Listing Name"
                  className="hero__search-input"
                  value={listing}
                  onChange={(e) => setListing(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="rounded-full text-sm md:text-base text-[#FCFCFC] h-9 md:h-11 font-semibold w-fit px-4 md:px-6 py-2 md:py-3 text-center bg-[#E36B00]"
              >
                Search
              </button>
            </div>
          </form>
          {/* <div className="restaurants__container mt-6 md:mt-10 w-full">
            <div className="restaurants__content">
              <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-medium">My Review Drafts</h1>
              <div className="restaurants__grid mt-6 md:mt-8">
                  {restaurants.map((restaurant: Restaurant, index: number) => (
                    <ListingCard key={index} restaurant={restaurant} onDelete={() => removeListing(restaurant, index)} />
                  ))}
              </div>
            </div>
          </div> */}
          <div className="restaurants__container mt-6 md:mt-10 w-full">
            <div className="restaurants__content mt-12">
              <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-medium">Recently Visited</h1>
              <div className="restaurants__grid mt-6 md:mt-8">
                {/* {restaurants.map((rest) => (
                  <RestaurantCard key={rest.id} restaurant={rest} />
                ))} */}
                {filteredRestaurants.map((rest) => (
                  <RestaurantCard key={rest.id} restaurant={rest} />
                ))}
                {loading && [...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomModal
        header="Delete this Draft?"
        content="Your draft will be removed."
        isOpen={isShowDelete}
        setIsOpen={() => setIsShowDelete(!isShowDelete)}
      />
    </>
  );
};

export default ListingPage;
