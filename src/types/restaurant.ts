// Centralized Restaurant Type Definitions
// This file consolidates all restaurant-related types from across the codebase

import * as React from "react"

/**
 * Google Maps URL structure for restaurant addresses
 */
export interface GoogleMapUrl {
  city?: string
  country?: string
  countryShort?: string
  streetAddress?: string
  streetNumber?: string
  streetName?: string
  state?: string
  stateShort?: string
  postCode?: string
  latitude?: string
  longitude?: string
  placeId?: string
  zoom?: number
}

/**
 * Main Restaurant interface for component usage
 * Used in RestaurantCard, Restaurant components, etc.
 */
export interface Restaurant {
  id: string
  databaseId: number
  slug: string
  name: string
  image: string
  rating: number
  countries: string
  priceRange: string
  averageRating?: number
  ratingsCount?: number
  status?: string
  palatesNames?: string[]
  streetAddress?: string
  googleMapUrl?: GoogleMapUrl
  listingCategories?: {
    id: number
    name: string
    slug: string
  }[]
  categories?: {
    id: number
    name: string
    slug: string
    parent_id?: number | null
  }[]
  initialSavedStatus?: boolean | null
  recognitions?: string[]
  recognitionCount?: number
  searchPalateStats?: {
    avg: number
    count: number
  }
}

/**
 * Restaurant Card Component Props
 */
export interface RestaurantCardProps extends React.ComponentProps<"div"> {
  restaurant: Restaurant
  profileTablist?: 'listings' | 'wishlists' | 'checkin'
  initialSavedStatus?: boolean | null
  ratingsCount?: number
  onWishlistChange?: (restaurant: Restaurant, isSaved: boolean) => void
  onClick?: () => void
}

/**
 * Listing interface (WordPress/GraphQL format)
 * Used for restaurant listings from WordPress API
 */
export interface Listing {
  id: string
  title: string
  slug: string
  content: string
  listingStreet: string
  priceRange: string
  averageRating: number
  status: string
  palates: {
    nodes: {
      name: string
    }[]
  }
  databaseId?: number
  listingDetails: {
    googleMapUrl: GoogleMapUrl
    latitude: string
    longitude: string
    menuUrl: string
    openingHours: string
    phone: string
  }
  featuredImage?: {
    node: {
      sourceUrl: string
    }
  }
  imageGallery?: string[]
  listingCategories: {
    nodes: {
      id: number
      name: string
      slug: string
    }[]
  }
  countries: {
    nodes: { name: string }[]
  }
  cuisines?: string[]
  isFavorite?: boolean
  ratingsCount?: number
  searchPalateStats?: {
    avg: number
    count: number
  }
  restaurant_price_range?: {
    id: number
    display_name: string
    name: string
    symbol?: string
    slug: string
  }
  price_range_id?: number
}

/**
 * GraphQL Response Types for Listings
 */
export interface GetListingsData {
  listings: {
    nodes: Listing[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
    }
  }
}

export interface GetListingBySlugData {
  listing: Listing | null
}

/**
 * Favorite/Check-in Action Types
 */
export interface FavoriteListingData {
  restaurant_slug: string
  action: string
}

export interface CheckInData {
  restaurant_slug: string
  action: string
}

/**
 * Restaurant Category/Taxonomy Types
 */
export interface RestaurantCategory {
  id: number
  name: string
  slug: string
}

export interface RestaurantCuisine {
  id: number
  name: string
  slug: string
}

export interface RestaurantPalate {
  id: number
  name: string
  slug: string
}

/**
 * Price Range Type
 */
export interface RestaurantPriceRange {
  id: number
  display_name: string
  name: string
  symbol?: string
  slug: string
}

/**
 * Search/Filter Related Types
 */
export interface SearchPalateStats {
  avg: number
  count: number
}

/**
 * Component-specific Restaurant Types
 * For components that need a simplified restaurant structure
 */
export interface SimpleRestaurant {
  id: string
  slug: string
  name: string
  image: string
  rating: number
  priceRange: string
}
