// pages/RestaurantPage.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import FilterSidebar from "@/components/FilterSidebar"; // This component is imported but not used in the provided JSX.
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import Filter from "@/components/Filter/Filter";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService"
import { Listing } from "@/interfaces/restaurant/restaurant";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";

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
  listingCategories?: { id: number; name: string; slug: string }[];
  initialSavedStatus?: boolean | null;
  recognitions?: string[];
  recognitionCount?: number;
}

const RestaurantPage = () => {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [hasFetchedInitialStatuses, setHasFetchedInitialStatuses] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedPalates, setSelectedPalates] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null); 
  const [selectedBadges, setSelectedBadges] = useState<string | null>(null); 
  const [selectedSortOption, setSelectedSortOption] = useState<string | null>(null);

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
      rating: item.averageRating, 
      databaseId: item.databaseId || 0,
      palatesNames: item.palates.nodes?.map((c: { name: string }) => c.name) || [],
      listingCategories: item.listingCategories?.nodes.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
      streetAddress: item.listingDetails?.googleMapUrl?.streetAddress || '',
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: item.priceRange,
      initialSavedStatus: null,
    }));
  };

  const fetchSavedStatuses = async (restaurantsToProcess: Restaurant[]) => {
    if (!session?.accessToken) return {};
    const statuses: Record<string, boolean | null> = {};
    const visibleRestaurants = restaurantsToProcess.slice(0, 8);
    await Promise.all(
      visibleRestaurants.map(async (rest) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ restaurant_slug: rest.slug, action: "check" }),
            credentials: "include",
          });
          const data = await res.json();
          statuses[rest.id] = data.status === "saved";
        } catch (error) {
          console.error(`Failed to fetch saved status for ${rest.name}:`, error);
          statuses[rest.id] = false;
        }
      })
    );
    restaurantsToProcess.slice(8).forEach(rest => {
      if (!(rest.id in statuses)) {
        statuses[rest.id] = null;
      }
    });
    return statuses;
  };

  const fetchRestaurants = async (
    search: string,
    first = 8,
    after: string | null = null,
    cuisineSlug: string | null,
    palateSlugs: string[],
    priceRange?: string | null,
    status = null,
    badges?: string | null,
    sortOption?: string | null, 
    rating?: number | null,
  ) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(
        search,
        first,
        after,
        cuisineSlug,
        palateSlugs,
        priceRange,
        status,
        null,
        badges,
        sortOption,
        rating
      );
      let transformed = transformNodes(data.nodes);
      let savedStatuses: Record<string, boolean | null> = {};

      if (session?.accessToken) {
        savedStatuses = await fetchSavedStatuses(transformed);
        transformed = transformed.map(r => ({ ...r, initialSavedStatus: savedStatuses[r.id] }));
      } else {
        transformed = transformed.map(r => ({ ...r, initialSavedStatus: false })); // Default to false if not logged in
      }

      setRestaurants((prev) => {
        if (!after) return transformed;

        const uniqueMap = new Map<string, Restaurant>();

        // Add existing restaurants to the map
        prev.forEach(r => uniqueMap.set(r.id, r));

        // Add new restaurants, overwriting if ID already exists (for freshness or updates)
        transformed.forEach(r => uniqueMap.set(r.id, r));

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

  // Effect for initial load and when search term or filters change
  useEffect(() => {
    // Reset data when search term or filters change
    setRestaurants([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true; // Reset first load flag

    // Fetch initial batch of restaurants
    fetchRestaurants(
      debouncedSearchTerm,
      isFirstLoad.current ? 16 : 8, // Fetch more on first load
      null,
      selectedCuisine,
      selectedPalates,
      selectedPrice,
      null,
      selectedBadges,
      selectedSortOption,
      selectedRating,
    );
    isFirstLoad.current = false;
  }, [debouncedSearchTerm, selectedCuisine, JSON.stringify(selectedPalates), selectedPrice, , selectedBadges, selectedSortOption, selectedRating, session?.accessToken]);

  // Effect for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loading) {
          fetchRestaurants(debouncedSearchTerm, 8, endCursor, selectedCuisine, selectedPalates, selectedPrice,null, selectedBadges ,selectedSortOption, selectedRating);
        }
      },
      { threshold: 1.0 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) observer.observe(currentObserverRef);

    return () => {
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };
  }, [hasNextPage, loading, debouncedSearchTerm, endCursor, selectedCuisine, JSON.stringify(selectedPalates), selectedPrice, selectedSortOption, session?.accessToken]);

  const handleFilterChange = useCallback((filters: {
    cuisine?: string | null;
    price?: string | null;
    rating?: number | null;
    badges?: string | null;
    palates?: string[] | null;
    sortOption?: string | null;
  }) => {
    setSelectedCuisine(filters.cuisine || null);
    setSelectedPalates(filters.palates || []);
    setSelectedPrice(filters.price || null);
    setSelectedRating(filters.rating || null);
    setSelectedBadges(filters.badges || null);
    setSelectedSortOption(filters.sortOption || null);
  }, []);

  return (
    <section className="restaurants min-h-screen font-inter !bg-white rounded-t-3xl">
      <div className="restaurants__container">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between">
          <Filter onFilterChange={handleFilterChange} />
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
            <RestaurantCard key={rest.id} restaurant={rest} initialSavedStatus={rest.initialSavedStatus} />
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
          {!hasNextPage && !loading && restaurants.length > 0 && ( // Only show if there are restaurants
            <p className="text-gray-400 text-sm">No more content to load.</p>
          )}
           {!loading && !hasNextPage && restaurants.length === 0 && (
            <p className="text-gray-400 text-sm">No restaurants found matching your criteria.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default RestaurantPage;