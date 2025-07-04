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
import { useSearchParams, useRouter } from "next/navigation"; // Import useRouter
import CustomModal from "../ui/Modal/Modal";
import { FiSearch } from "react-icons/fi";
import SelectOptions from "../ui/Options/SelectOptions";
import { debounce } from "@/utils/debounce";
import { MdArrowBackIos } from "react-icons/md";

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

const RestaurantPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [filters, setFilters] = useState({
    cuisine: null as string | null,
    palates: [] as string[],
    price: null as string | null,
    rating: null as number | null,
    badges: null as string | null,
    sortOption: null as string | null,
  });
  const [listing, setListing] = useState("");
  const [isShowPopup, setIsShowPopup] = useState<boolean>(false)
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingOptions, setListingOptions] = useState<{ key: string; label: string }[]>([]);
  const fetchListingsDebouncedRef = useRef<(input: string) => void>();
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const searchForm = useRef<HTMLFormElement>(null)

  useEffect(() => {
    window.addEventListener("load", () => {
      if (typeof window !== "undefined") {
        handleResize();
      }
    });
    window.addEventListener("resize", () => {
      handleResize();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, []);

  const handleResize = () => {
      setWidth(window.innerWidth);
  };

  const mapListingToRestaurant = (item: Listing): Restaurant => ({
    id: item.id,
    slug: item.slug,
    name: item.title,
    image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
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

  const fetchListingsName = async (search: string = '') => {
    try {
      const result = await RestaurantService.fetchListingsName(search);
      const formatted = result.nodes.map((item: any) => ({
        key: item.slug,
        label: item.title,
      }));
      setListingOptions(formatted);
    } catch (err) {
      setListingOptions([]);
    } finally {
      setListingLoading(false);
    }
  };

  const handleListingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setListing(inputValue);
    setShowListingModal(true);
    const normalizedSearch = inputValue.trim().toLowerCase();
    const alreadyExists = listingOptions.some(
      (option) => option.label.toLowerCase().includes(normalizedSearch)
    );

    if (alreadyExists) return;
    setListingLoading(true);

    fetchListingsDebouncedRef.current?.(inputValue.trim());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShowPopup(false)
    setSearchTerm(listing)
  };

  const fetchRestaurants = async (reset = false, after: string | null = null, firstOverride?: number) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(
        debouncedSearchTerm,
        firstOverride ?? (reset && isFirstLoad.current ? 16 : 8),
        after,
        filters.cuisine,
        filters.palates ?? [],
        filters.price,
        null,
        null,
        filters.badges,
        filters.sortOption,
        filters.rating,
        null,
        searchAddress,
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
        cuisine?: string | null;
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
        palates: Array.isArray(newFilters.palates) ? newFilters.palates : prev.palates
      }));
  }, []);

  useEffect(() => {
    const palatesParam = searchParams?.get("palates");
    const addressParam = searchParams?.get("address");
    const listingParam = searchParams?.get("listing");

    let shouldUpdateUrl = false;
    const currentSearchParams = new URLSearchParams(searchParams?.toString());

    // Handle palates filter: Add if present, or clear if not present
    if (palatesParam) {
      const decodedPalates = decodeURIComponent(palatesParam);
      const newPalatesArray = decodedPalates.split(",").map(p => p.trim()).filter(Boolean);
      setFilters(prevFilters => {
        const combinedPalates = new Set([...prevFilters.palates, ...newPalatesArray]);
        return {
          ...prevFilters,
          palates: Array.from(combinedPalates)
        };
      });
      currentSearchParams.delete("palates");
    } else {
      setFilters(prevFilters => ({
        ...prevFilters,
        palates: []
      }));
    }

    if (addressParam) {
      setSearchAddress(decodeURIComponent(addressParam));
      currentSearchParams.delete("address"); 
    }

    if (listingParam) {
      const decodedListingParam = decodeURIComponent(listingParam)
      setSearchTerm(decodedListingParam);
      setListing(decodedListingParam);
      currentSearchParams.delete("listing");
      shouldUpdateUrl = true;
    }

    if (shouldUpdateUrl) {
      const newPathname = window.location.pathname;
      const newUrl = `${newPathname}${currentSearchParams.toString() ? `?${currentSearchParams.toString()}` : ''}`;
      router.replace(newUrl);
    }

  }, [searchParams, router]);

  useEffect(() => {
    const [debouncedListing] = debounce(fetchListingsName, 500);

    fetchListingsDebouncedRef.current = debouncedListing;
    fetchListingsDebouncedRef.current?.('');
  }, [])

  useEffect(() => {
    setRestaurants([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    fetchRestaurants(true, null, isFirstLoad.current ? 16 : 8);
    isFirstLoad.current = false;
  }, [debouncedSearchTerm, JSON.stringify(filters), searchAddress, session?.accessToken]);

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
  }, [hasNextPage, loading, debouncedSearchTerm, searchTerm, endCursor, JSON.stringify(filters), searchAddress, session?.accessToken]);

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
      await RestaurantService.addRecentlyVisitedRestaurant(restaurantId, session.accessToken);
      console.log("Visited restaurant recorded.");
    } catch (error) {
      console.error("Failed to record visited restaurant:", error);
    }
  };

  return (
    <section className="restaurants min-h-screen font-inter !bg-white rounded-t-3xl">
      <div className="restaurants__container !px-0 !gap-3 md:!gap-8">
        <div className="flex flex-row items-center justify-between overflow-x-auto">
          <Filter onFilterChange={handleFilterChange} initialPalates={filters.palates} />
            <div className="max-w-[218px] md:max-w-[345px] flex gap-2.5 md:gap-2 justify-between items-center border shrink-0 border-[#494D5D] bg-[#FCFCFC] px-4 py-2 md:px-6 md:py-[15px] rounded-[50px] relative">
              <FiSearch className="hero__search-icon shrink-0 !mr-0" />
              <input
                type="text"
                placeholder="Search by Listing Name"
                value={listing}
                onChange={(e) => {
                  handleListingChange(e)
                }}
                onClick={() => setIsShowPopup(!isShowPopup)}
                className="search-bar__input !border-none text-sm md:text-base !text-left bg-transparent focus-visible:border-none outline-0 w-full font-semibold"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setListing("")
                    setSearchTerm("")
                  }}
                  className="absolute right-2 top-2 bg-[#FCFCFC] px-1 md:top-4 text-sm text-[#494D5D] hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>
          <CustomModal
            isOpen={isShowPopup}
            setIsOpen={setIsShowPopup}
            header={<></>}
            content={
              <>
                <div className="flex flex-row gap-3 items-center py-7 px-3 md:p-0 border-b border-[#CACACA]">
                    <button onClick={() => setIsShowPopup(false) } className="size-8 md:hidden flex justify-center items-center">
                      <MdArrowBackIos className="size-4" />
                    </button>
                  <form id="searchForm" onSubmit={handleSearch} className="w-full flex gap-2.5 md:gap-6 justify-between items-center border border-[#E5E5E5] bg-[#FCFCFC] px-4 py-3 md:px-6 md:py-[15px] rounded-[50px]">
                    <div className="hero__search-restaurant !bg-transparent w-full">
                      <FiSearch className="hero__search-icon hidden md:block" />
                      <input
                        type="text"
                        placeholder="Search by Listing Name"
                        value={listing}
                        onChange={(e) => {
                          handleListingChange(e)
                        }}
                        className="bg-transparent focus-visible:border-none outline-0 w-full font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="hidden md:block rounded-full text-sm md:text-base text-[#FCFCFC] h-9 md:h-11 font-semibold w-fit px-4 md:px-6 py-2 md:py-3 text-center bg-[#E36B00] md:leading-none"
                      disabled={!listing}
                    >
                      Search
                    </button>
                  </form>
                </div>
                <SelectOptions
                    isOpen={showListingModal}
                    isLoading={listingLoading}
                    options={listingOptions}
                    searchValue={listing}
                    onSelect={(label) => {
                      if (width > 767) {
                        setListing(label);
                        setShowListingModal(false);
                      } else {
                        setListing(label)
                        setShowListingModal(false);
                        setIsShowPopup(false)
                        setSearchTerm(label)
                      }
                    }}
                    onClose={() => setShowListingModal(false)}
                    className="!p-2 !w-full z-50 !max-h-[85vh] md:!max-h-[350px] !border-none !shadow-none"
                  />
              </>
            }
            hasFooter
            footerClass="!p-0"
            headerClass="!p-0 !border-none"
            contentClass="md:!gap-10 !p-0"
            baseClass="md:!mt-[112px] !rounded-none !bg-transparent !max-w-[700px] !m-0"
            hasCustomCloseButton
            customButton={<></>}
            wrapperClass="!items-start !z-[1010] bg-[#FCFCFC] md:bg-transparent"
          />
        </div>
        <div>
          <h3 className="pl-3 md:pl-6 xl:pl-0 text-sm md:text-xl">
            {restaurants.length} {restaurants.length > 1 ? 'results' : 'result'}
          </h3>
          <div className="restaurants__grid mt-3 md:mt-4 px-3 md:px-6 xl:px-0">
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