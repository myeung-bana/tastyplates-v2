"use client";
import React, { useState, useEffect, useRef, useCallback } from "react"
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
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
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
}

const RestaurantPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
      rating: 4.5,
      databaseId: item.databaseId || 0,
      palatesNames: item.palates.nodes?.map((c: { name: string }) => c.name) || [],
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: "$$"
    }));
  };

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes);

      setRestaurants((prev) => {
        if (!after) return transformed;
        const uniqueMap = new Map([...prev, ...transformed].map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setEndCursor(data.pageInfo.endCursor);
      setHasNextPage(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(debouncedSearchTerm, isFirstLoad.current ? 16 : 8, null);
    isFirstLoad.current = false;
  }, [debouncedSearchTerm]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loading) {
          fetchRestaurants(debouncedSearchTerm, 8, endCursor);
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading, debouncedSearchTerm, endCursor]);

  return (
    <section className="restaurants min-h-screen font-inter !bg-white rounded-t-3xl">
      <div className="restaurants__container">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between">
          <Filter onFilterChange={() => { }} />
          <div className="search-bar hidden sm:block relative">
            <input
              type="text"
              placeholder="Search by Listing Name"
              value={searchTerm}
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
          </div>
        </div>

        <div className="restaurants__grid mt-4">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
          {loading && [...Array(4)].map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)}
        </div>

        <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
          {loading && (
            <>
              <svg
                className="w-5 h-5 text-gray-500 animate-spin mr-2"
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
              <span className="text-gray-500 text-sm">Loading more Content</span>
            </>
          )}
          {!hasNextPage && !loading && (
            <p className="text-gray-400 text-sm">No more content to load.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default RestaurantPage;