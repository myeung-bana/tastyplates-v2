// pages/RestaurantPage.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import RestaurantCard from "@/components/Restaurant/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import Filter2 from "@/components/Filter/Filter2";
import SkeletonCard from "@/components/ui/Skeleton/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService"
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { transformRestaurantV2ToRestaurant } from "@/utils/restaurantTransformers";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { useDebounce } from "use-debounce";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useSearchParams, useRouter } from "next/navigation"; // Import useRouter
import { debounce } from "@/utils/debounce";
import { DEFAULT_RESTAURANT_IMAGE } from "@/constants/images";
import { getBestAddress } from "@/utils/addressUtils";
import SuggestedRestaurants from './SuggestedRestaurants';
import { shouldShowSuggestions, RESTAURANT_CONSTANTS } from '@/constants/utils';
import { useLocation } from '@/contexts/LocationContext';
import { applyLocationFilter, sortByLocationRelevance } from '@/utils/locationUtils';
import { LOCATION_HIERARCHY } from '@/constants/location';
import '@/styles/components/suggested-restaurants.scss';
import Breadcrumb from '@/components/common/Breadcrumb';

// Dev-only logging helper
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};
const devError = (...args: any[]) => {
  if (isDev) console.error(...args);
};

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
  categories?: { id: number; name: string; slug: string; parent_id?: number | null }[];
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

interface RestaurantPageProps {
  cuisineSlug?: string;
  cuisineName?: string | null;
  hideCuisineFilter?: boolean;
}

type PreferenceStatsMap = Record<string, { avg: number; count: number }>;

const normalizeUserPalates = (palates: any): string[] => {
  if (!palates) return [];
  if (Array.isArray(palates)) {
    // Most common: ["korean","japanese"]
    if (palates.every((p) => typeof p === 'string')) {
      return palates.map((p) => p.trim().toLowerCase()).filter(Boolean);
    }
    // Fallback: [{slug:"korean"}] or [{name:"Korean"}]
    return palates
      .map((p: any) => (typeof p === 'string' ? p : (p?.slug || p?.name || '')))
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof palates === 'string') {
    // Sometimes stored as pipe-delimited from older components
    return palates
      .split('|')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const RestaurantPage = ({ cuisineSlug, cuisineName, hideCuisineFilter = false }: RestaurantPageProps = {}) => {
  const { user } = useFirebaseSession();
  const { selectedLocation } = useLocation();

  // Helper function to get parent country's short code for cities
  const getParentCountryCode = (cityKey: string): string => {
    for (const country of LOCATION_HIERARCHY.countries) {
      const city = country.cities.find(c => c.key === cityKey);
      if (city) {
        return country.shortLabel;
      }
    }
    return '';
  };

  // Helper function to format location display
  const formatLocationDisplay = (location: any): string => {
    if (location.type === 'city') {
      const countryCode = getParentCountryCode(location.key);
      return `${location.label}, ${countryCode}`;
    } else if (location.type === 'country') {
      return `${location.label}, ${location.shortLabel}`;
    }
    return location.label;
  };
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize URL parameters - support both 'ethnic' and 'palates' parameters
  const initialEthnicFromUrl = searchParams?.get("ethnic") ? decodeURIComponent(searchParams.get("ethnic") as string) : "";
  const initialPalatesFromUrl = searchParams?.get("palates") ? decodeURIComponent(searchParams.get("palates") as string) : "";
  const initialAddressFromUrl = searchParams?.get("address") ? decodeURIComponent(searchParams.get("address") as string) : "";
  const initialListingFromUrl = searchParams?.get("listing") ? decodeURIComponent(searchParams.get("listing") as string) : "";
  
  // Helper function to expand region names to individual palates
  const expandRegionsToPalates = (values: string[]): string[] => {
    const expanded: string[] = [];
    values.forEach(value => {
      // Check if this value is a region name
      if (RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS[value as keyof typeof RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS]) {
        // It's a region, add all palates from that region
        const regionPalates = RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS[value as keyof typeof RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS];
        expanded.push(...regionPalates);
      } else {
        // It's an individual palate
        expanded.push(value);
      }
    });
    return expanded;
  };
  
  // Convert URL parameters to palates array
  const getInitialPalatesFromUrl = () => {
    // Prefer 'palates' parameter over 'ethnic' for consistency with NavbarSearchBar
    const paramValue = initialPalatesFromUrl || initialEthnicFromUrl;
    if (!paramValue) return [];
    
    // Split by comma and clean up the values
    const values = paramValue.split(',').map(val => val.trim()).filter(val => val);
    
    // Expand any region names to individual palates
    return expandRegionsToPalates(values);
  };
  
  // Initialize state with URL parameters
  const [searchAddress] = useState(initialAddressFromUrl);
  const [searchEthnic, setSearchEthnic] = useState(() => {
    const palates = getInitialPalatesFromUrl();
    return palates.join(',');
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [searchTerm] = useState(initialListingFromUrl);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const initialPalates = getInitialPalatesFromUrl();

  const [filters, setFilters] = useState({
    cuisine: cuisineSlug ? [cuisineSlug] : null as string[] | null,
    palates: initialPalates,
    price: null as string | null,
    rating: null as number | null,
    badges: null as string | null,
    sortOption: null as string | null, // 'MY_PREFERENCE' | 'SMART' | 'ASC' | 'DESC' | 'NEWEST'
  });

  const userPreferencePalates = useMemo(() => normalizeUserPalates(user?.palates), [user?.palates]);
  const [preferenceStats, setPreferenceStats] = useState<PreferenceStatsMap>({});
  const [preferenceLoading, setPreferenceLoading] = useState(false);

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
    image: item.featuredImage?.node.sourceUrl || DEFAULT_RESTAURANT_IMAGE,
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
  // Memoized to prevent unnecessary re-computations
  const sortRestaurants = useCallback((
    restaurants: Restaurant[], 
    selectedPalates: string[], 
    sortOption: string | null, 
    locationKeyword?: string
  ) => {
    if (!restaurants || restaurants.length === 0) return restaurants;
    
    let sortedRestaurants = [...restaurants];
    
    // First, apply location-based sorting if location keyword is provided
    if (locationKeyword && locationKeyword.trim()) {
      sortedRestaurants = restaurantService.sortRestaurantsByLocation(sortedRestaurants, locationKeyword);
    }
    
    return sortedRestaurants.sort((a, b) => {
      // MY PREFERENCE sorting (uses precomputed stats from API)
      if (sortOption === 'MY_PREFERENCE') {
        const aPref = a.searchPalateStats?.avg ?? -1;
        const bPref = b.searchPalateStats?.avg ?? -1;
        if (aPref !== bPref) return bPref - aPref;

        const aCount = a.searchPalateStats?.count ?? 0;
        const bCount = b.searchPalateStats?.count ?? 0;
        if (aCount !== bCount) return bCount - aCount;

        // Fallback to overall rating & review count
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
        return (b.ratingsCount || 0) - (a.ratingsCount || 0);
      }

      // PALATE-BASED SORTING (when palates are selected)
      if (selectedPalates && selectedPalates.length > 0) {
        const aPalateStats = a.searchPalateStats;
        const bPalateStats = b.searchPalateStats;
        
        // Check if restaurants have valid palate ratings
        const aHasValidPalateRating = aPalateStats && aPalateStats.count > 0 && aPalateStats.avg > 0;
        const bHasValidPalateRating = bPalateStats && bPalateStats.count > 0 && bPalateStats.avg > 0;
        
        // Strategy: 
        // Tier 1: Restaurants WITH matching palate reviews (sorted by palate rating)
        // Tier 2: Restaurants WITHOUT matching palate reviews (sorted by overall rating)
        
        if (aHasValidPalateRating && bHasValidPalateRating) {
          // Both have valid palate ratings - compare palate ratings
          const diff = bPalateStats.avg - aPalateStats.avg;
          if (Math.abs(diff) > 0.01) return diff; // Use 0.01 threshold for float comparison
          
          // If palate ratings are equal, use review count as tiebreaker
          if (bPalateStats.count !== aPalateStats.count) {
            return bPalateStats.count - aPalateStats.count;
          }
          
          // Final tiebreaker: overall rating
          return (b.rating || 0) - (a.rating || 0);
        }
        
        if (aHasValidPalateRating && !bHasValidPalateRating) {
          // A has palate rating, B doesn't - A comes first (Tier 1 > Tier 2)
          return -1;
        }
        
        if (!aHasValidPalateRating && bHasValidPalateRating) {
          // B has palate rating, A doesn't - B comes first (Tier 1 > Tier 2)
          return 1;
        }
        
        // Neither has valid palate ratings (both Tier 2) - fall back to overall rating
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
        
        // Final tiebreaker: total review count
        return (b.ratingsCount || 0) - (a.ratingsCount || 0);
      }
      
      // NO PALATE SELECTED - Sort by overall quality
      // Priority order:
      // 1. Overall rating (descending)
      // 2. Number of reviews (more reviews = more reliable)
      // 3. Recognition count (if available)
      
      if (sortOption === 'ASC') {
        // Ascending order (lowest to highest)
        return (a.rating || 0) - (b.rating || 0);
      } else if (sortOption === 'DESC') {
        // Descending order (highest to lowest)
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortOption === 'NEWEST') {
        // Server already returns newest first (created_at desc), so keep stable fallback:
        // Prefer higher databaseId as a rough proxy if needed.
        return (b.databaseId || 0) - (a.databaseId || 0);
      } else {
        // Default: Smart sorting by quality
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        
        // Only use rating as primary if difference is significant (>0.1 stars)
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        
        // If ratings are similar, prefer more reviewed restaurants
        const reviewCountDiff = (b.ratingsCount || 0) - (a.ratingsCount || 0);
        if (reviewCountDiff !== 0) return reviewCountDiff;
        
        // Final tiebreaker: recognition count (if available)
        return (b.recognitionCount || 0) - (a.recognitionCount || 0);
      }
    });
  }, []);

  const fetchRestaurants = useCallback(async (reset = false, after: string | null = null, firstOverride?: number) => {
    setLoading(true);
    try {
      const firstValue = firstOverride ?? (reset && isFirstLoad.current ? RESTAURANT_CONSTANTS.INITIAL_LOAD_RESULTS : RESTAURANT_CONSTANTS.DEFAULT_RESULTS_PER_PAGE);

      let transformed: Restaurant[] = [];
      let endCursor: string | null = null;
      let hasNextPage = false;

      // Always use V2 API (Hasura) - WordPress API phased out
      try {
        // Calculate offset from cursor (if using cursor-based pagination)
        // For now, using offset-based pagination
        const offset = after ? parseInt(after) || 0 : 0;

        const response = await restaurantV2Service.getAllRestaurants({
          limit: firstValue,
          offset: offset,
          status: 'publish', // Only published restaurants
          search: debouncedSearchTerm || undefined
        });

        // Check for success field (new format per API guidelines)
        if (!response.success || response.error) {
          devError('❌ V2 API error:', response.error || response.message || 'Unknown error');
          devError('Response details:', response);
          throw new Error(response.error || response.message || 'Failed to fetch restaurants');
        }

        // Transform Hasura format to component format
        transformed = response.data.map(transformRestaurantV2ToRestaurant);

        // Update pagination (offset-based)
        const nextOffset = offset + firstValue;
        endCursor = response.meta.hasMore ? nextOffset.toString() : null;
        hasNextPage = response.meta.hasMore;
      } catch (v2Error) {
        devError('V2 API failed:', v2Error);
        // Show error to user - restaurants array will remain empty
        devError('Failed to load restaurants from V2 API:', v2Error);
        setLoading(false);
        // Don't return - let the rest of the function handle empty array
        transformed = [];
        endCursor = null;
        hasNextPage = false;
      }
      
      // Store raw fetched restaurants; filtering/sorting happens in a derived memo.
      setRestaurants((prev: Restaurant[]) => {
        if (reset || !after) return transformed;
        const uniqueMap = new Map<string, Restaurant>();
        prev.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        transformed.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        return Array.from(uniqueMap.values());
      });
      
      // Check if we should show suggestions
      const totalResults = transformed.length;
      setShowSuggestions(shouldShowSuggestions(totalResults) && filters.palates && filters.palates.length > 0);
      
      setEndCursor(endCursor);
      setHasNextPage(hasNextPage);
    } catch (error) {
      devError("Failed to fetch restaurants:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Debounced filter change handler
  type FilterChangeType = {
    cuisine?: string[] | null;
    price?: string | null;
    rating?: number | null;
    badges?: string | null;
    sortOption?: string | null;
    palates?: string[] | null;
  };

  const filterUpdateFn = useCallback((newFilters: FilterChangeType) => {
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

  const [debouncedFilterUpdate] = useMemo(
    () => debounce(filterUpdateFn as (...args: unknown[]) => void, 300),
    [filterUpdateFn]
  ) as [(newFilters: FilterChangeType) => void, () => void];

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
    debouncedFilterUpdate(newFilters);
  }, [debouncedFilterUpdate]);


  useEffect(() => {
    setRestaurants([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    fetchRestaurants(true, null, RESTAURANT_CONSTANTS.INITIAL_LOAD_RESULTS);
    isFirstLoad.current = false;
  }, [debouncedSearchTerm, fetchRestaurants]);

  // Default sort to MY_PREFERENCE for users with palates (don't override user choice once set)
  useEffect(() => {
    if (!userPreferencePalates || userPreferencePalates.length === 0) {
      // If user logs out while on MY_PREFERENCE, fall back to SMART
      setFilters((prev) => (prev.sortOption === 'MY_PREFERENCE' ? { ...prev, sortOption: 'SMART' } : prev));
      return;
    }
    setFilters((prev) => (prev.sortOption ? prev : { ...prev, sortOption: 'MY_PREFERENCE' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPreferencePalates.join('|')]);

  // Fetch preference stats when needed (cached endpoint)
  useEffect(() => {
    const shouldFetch = filters.sortOption === 'MY_PREFERENCE' && userPreferencePalates.length > 0;
    if (!shouldFetch) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        setPreferenceLoading(true);
        const url = `/api/v1/restaurants-v2/get-preference-stats?palates=${encodeURIComponent(
          userPreferencePalates.join(',')
        )}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch preference stats: ${res.status}`);
        const json = await res.json();
        if (!json?.success) throw new Error(json?.error || 'Failed to fetch preference stats');
        setPreferenceStats(json.data || {});
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        devError('Failed to load preference stats:', e);
        setPreferenceStats({});
      } finally {
        setPreferenceLoading(false);
      }
    };

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortOption, userPreferencePalates.join('|')]);

  const displayedRestaurants = useMemo(() => {
    let list = restaurants;

    // Attach preference stats when available
    if (filters.sortOption === 'MY_PREFERENCE') {
      list = list.map((r) => ({
        ...r,
        searchPalateStats: preferenceStats[r.id] || r.searchPalateStats || { avg: 0, count: 0 },
      }));
    }

    // Cuisine filtering
    if (cuisineSlug && filters.cuisine && filters.cuisine.length > 0) {
      list = list.filter((restaurant) => {
        if (!restaurant.listingCategories || restaurant.listingCategories.length === 0) return false;
        return restaurant.listingCategories.some(
          (category) => category.slug === cuisineSlug || filters.cuisine?.includes(category.slug)
        );
      });
    }

    // Price filter (client-side)
    if (filters.price) {
      list = list.filter((r) => {
        const price = (r.priceRange || '').toLowerCase();
        return price.includes(filters.price!.toLowerCase());
      });
    }

    // Rating filter
    if (filters.rating && filters.rating > 0) {
      list = list.filter((r) => (r.rating || 0) >= (filters.rating || 0));
    }

    // Address keyword filter
    if (searchAddress && searchAddress.trim()) {
      list = list.filter((restaurant) => restaurantService.calculateLocationRelevance(restaurant, searchAddress) > 0);
    }

    // Selected location (city/country)
    if (selectedLocation && selectedLocation.type) {
      list = applyLocationFilter(list, selectedLocation, 100);
      list = sortByLocationRelevance(list, selectedLocation);
    }

    // Sorting
    return sortRestaurants(list, filters.palates, filters.sortOption, searchAddress);
  }, [
    restaurants,
    preferenceStats,
    filters.cuisine,
    filters.palates,
    filters.price,
    filters.rating,
    filters.sortOption,
    cuisineSlug,
    searchAddress,
    selectedLocation,
    sortRestaurants,
  ]);

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
      devError("Error loading listing options", err);
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
        <div className="restaurants__content">
          {/* Breadcrumb */}
          <div className="px-2 mb-4 md:mb-6">
            <Breadcrumb 
              items={[
                { label: "Restaurants", href: "/restaurants" },
                ...(cuisineName ? [{ label: `Cuisine: ${cuisineName}` }] : [])
              ]}
              showHomeIcon={true}
            />
          </div>
          
          {!hideCuisineFilter && (
            <Filter2 
              onFilterChange={handleFilterChange}
              initialCuisines={filters.cuisine || []}
              initialPalates={filters.palates || []}
              initialSortOption={filters.sortOption || (userPreferencePalates.length > 0 ? 'MY_PREFERENCE' : 'SMART')}
            />
          )}

          {loading && displayedRestaurants.length === 0 ? (
            <div className="restaurants__grid restaurants__grid--skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : displayedRestaurants.length === 0 ? (
            <div className="restaurants__no-results">
              <div className="text-center py-12">
                <h3 className="text-lg font-normal text-gray-900 mb-2 font-neusans">No results found</h3>
                <p className="text-gray-500 font-neusans">
                  Try adjusting your search criteria or filters to find more restaurants.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="restaurants__grid">
                {displayedRestaurants.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    priority={index < 8}
                  />
                ))}
              </div>
              
              {showSuggestions && (
                <SuggestedRestaurants
                  selectedPalates={filters.palates || []}
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
