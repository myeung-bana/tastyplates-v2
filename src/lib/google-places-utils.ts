// google-places-utils.ts - Utilities for working with Google Places API

import { GoogleMapUrl } from '@/utils/addressUtils';

export interface RestaurantPlaceData {
  name: string;
  phone?: string;
  website?: string;
  formatted_address?: string;
  place_id?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  photos?: Array<{
    getUrl: (options?: { maxWidth?: number; maxHeight?: number }) => string;
  }>;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text?: string[];
  };
}

/**
 * Fetch full place details from Google Places API using place_id
 * @param placeId - Google Place ID
 * @returns RestaurantPlaceData or null if error
 */
export async function fetchPlaceDetails(placeId: string): Promise<RestaurantPlaceData | null> {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps API not loaded');
    return null;
  }

  return new Promise((resolve) => {
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    placesService.getDetails(
      {
        placeId,
        fields: [
          'name',
          'formatted_address',
          'place_id',
          'geometry',
          'address_components',
          'formatted_phone_number',
          'international_phone_number',
          'website',
          'photos',
          'rating',
          'user_ratings_total',
          // Removed 'opening_hours' to eliminate deprecation warning about 'open_now'
        ],
      },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            name: place.name || '',
            phone: place.formatted_phone_number || place.international_phone_number || '',
            website: place.website || '',
            formatted_address: place.formatted_address || '',
            place_id: place.place_id || placeId,
            geometry: place.geometry,
            address_components: place.address_components || [],
            photos: place.photos || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            // Removed opening_hours from response to eliminate deprecation warning
          });
        } else {
          console.error('Error fetching place details:', status);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Format Google address components to our GoogleMapUrl structure
 * @param addressComponents - Array of address components from Google Places
 * @returns GoogleMapUrl object
 */
export function formatAddressComponents(
  addressComponents: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>
): GoogleMapUrl {
  const address: GoogleMapUrl = {};

  addressComponents.forEach((component) => {
    const types = component.types;

    if (types.includes('street_number')) {
      address.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      address.streetName = component.long_name;
    }
    if (types.includes('locality')) {
      address.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      address.state = component.long_name;
      address.stateShort = component.short_name;
    }
    if (types.includes('country')) {
      address.country = component.long_name;
      address.countryShort = component.short_name;
    }
    if (types.includes('postal_code')) {
      address.postCode = component.long_name;
    }
  });

  // Build street address from components
  const streetParts = [address.streetNumber, address.streetName].filter(Boolean);
  if (streetParts.length > 0) {
    address.streetAddress = streetParts.join(' ');
  }

  return address;
}

/**
 * Get photo URL from Google Places photo
 * @param photo - Google Places photo object
 * @param maxWidth - Maximum width (default: 400)
 * @returns Photo URL or null
 */
export function getPhotoUrl(
  photo: { getUrl: (options?: { maxWidth?: number; maxHeight?: number }) => string } | null,
  maxWidth: number = 400
): string | null {
  if (!photo) return null;
  try {
    return photo.getUrl({ maxWidth });
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return null;
  }
}
