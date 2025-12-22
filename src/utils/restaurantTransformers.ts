// restaurantTransformers.ts - Utilities to transform between Hasura and component formats

import { RestaurantV2 } from '@/app/api/v1/services/restaurantV2Service';
import { Listing } from '@/interfaces/restaurant/restaurant';
import { DEFAULT_RESTAURANT_IMAGE } from '@/constants/images';
import { getBestAddress } from '@/utils/addressUtils';

// Restaurant type for list view (matches component interface)
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

/**
 * Transform Hasura RestaurantV2 format to component Listing format
 */
export const transformRestaurantV2ToListing = (restaurant: RestaurantV2): Listing => {
  // Parse JSONB fields if they're strings
  const parseJsonb = (value: any): any => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const address = parseJsonb(restaurant.address);
  const openingHours = parseJsonb(restaurant.opening_hours);
  const cuisines = parseJsonb(restaurant.cuisines);
  const palates = parseJsonb(restaurant.palates);
  const uploadedImages = parseJsonb(restaurant.uploaded_images);

  // Ensure palates is always an array
  const palatesArray = Array.isArray(palates) ? palates : [];
  
  // Ensure cuisines is always an array
  const cuisinesArray = Array.isArray(cuisines) ? cuisines : [];

  // Normalize address object: convert snake_case to camelCase
  const normalizeAddress = (addr: any): any => {
    if (!addr || typeof addr !== 'object') return {};
    
    return {
      streetAddress: addr.street_address || addr.streetAddress,
      streetNumber: addr.street_number || addr.streetNumber,
      streetName: addr.street_name || addr.streetName,
      city: addr.city,
      state: addr.state,
      stateShort: addr.state_short || addr.stateShort,
      country: addr.country,
      countryShort: addr.country_short || addr.countryShort,
      postCode: addr.post_code || addr.postCode,
      latitude: addr.latitude?.toString() || restaurant.latitude?.toString() || '',
      longitude: addr.longitude?.toString() || restaurant.longitude?.toString() || '',
      placeId: addr.place_id || addr.placeId,
      zoom: addr.zoom || restaurant.google_zoom
    };
  };

  const normalizedAddress = normalizeAddress(address);

  return {
    id: restaurant.uuid, // Use UUID as ID for consistency
    slug: restaurant.slug,
    title: restaurant.title,
    content: restaurant.content || '',
    averageRating: restaurant.average_rating || 0,
    status: restaurant.status,
    listingStreet: restaurant.listing_street || '',
    priceRange: restaurant.restaurant_price_range?.display_name || '',
    databaseId: restaurant.id,
    palates: {
      nodes: palatesArray.map((p: any) => ({
        name: typeof p === 'string' ? p : (p.name || p.slug || String(p)),
        slug: typeof p === 'string' ? p.toLowerCase().replace(/\s+/g, '-') : (p.slug || p.name?.toLowerCase().replace(/\s+/g, '-') || '')
      }))
    },
    listingDetails: {
      googleMapUrl: normalizedAddress,
      phone: restaurant.phone || '',
      openingHours: openingHours ? JSON.stringify(openingHours) : '',
      menuUrl: restaurant.menu_url || '',
      latitude: restaurant.latitude?.toString() || normalizedAddress.latitude || '',
      longitude: restaurant.longitude?.toString() || normalizedAddress.longitude || ''
    },
    featuredImage: restaurant.featured_image_url ? {
      node: { sourceUrl: restaurant.featured_image_url }
    } : undefined,
    imageGallery: uploadedImages || [],
    listingCategories: {
      nodes: cuisinesArray.map((c: any) => ({
        name: typeof c === 'string' ? c : (c.name || c.slug || String(c)),
        slug: typeof c === 'string' ? c.toLowerCase().replace(/\s+/g, '-') : (c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '')
      }))
    },
    countries: {
      nodes: address?.country ? [{ name: address.country }] : []
    },
    ratingsCount: restaurant.ratings_count || 0,
    restaurant_price_range: restaurant.restaurant_price_range,
    price_range_id: restaurant.price_range_id
  } as Listing & { restaurant_price_range?: { display_name: string }; price_range_id?: number };
};

/**
 * Transform Hasura RestaurantV2 format to component Restaurant format (for list view)
 */
export const transformRestaurantV2ToRestaurant = (restaurant: RestaurantV2): Restaurant => {
  const parseJsonb = (value: any): any => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const palates = parseJsonb(restaurant.palates);
  const cuisines = parseJsonb(restaurant.cuisines);
  const categories = parseJsonb(restaurant.categories);
  const address = parseJsonb(restaurant.address);

  // Ensure palates is always an array
  const palatesArray = Array.isArray(palates) ? palates : [];
  
  // Ensure cuisines is always an array
  const cuisinesArray = Array.isArray(cuisines) ? cuisines : [];
  
  // Ensure categories is always an array
  const categoriesArray = Array.isArray(categories) ? categories : [];

  return {
    id: restaurant.uuid, // Use UUID as ID
    slug: restaurant.slug,
    name: restaurant.title,
    image: restaurant.featured_image_url || DEFAULT_RESTAURANT_IMAGE,
    rating: restaurant.average_rating || 0,
    databaseId: restaurant.id,
    palatesNames: palatesArray.map((p: any) => 
      typeof p === 'string' ? p : (p.name || p.slug || String(p))
    ),
    listingCategories: cuisinesArray.map((c: any) => ({
      id: typeof c === 'object' ? (c.id || 0) : 0,
      name: typeof c === 'string' ? c : (c.name || c.slug || String(c)),
      slug: typeof c === 'string' ? c.toLowerCase().replace(/\s+/g, '-') : (c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '')
    })),
    categories: categoriesArray.map((cat: any) => ({
      id: typeof cat === 'object' ? (cat.id || 0) : 0,
      name: typeof cat === 'string' ? cat : (cat.name || cat.slug || String(cat)),
      slug: typeof cat === 'string' ? cat.toLowerCase().replace(/\s+/g, '-') : (cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || ''),
      parent_id: typeof cat === 'object' ? (cat.parent_id ?? null) : null
    })),
    countries: address?.country || '',
    priceRange: restaurant.restaurant_price_range?.display_name || '',
    averageRating: restaurant.average_rating || 0,
    ratingsCount: restaurant.ratings_count || 0,
    streetAddress: restaurant.listing_street || '',
    googleMapUrl: address || {},
    // Note: searchPalateStats is not available in V2 API yet - will need to be calculated separately
    // This will be added in a future update when review data is integrated
    searchPalateStats: undefined
  };
};

/**
 * Helper to extract cuisine/palate arrays from JSONB format
 */
export const extractTaxonomyArray = (taxonomy: any): Array<{ id: number; name: string; slug: string }> => {
  if (!taxonomy) return [];
  
  if (Array.isArray(taxonomy)) {
    return taxonomy.map((item: any) => {
      if (typeof item === 'string') {
        return {
          id: 0, // ID not available from string
          name: item,
          slug: item.toLowerCase().replace(/\s+/g, '-')
        };
      }
      return {
        id: item.id || 0,
        name: item.name || item.slug || String(item),
        slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || ''
      };
    });
  }
  
  if (typeof taxonomy === 'string') {
    try {
      const parsed = JSON.parse(taxonomy);
      return extractTaxonomyArray(parsed);
    } catch {
      return [];
    }
  }
  
  return [];
};

