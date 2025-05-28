"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import Footer from "@/components/Footer";
import "@/styles/pages/_restaurants.scss";
import Filter from "@/components/Filter/Filter";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { useDebounce } from "use-debounce";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
}

const RestaurantPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [showDropdown, setShowDropdown] = useState(false);
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

  console.log(restaurants);

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, []);

  useEffect(() => {
    fetchRestaurants(debouncedSearchTerm, 8, null);
  }, [debouncedSearchTerm]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchRestaurants(debouncedSearchTerm, 8, afterCursor);
    }
  }, [afterCursor, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loadMore]);

  const filteredRestaurants = searchTerm
    ? restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : restaurants;


  return (
    <div className="restaurants min-h-[70vh] font-inter">
      <div className="restaurants__container">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between">
          <Filter onFilterChange={() => { }} />
          <div className="search-bar hidden sm:block relative">
            <input
              type="text"
              placeholder="Search by Listing Name"
              value={searchTerm}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar__input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2 text-sm text-gray-500 hover:text-black"
              >
                ✕
              </button>
            )}
            {showDropdown && (
              <div className="cuisine-dropdown absolute bg-white shadow-lg z-10 w-full max-h-60 overflow-auto">
                {restaurants
                  .filter((rest) =>
                    rest.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((rest) => (
                    <div
                      key={rest.id}
                      className="cuisine-dropdown__item p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSearchTerm(rest.name);
                        setShowDropdown(false);
                      }}
                    >
                      {rest.name}
                    </div>
                  ))}
              </div>
            )}

          </div>
        </div>

        <div className="restaurants__content">
          <div className="restaurants__grid">
            {filteredRestaurants.map((rest) => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
            {loading && [...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div ref={loaderRef} className="mt-4 w-full text-center">
            {loading && hasMore ? (
              <div className="restaurants__grid">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={`loader-${i}`} />
                ))}
              </div>
            ) : hasMore ? (
              <div className="restaurants__grid">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={`loader-${i}`} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No more results</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default RestaurantPage;
