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
import { useDebounce } from "use-debounce";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SuggestedRestaurants from './SuggestedRestaurants';
import { shouldShowSuggestions, RESTAURANT_CONSTANTS } from '@/constants/utils';
import { normalizePalateUrlSegment } from '@/lib/palateSlug';
import { useLocation } from '@/contexts/LocationContext';
import '@/styles/components/suggested-restaurants.scss';
import Breadcrumb from '@/components/common/Breadcrumb';

// Dev-only logging helper
const isDev = process.env.NODE_ENV === 'development';
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
  /** `published_at` / `created_at` as ms; used for NEWEST sort */
  listedAtMs?: number;
  searchPalateStats?: {
    avg: number;
    count: number;
  };
}

const restaurantService = new RestaurantService();

const HK_CITY_KEYS = ['hong_kong_island', 'kowloon', 'new_territories'];

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
  const { user } = useNhostSession();
  const { selectedLocation } = useLocation();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
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
    
    // Split by comma; normalize segments (legacy Title Case → lowercase slugs; regions stay canonical)
    const values = paramValue.split(',').map(val => val.trim()).filter(val => val);
    const normalized = values.map(normalizePalateUrlSegment).filter(Boolean);
    return expandRegionsToPalates(normalized);
  };
  
  // Initialize state with URL parameters
  const [searchAddress] = useState(initialAddressFromUrl);
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





  useEffect(() => {
    if (initialListingFromUrl) {
      const params = new URLSearchParams(window.location.search);
      params.delete("listing");

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [initialListingFromUrl, router]);

  /**
   * Client-side sort applied to the server-filtered result set.
   * DESC / ASC / NEWEST / SMART: data arrives pre-ordered from the API — this is a no-op for those.
   * MY_PREFERENCE: ranks by preference stats fetched per user palates (client-side only).
   */
  const sortRestaurants = useCallback(
    (
      restaurants: Restaurant[],
      sortOption: string | null,
      opts: {
        locationKeyword?: string;
      }
    ) => {
      if (!restaurants || restaurants.length === 0) return restaurants;

      let sortedRestaurants = [...restaurants];

      if (opts.locationKeyword && opts.locationKeyword.trim()) {
        sortedRestaurants = restaurantService.sortRestaurantsByLocation(
          sortedRestaurants,
          opts.locationKeyword
        );
      }

      const compareBySortOption = (a: Restaurant, b: Restaurant): number => {
        if (sortOption === 'MY_PREFERENCE') {
          const aPref = a.searchPalateStats?.avg ?? -1;
          const bPref = b.searchPalateStats?.avg ?? -1;
          if (aPref !== bPref) return bPref - aPref;

          const aCount = a.searchPalateStats?.count ?? 0;
          const bCount = b.searchPalateStats?.count ?? 0;
          if (aCount !== bCount) return bCount - aCount;

          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
          return (b.ratingsCount || 0) - (a.ratingsCount || 0);
        }

        // SMART / ASC / DESC / NEWEST — data arrives pre-sorted from the server; no-op.
        return 0;
      };

      return sortedRestaurants.sort(compareBySortOption);
    },
    []
  );

  // Stable primitive keys used as useCallback deps so array/object identity doesn't cause spurious refetches
  const locationKey = selectedLocation?.key || '';
  const palatesKey = (filters.palates || []).join(',');
  const cuisinesKey = (filters.cuisine || []).join(',');
  const ratingKey = filters.rating || 0;
  // MY_PREFERENCE sorts client-side; all other named options are handled server-side
  const serverSortKey = ['DESC', 'ASC', 'NEWEST', 'SMART'].includes(filters.sortOption || '')
    ? (filters.sortOption || '')
    : '';

  // Sync `palates` query param with filters (shareable URLs; canonical `palates` vs legacy `ethnic`).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.palates?.length) {
      params.set("palates", filters.palates.join(","));
      params.delete("ethnic");
    } else {
      params.delete("palates");
    }
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname || "/restaurants", { scroll: false });
    }
  }, [palatesKey, pathname, router, searchParams]);

  const fetchRestaurants = useCallback(async (reset = false, after: string | null = null, firstOverride?: number) => {
    setLoading(true);
    try {
      const firstValue = firstOverride ?? (reset && isFirstLoad.current ? RESTAURANT_CONSTANTS.INITIAL_LOAD_RESULTS : RESTAURANT_CONSTANTS.DEFAULT_RESULTS_PER_PAGE);

      let transformed: Restaurant[] = [];
      let newEndCursor: string | null = null;
      let newHasNextPage = false;

      try {
        const offset = after ? parseInt(after) || 0 : 0;

        // Build server-side location params from selected location
        const locationParams: { city_name?: string; country_short?: string } = {};
        if (selectedLocation?.type === 'city') {
          if (HK_CITY_KEYS.includes(selectedLocation.key)) {
            // All HK districts → filter by country_short HK
            locationParams.country_short = 'HK';
          } else {
            locationParams.city_name = selectedLocation.label;
          }
        } else if (selectedLocation?.type === 'country') {
          locationParams.country_short = selectedLocation.shortLabel;
        }

        // Map sort option to server-side order_by; MY_PREFERENCE sorts client-side
        let serverOrderBy: 'rating' | 'rating_asc' | 'smart' | 'created_at' | undefined;
        if (filters.sortOption === 'DESC') serverOrderBy = 'rating';
        else if (filters.sortOption === 'ASC') serverOrderBy = 'rating_asc';
        else if (filters.sortOption === 'NEWEST') serverOrderBy = 'created_at';
        else if (filters.sortOption === 'SMART') serverOrderBy = 'smart';

        // Server-side cuisine slug filters.
        // Cuisine pill selections (filters.palates) store slugs like "korean", "japanese", and region
        // keys like "East Asian". Expand regions to their child slugs, then merge with any explicit
        // cuisine slugs. Both are queried against the `cuisines` JSONB field in the DB (restaurants
        // store cuisine tags in `cuisines`, not `palates`).
        const expandedPalateSlugs = filters.palates?.length
          ? expandRegionsToPalates(filters.palates)
          : [];
        const baseCuisineSlugs = cuisineSlug
          ? [cuisineSlug]
          : (filters.cuisine ?? []);
        const cuisineSlugsForApi = [...baseCuisineSlugs, ...expandedPalateSlugs];

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/998e216f-8c70-4192-8627-2b8eab37289f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Restaurant.tsx:fetchRestaurants',message:'about to call getAllRestaurants',data:{filtersPalates:filters.palates,expandedPalateSlugs,cuisineSlugsForApi,sortOption:filters.sortOption,serverOrderBy},runId:'post-fix',hypothesisId:'H-A',timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const response = await restaurantV2Service.getAllRestaurants({
          limit: firstValue,
          offset,
          status: 'publish',
          search: debouncedSearchTerm || undefined,
          min_rating: filters.rating && filters.rating > 0 ? filters.rating : undefined,
          cuisine_slugs: cuisineSlugsForApi.length ? cuisineSlugsForApi : undefined,
          order_by: serverOrderBy,
          ...locationParams,
        });

        if (!response.success || response.error) {
          devError('❌ V2 API error:', response.error || response.message || 'Unknown error');
          throw new Error(response.error || response.message || 'Failed to fetch restaurants');
        }

        transformed = response.data.map(transformRestaurantV2ToRestaurant);

        const nextOffset = offset + firstValue;
        newEndCursor = response.meta.hasMore ? nextOffset.toString() : null;
        newHasNextPage = response.meta.hasMore;
      } catch (v2Error) {
        devError('V2 API failed:', v2Error);
        transformed = [];
        newEndCursor = null;
        newHasNextPage = false;
      }

      setRestaurants((prev: Restaurant[]) => {
        if (reset || !after) return transformed;
        const uniqueMap = new Map<string, Restaurant>();
        prev.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        transformed.forEach((r: Restaurant) => uniqueMap.set(r.id, r));
        return Array.from(uniqueMap.values());
      });

      setShowSuggestions(shouldShowSuggestions(transformed.length) && !!filters.palates && filters.palates.length > 0);

      setEndCursor(newEndCursor);
      setHasNextPage(newHasNextPage);
    } catch (error) {
      devError("Failed to fetch restaurants:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, locationKey, palatesKey, cuisinesKey, ratingKey, serverSortKey, cuisineSlug]);

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
    setFilters(
      prev => ({
        ...prev,
        ...newFilters,
        cuisine: Array.isArray(newFilters.cuisine) ? newFilters.cuisine : prev.cuisine,
        palates: Array.isArray(newFilters.palates) ? newFilters.palates : prev.palates
      }));
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: {
      cuisine?: string[] | null;
      price?: string | null;
      rating?: number | null;
      badges?: string | null;
      sortOption?: string | null;
      palates?: string[] | null;
    }) => {
      filterUpdateFn(newFilters);
    },
    [filterUpdateFn]
  );

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

  // SMART sort is now handled server-side in get-restaurants (two-step via restaurant_rating_summary).
  // No client-side authentic stats fetch needed.

  const displayedRestaurants = useMemo(() => {
    let list = restaurants;

    // Attach preference stats for MY_PREFERENCE sort (client-side enrichment)
    if (filters.sortOption === 'MY_PREFERENCE') {
      list = list.map((r) => ({
        ...r,
        searchPalateStats: preferenceStats[r.id] || r.searchPalateStats || { avg: 0, count: 0 },
      }));
    }

    // Price filter — kept client-side until price_range_id mapping is wired server-side
    if (filters.price) {
      list = list.filter((r) => {
        const price = (r.priceRange || '').toLowerCase();
        return price.includes(filters.price!.toLowerCase());
      });
    }

    // Address keyword filter (typed address search, not location picker)
    if (searchAddress && searchAddress.trim()) {
      list = list.filter((restaurant) => restaurantService.calculateLocationRelevance(restaurant, searchAddress) > 0);
    }

    // Location, cuisine, palate, and rating filtering are now handled server-side in fetchRestaurants.
    // SMART / DESC / ASC / NEWEST data arrives pre-sorted from the API.
    // MY_PREFERENCE is the only option still sorted client-side.
    return sortRestaurants(list, filters.sortOption, {
      locationKeyword: searchAddress,
    });
  }, [
    restaurants,
    preferenceStats,
    filters.price,
    filters.sortOption,
    searchAddress,
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
              canUsePreferenceSort={userPreferencePalates.length > 0}
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
