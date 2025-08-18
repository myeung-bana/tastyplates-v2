// pages/RestaurantPage.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import Filter from "@/components/Filter/Filter";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService"
import { Listing } from "@/interfaces/restaurant/restaurant";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { DEFAULT_IMAGE } from "@/constants/images";

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
  streetAddress?: string;
  ratingsCount?: number;
}

const restaurantService = new RestaurantService();

const RestaurantPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchEthnic, setSearchEthnic] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const initialEthnicFromUrl = searchParams?.get("ethnic") ? decodeURIComponent(searchParams.get("ethnic") as string) : "";
  const initialAddressFromUrl = searchParams?.get("address") ? decodeURIComponent(searchParams.get("address") as string) : "";
  const initialListingFromUrl = searchParams?.get("listing") ? decodeURIComponent(searchParams.get("listing") as string) : "";
  const [searchTerm, setSearchTerm] = useState(initialListingFromUrl);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [filters, setFilters] = useState({
    cuisine: null as string[] | null,
    palates: [] as string[],
    price: null as string | null,
    rating: null as number | null,
    badges: null as string | null,
    sortOption: null as string | null,
  });

  useEffect(() => {
    setSearchAddress(initialAddressFromUrl);
    setSearchEthnic(initialEthnicFromUrl);
  }, [initialListingFromUrl, initialAddressFromUrl, initialEthnicFromUrl]);
  useEffect(() => {
    const currentSearchParams = new URLSearchParams(searchParams?.toString());
    let shouldUpdateUrl = false;

    if (currentSearchParams.has("ethnic")) {
      setSearchEthnic(initialEthnicFromUrl);
      shouldUpdateUrl = true;
    }

    if (shouldUpdateUrl) {
      const newPathname = window.location.pathname;
      const newUrl = `${newPathname}${currentSearchParams.toString() ? `?${currentSearchParams.toString()}` : ''}`;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  const mapListingToRestaurant = (item: Listing): Restaurant => ({
    id: item.id,
    slug: item.slug,
    name: item.title,
    image: item.featuredImage?.node.sourceUrl || DEFAULT_IMAGE,
    rating: item.averageRating,
    databaseId: item.databaseId || 0,
    palatesNames: item.palates.nodes?.map((c: { name: string }) => c.name) || [],
    listingCategories: item.listingCategories?.nodes.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
    countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
    priceRange: item.priceRange,
    initialSavedStatus: item.isFavorite ?? false,
    streetAddress: item.listingDetails?.googleMapUrl?.streetAddress || item.listingStreet || "",
    ratingsCount: item.ratingsCount ?? 0,
  });

  useEffect(() => {
    if (initialListingFromUrl) {
      const params = new URLSearchParams(window.location.search);
      params.delete("listing");

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [initialListingFromUrl, router]);


  const fetchRestaurants = async (reset = false, after: string | null = null, firstOverride?: number) => {
    setLoading(true);
    try {
      const data = await restaurantService.fetchAllRestaurants(
        debouncedSearchTerm,
        firstOverride ?? (reset && isFirstLoad.current ? 16 : 8),
        after,
        filters.cuisine,
        filters.palates,
        filters.price,
        null,
        null,
        filters.badges,
        filters.sortOption,
        filters.rating,
        null,
        searchAddress,
        searchEthnic
      );
      const transformed = data.nodes.map(mapListingToRestaurant);
      setRestaurants((prev: Restaurant[]) => {
        if (reset || !after) return transformed;
        const uniqueMap = new Map<string, Restaurant>();
        prev.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        transformed.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
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

  const handleFilterChange = useCallback((
    newFilters:
      {
        cuisine?: string[] | null;
        price?: string | null;
        rating?: number | null;
        badges?: string | null;
        sortOption?: string | null;
        palates?: string[] | null;
      }
  ) => {
    setFilters(
      prev => ({

        ...prev,
        ...newFilters,
        cuisine: Array.isArray(newFilters.cuisine) ? newFilters.cuisine : prev.cuisine,
        palates: Array.isArray(newFilters.palates) ? newFilters.palates : prev.palates
      }));
  }, []);

  useEffect(() => {
    setRestaurants([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    fetchRestaurants(true, null, isFirstLoad.current ? 16 : 8);
    isFirstLoad.current = false;
  }, [debouncedSearchTerm, JSON.stringify(filters), searchAddress, searchEthnic, session?.accessToken]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loading) {
          fetchRestaurants(false, endCursor);
        }
      },
      { threshold: 1.0 }
    );
    const currentObserverRef = observerRef.current;
    if (currentObserverRef) observer.observe(currentObserverRef);
    return () => {
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };
  }, [hasNextPage, loading, debouncedSearchTerm, searchEthnic, endCursor, JSON.stringify(filters), searchAddress, session?.accessToken]);

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      fetchRestaurants(false, endCursor);
    }
  };

  const handleRestaurantClick = async (restaurantId: number) => {
    if (!session?.accessToken) {
      console.warn("User is not authenticated");
      return;
    }

    try {
      await restaurantService.addRecentlyVisitedRestaurant(restaurantId, session.accessToken);
    } catch (error) {
      console.error("Failed to record visited restaurant:", error);
    }
  };

  return (
    <section className="restaurants min-h-screen font-inter !bg-white rounded-t-3xl">
      <div className="restaurants__container">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between">
          <Filter
            onFilterChange={handleFilterChange}
          />
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
                className="absolute right-2 top-2 md:top-4 text-sm text-gray-500 hover:text-black"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="restaurants__grid mt-4">
          {restaurants.map((rest) => (
            <RestaurantCard
              key={rest.id}
              restaurant={rest}
              initialSavedStatus={rest.initialSavedStatus}
              ratingsCount={rest.ratingsCount}
              onClick={() => handleRestaurantClick(rest.databaseId)}
            />
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
          {!hasNextPage && !loading && restaurants.length > 0 && (
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