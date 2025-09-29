// pages/RestaurantPage.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import Filter2 from "@/components/Filter/Filter2";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService"
import { Listing } from "@/interfaces/restaurant/restaurant";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation"; // Import useRouter
import { debounce } from "@/utils/debounce";
import { DEFAULT_IMAGE } from "@/constants/images";
import { getBestAddress } from "@/utils/addressUtils";
import SuggestedRestaurants from './SuggestedRestaurants';
import { shouldShowSuggestions, RESTAURANT_CONSTANTS } from '@/constants/utils';
import '@/styles/components/suggested-restaurants.scss';

export interface Restaurant {
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
  googleMapUrl?: {
    city?: string;
    country?: string;
    countryShort?: string;
    streetAddress?: string;
    streetNumber?: string;
    streetName?: string;
    state?: string;
    stateShort?: string;
    postCode?: string;
    latitude?: string;
    longitude?: string;
    placeId?: string;
    zoom?: number;
  };
  ratingsCount?: number;
  searchPalateStats?: {
    avg: number;
    count: number;
  };
}

const restaurantService = new RestaurantService();

const RestaurantPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize URL parameters
  const initialEthnicFromUrl = searchParams?.get("ethnic") ? decodeURIComponent(searchParams.get("ethnic") as string) : "";
  const initialAddressFromUrl = searchParams?.get("address") ? decodeURIComponent(searchParams.get("address") as string) : "";
  const initialListingFromUrl = searchParams?.get("listing") ? decodeURIComponent(searchParams.get("listing") as string) : "";
  
  // Initialize state with URL parameters
  const [searchAddress] = useState(initialAddressFromUrl);
  const [searchEthnic, setSearchEthnic] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [searchTerm] = useState(initialListingFromUrl);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Convert ethnic URL parameter to palates array
  const getInitialPalatesFromUrl = () => {
    if (!initialEthnicFromUrl) return [];
    
    // Split by comma and clean up the values
    const ethnicValues = initialEthnicFromUrl.split(',').map(val => val.trim()).filter(val => val);
    
    console.log('🌐 URL ethnic parameter:', initialEthnicFromUrl);
    console.log('🍽️ Converted to palates:', ethnicValues);
    
    // Map ethnic values to palate names (this might need adjustment based on your data structure)
    return ethnicValues;
  };

  const [filters, setFilters] = useState({
    cuisine: null as string[] | null,
    palates: getInitialPalatesFromUrl(),
    price: null as string | null,
    rating: null as number | null,
    badges: null as string | null,
    sortOption: null as string | null,
  });

  const [listingEndCursor, setListingEndCursor] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [listingOptions, setListingOptions] = useState<Array<{ key: string; label: string }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [listingCurrentPage, setListingCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [listingHasNextPage, setListingHasNextPage] = useState(false);
  const fetchListingsDebouncedRef = useRef<(input: string) => void>();

  const mapListingToRestaurant = useCallback((item: Listing): Restaurant => ({
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
    streetAddress: getBestAddress(
      item.listingDetails?.googleMapUrl, 
      item.listingStreet, 
      'No address available'
    ),
    googleMapUrl: item.listingDetails?.googleMapUrl,
    ratingsCount: item.ratingsCount ?? 0,
    searchPalateStats: item.searchPalateStats,
  }), []);



  useEffect(() => {
    if (initialListingFromUrl) {
      const params = new URLSearchParams(window.location.search);
      params.delete("listing");

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [initialListingFromUrl, router]);

  // Client-side sorting function for both palate-based and regular sorting
  const sortRestaurants = (restaurants: Restaurant[], selectedPalates: string[], sortOption: string | null, locationKeyword?: string) => {
    if (!restaurants || restaurants.length === 0) return restaurants;
    
    let sortedRestaurants = [...restaurants];
    
    // First, apply location-based sorting if location keyword is provided
    if (locationKeyword && locationKeyword.trim()) {
      sortedRestaurants = restaurantService.sortRestaurantsByLocation(sortedRestaurants, locationKeyword);
    }
    
    return sortedRestaurants.sort((a, b) => {
      // If palates are selected, prioritize palate-based sorting
      if (selectedPalates && selectedPalates.length > 0) {
        const aPalateRating = a.searchPalateStats?.avg || 0;
        const bPalateRating = b.searchPalateStats?.avg || 0;
        
        // Sort by palate rating (descending), then by regular rating
        if (bPalateRating !== aPalateRating) {
          return bPalateRating - aPalateRating;
        }
        
        return (b.rating || 0) - (a.rating || 0);
      }
      
      // Regular sorting based on sortOption
      if (sortOption === 'ASC') {
        return (a.rating || 0) - (b.rating || 0);
      } else if (sortOption === 'DESC') {
        return (b.rating || 0) - (a.rating || 0);
      }
      
      // Default: no sorting
      return 0;
    });
  };

  const fetchRestaurants = useCallback(async (reset = false, after: string | null = null, firstOverride?: number) => {
    setLoading(true);
    try {
      console.log('🔍 Fetching restaurants with searchAddress:', searchAddress);
      
      const data = await restaurantService.fetchAllRestaurants(
        debouncedSearchTerm,
        firstOverride ?? (reset && isFirstLoad.current ? RESTAURANT_CONSTANTS.INITIAL_LOAD_RESULTS : RESTAURANT_CONSTANTS.DEFAULT_RESULTS_PER_PAGE),
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
        null, // Remove address from GraphQL query - use client-side filtering
        searchEthnic
      );
      const transformed = (data.nodes as unknown as Listing[]).map(mapListingToRestaurant);
      
      // Apply location filtering if searchAddress is provided
      let filteredRestaurants = transformed;
      if (searchAddress && searchAddress.trim()) {
        filteredRestaurants = transformed.filter(restaurant => {
          const relevance = restaurantService.calculateLocationRelevance(restaurant, searchAddress);
          return relevance > 0; // Only include restaurants with location relevance
        });
      }
      
      // Apply client-side sorting (location-based, palate-based, or regular)
      const sortedRestaurants = sortRestaurants(filteredRestaurants, filters.palates, filters.sortOption, searchAddress);
      
      setRestaurants((prev: Restaurant[]) => {
        if (reset || !after) return sortedRestaurants;
        const uniqueMap = new Map<string, Restaurant>();
        prev.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        sortedRestaurants.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        return Array.from(uniqueMap.values());
      });
      
      // Check if we should show suggestions
      const totalResults = sortedRestaurants.length;
      setShowSuggestions(shouldShowSuggestions(totalResults) && filters.palates && filters.palates.length > 0);
      
      setEndCursor(data.pageInfo.endCursor as string | null);
      setHasNextPage(data.pageInfo.hasNextPage as boolean);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters.cuisine, filters.palates, filters.price, filters.badges, filters.sortOption, filters.rating, searchAddress, searchEthnic, mapListingToRestaurant]);

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
    console.log('🔄 Restaurant handleFilterChange called with:', newFilters);
    
    // Update searchEthnic when palates are selected
    if (newFilters.palates && newFilters.palates.length > 0) {
      setSearchEthnic(newFilters.palates.join(','));
    } else {
      setSearchEthnic("");
    }
    
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
  }, [debouncedSearchTerm, filters, searchAddress, searchEthnic, session?.accessToken, fetchRestaurants]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !loading) {
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
  }, [hasNextPage, loading, endCursor, fetchRestaurants]);

  // Removed unused function

  const handleRestaurantClick = async (restaurantId: number) => {
    if (!session?.accessToken) return;
    
    try {
      await restaurantService.addRecentlyVisitedRestaurant(restaurantId, session.accessToken);
    } catch (error) {
      console.error("Failed to add recently visited restaurant:", error);
    }
  };

  // Handler for suggested restaurants (takes Restaurant object)
  const handleSuggestedRestaurantClick = async (restaurant: Restaurant) => {
    await handleRestaurantClick(restaurant.databaseId);
  };

  const fetchListingsName = useCallback(async (search: string = '', page = 1) => {
    try {
      const result = await restaurantService.fetchListingsName(
        search,
        32,
        page === 1 ? null : listingEndCursor
      );
      const formatted = result.nodes.map((item: Record<string, unknown>) => ({
        key: item.slug as string,
        label: item.title as string,
      }));
      setListingOptions(prev => page === 1 ? formatted : [...prev, ...formatted]);
      setListingCurrentPage(page);
      setListingEndCursor(result.pageInfo.endCursor as string | null);
      setListingHasNextPage(result.pageInfo.hasNextPage as boolean);
    } catch (err) {
      console.error("Error loading listing options", err);
      setListingOptions([]);
    }
  }, [listingEndCursor]);

  useEffect(() => {
    // Initialize debounced function once
    const [debouncedListing] = debounce((...args: unknown[]) => {
      fetchListingsName(args[0] as string, args[1] as number);
    }, 500);

    fetchListingsDebouncedRef.current = debouncedListing;
    fetchListingsDebouncedRef.current?.('');
  }, [fetchListingsName]);

  return (
    <div className="restaurants">
      <div className="restaurants__container">
        <div className="restaurants__title">
          {searchAddress && (
            <p className="text-sm text-gray-600 mt-1">
              Showing results for: <span className="font-medium">{searchAddress}</span>
            </p>
          )}
        </div>
        
        <div className="restaurants__content">
          <Filter2 
            onFilterChange={handleFilterChange}
            initialCuisines={filters.cuisine || []}
            initialPalates={filters.palates || []}
          />

          {loading && restaurants.length === 0 ? (
            <div className="restaurants__grid restaurants__grid--skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="restaurants__no-results">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or filters to find more restaurants.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="restaurants__grid">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant.databaseId)}
                  />
                ))}
              </div>
              
              {showSuggestions && (
                <SuggestedRestaurants
                  selectedPalates={filters.palates || []}
                  onRestaurantClick={handleSuggestedRestaurantClick}
                />
              )}
              
              {hasNextPage && (
                <div ref={observerRef} className="restaurants__observer">
                  {loading && (
                    <div className="restaurants__grid restaurants__grid--skeleton">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonCard key={`infinite-${index}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantPage;