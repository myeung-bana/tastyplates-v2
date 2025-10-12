import { LocationOption, LOCATION_HIERARCHY } from '@/constants/location';
import { getBestAddress } from './addressUtils';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate {lat, lng}
 * @param coord2 Second coordinate {lat, lng}
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get parent country from city key
 * @param cityKey City key
 * @returns Parent country location or null
 */
export const getParentCountryFromCity = (cityKey: string): LocationOption | null => {
  for (const country of LOCATION_HIERARCHY.countries) {
    const city = country.cities.find(c => c.key === cityKey);
    if (city) {
      return {
        key: country.key,
        label: country.label,
        shortLabel: country.shortLabel,
        flag: country.flag,
        currency: country.currency,
        timezone: country.timezone,
        type: 'country'
      };
    }
  }
  return null;
};

/**
 * Enhanced address matching with fuzzy logic
 * @param address Full address string
 * @param locationName Location name to match
 * @param threshold Minimum match threshold (0-1)
 * @returns True if location matches in address
 */
export const matchesLocationInAddress = (
  address: string,
  locationName: string,
  threshold: number = 0.7
): boolean => {
  const addressLower = address.toLowerCase();
  const locationLower = locationName.toLowerCase();
  
  // Exact match
  if (addressLower.includes(locationLower)) return true;
  
  // Partial match with word boundaries
  const words = locationLower.split(' ');
  return words.some(word => 
    word.length > 2 && addressLower.includes(word)
  );
};

/**
 * Apply enhanced location-based filtering to restaurants with multiple strategies
 * @param restaurants Array of restaurant objects
 * @param selectedLocation The selected location (city or country)
 * @param radiusKm Radius in kilometers for city-based filtering (default: 100km)
 * @returns Filtered array of restaurants
 */
export const applyLocationFilter = (
  restaurants: any[],
  selectedLocation: LocationOption,
  radiusKm: number = 100
): any[] => {
  if (selectedLocation.type === 'city') {
    return restaurants.filter(restaurant => {
      // Strategy 1: Coordinate-based filtering (within radius)
      if (selectedLocation.coordinates && 
          restaurant.listingDetails?.googleMapUrl?.latitude && 
          restaurant.listingDetails?.googleMapUrl?.longitude) {
        
        const restaurantCoords = {
          lat: parseFloat(restaurant.listingDetails.googleMapUrl.latitude),
          lng: parseFloat(restaurant.listingDetails.googleMapUrl.longitude)
        };
        
        const distance = calculateDistance(selectedLocation.coordinates!, restaurantCoords);
        if (distance <= radiusKm) {
          return true;
        }
      }
      
      // Strategy 2: City name matching (fuzzy)
      const restaurantCity = restaurant.listingDetails?.googleMapUrl?.city?.toLowerCase();
      const selectedCity = selectedLocation.label.toLowerCase();
      
      if (restaurantCity && (
        restaurantCity === selectedCity ||
        restaurantCity.includes(selectedCity) ||
        selectedCity.includes(restaurantCity)
      )) {
        return true;
      }
      
      // Strategy 3: Address string matching
      const fullAddress = getBestAddress(
        restaurant.listingDetails?.googleMapUrl,
        restaurant.streetAddress,
        ''
      ).toLowerCase();
      
      if (fullAddress.includes(selectedCity)) {
        return true;
      }
      
      // Strategy 4: Parent country fallback
      const parentCountry = getParentCountryFromCity(selectedLocation.key);
      if (parentCountry && restaurant.listingDetails?.googleMapUrl?.countryShort === parentCountry.shortLabel) {
        return true;
      }
      
      return false;
    });
  } else if (selectedLocation.type === 'country') {
    return restaurants.filter(restaurant => {
      // Strategy 1: Exact country code match
      if (restaurant.listingDetails?.googleMapUrl?.countryShort === selectedLocation.shortLabel) {
        return true;
      }
      
      // Strategy 2: Country name matching (fuzzy)
      const restaurantCountry = restaurant.listingDetails?.googleMapUrl?.country?.toLowerCase();
      const selectedCountry = selectedLocation.label.toLowerCase();
      
      if (restaurantCountry && (
        restaurantCountry === selectedCountry ||
        restaurantCountry.includes(selectedCountry) ||
        selectedCountry.includes(restaurantCountry)
      )) {
        return true;
      }
      
      // Strategy 3: Address string matching
      const fullAddress = getBestAddress(
        restaurant.listingDetails?.googleMapUrl,
        restaurant.streetAddress,
        ''
      ).toLowerCase();
      
      if (fullAddress.includes(selectedCountry)) {
        return true;
      }
      
      return false;
    });
  }
  
  return restaurants;
};

/**
 * Get enhanced location relevance score for a restaurant
 * @param restaurant Restaurant object
 * @param selectedLocation Selected location
 * @returns Relevance score (0-1, where 1 is most relevant)
 */
export const getLocationRelevance = (
  restaurant: any,
  selectedLocation: LocationOption
): number => {
  let score = 0;
  
  if (selectedLocation.type === 'city') {
    // Exact coordinate match (highest score)
    if (selectedLocation.coordinates && 
        restaurant.listingDetails?.googleMapUrl?.latitude && 
        restaurant.listingDetails?.googleMapUrl?.longitude) {
      
      const restaurantCoords = {
        lat: parseFloat(restaurant.listingDetails.googleMapUrl.latitude),
        lng: parseFloat(restaurant.listingDetails.googleMapUrl.longitude)
      };
      
      const distance = calculateDistance(selectedLocation.coordinates!, restaurantCoords);
      
      if (distance <= 10) score = 1.0;
      else if (distance <= 50) score = 0.8;
      else if (distance <= 100) score = 0.6;
      else if (distance <= 200) score = 0.4;
    }
    
    // City name exact match
    const restaurantCity = restaurant.listingDetails?.googleMapUrl?.city?.toLowerCase();
    const selectedCity = selectedLocation.label.toLowerCase();
    
    if (restaurantCity === selectedCity) {
      score = Math.max(score, 0.9);
    } else if (restaurantCity && restaurantCity.includes(selectedCity)) {
      score = Math.max(score, 0.7);
    }
    
    // Address contains city
    const fullAddress = getBestAddress(
      restaurant.listingDetails?.googleMapUrl,
      restaurant.streetAddress,
      ''
    ).toLowerCase();
    
    if (fullAddress.includes(selectedCity)) {
      score = Math.max(score, 0.5);
    }
    
  } else if (selectedLocation.type === 'country') {
    // Exact country code match
    if (restaurant.listingDetails?.googleMapUrl?.countryShort === selectedLocation.shortLabel) {
      score = 1.0;
    }
    
    // Country name match
    const restaurantCountry = restaurant.listingDetails?.googleMapUrl?.country?.toLowerCase();
    const selectedCountry = selectedLocation.label.toLowerCase();
    
    if (restaurantCountry === selectedCountry) {
      score = Math.max(score, 0.9);
    } else if (restaurantCountry && restaurantCountry.includes(selectedCountry)) {
      score = Math.max(score, 0.7);
    }
    
    // Address contains country
    const fullAddress = getBestAddress(
      restaurant.listingDetails?.googleMapUrl,
      restaurant.streetAddress,
      ''
    ).toLowerCase();
    
    if (fullAddress.includes(selectedCountry)) {
      score = Math.max(score, 0.5);
    }
  }
  
  return score;
};

/**
 * Sort restaurants by location relevance
 * @param restaurants Array of restaurant objects
 * @param selectedLocation Selected location
 * @returns Sorted array of restaurants
 */
export const sortByLocationRelevance = (
  restaurants: any[],
  selectedLocation: LocationOption
): any[] => {
  return restaurants.sort((a, b) => {
    const relevanceA = getLocationRelevance(a, selectedLocation);
    const relevanceB = getLocationRelevance(b, selectedLocation);
    return relevanceB - relevanceA;
  });
};


/**
 * Check if a location is within a certain radius of another location
 * @param location1 First location
 * @param location2 Second location
 * @param radiusKm Radius in kilometers
 * @returns True if within radius
 */
export const isWithinRadius = (
  location1: { lat: number; lng: number },
  location2: { lat: number; lng: number },
  radiusKm: number
): boolean => {
  const distance = calculateDistance(location1, location2);
  return distance <= radiusKm;
};
