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
  console.log('🔍 applyLocationFilter called with:', {
    restaurantCount: restaurants.length,
    selectedLocation: selectedLocation.label,
    locationType: selectedLocation.type,
    locationKey: selectedLocation.key
  });
  
  // Special case: If a Hong Kong city is selected, search entire Hong Kong region
  const isHongKongCity = selectedLocation.type === 'city' && 
                         (selectedLocation.key === 'hong_kong_island' || 
                          selectedLocation.key === 'kowloon' ||
                          selectedLocation.key === 'new_territories');
  
  if (isHongKongCity) {
    console.log('🇭🇰 Hong Kong city filter activated');
    // Treat as Hong Kong country-wide search
    const filtered = restaurants.filter((restaurant, index) => {
      // Log first 3 restaurants for debugging
      if (index < 3) {
        console.log(`Restaurant ${index}:`, {
          name: restaurant.name,
          hasGoogleMapUrl: !!restaurant.googleMapUrl,
          countryShort: restaurant.googleMapUrl?.countryShort,
          city: restaurant.googleMapUrl?.city,
          state: restaurant.googleMapUrl?.state,
          country: restaurant.googleMapUrl?.country,
          streetAddress: restaurant.streetAddress
        });
      }
      
      // Strategy 1: Match by Hong Kong country code
      if (restaurant.googleMapUrl?.countryShort === 'HK') {
        if (index < 3) console.log(`  ✅ Restaurant ${index} matched by country code`);
        return true;
      }
      
      // Strategy 2: Match by address containing "Hong Kong" or districts
      const fullAddress = getBestAddress(
        restaurant.googleMapUrl,
        restaurant.streetAddress,
        ''
      ).toLowerCase();
      
      if (index < 3) console.log(`  Address for restaurant ${index}:`, fullAddress);
      
      if (fullAddress.includes('hong kong') || 
          fullAddress.includes('hongkong') ||
          fullAddress.includes('new territories') ||
          fullAddress.includes('new_territories') ||
          fullAddress.includes('kowloon') ||
          fullAddress.includes('hong kong island')) {
        if (index < 3) console.log(`  ✅ Restaurant ${index} matched by address`);
        return true;
      }
      
      // Strategy 3: City name matching for any Hong Kong district
      const restaurantCity = restaurant.googleMapUrl?.city?.toLowerCase() || '';
      if (restaurantCity && (
        restaurantCity.includes('hong kong') ||
        restaurantCity.includes('hongkong') ||
        restaurantCity.includes('kowloon') ||
        restaurantCity.includes('territories') ||
        restaurantCity.includes('island')
      )) {
        if (index < 3) console.log(`  ✅ Restaurant ${index} matched by city:`, restaurantCity);
        return true;
      }
      
      // Strategy 4: State/Province matching (New Territories might be in state field)
      const restaurantState = (restaurant.googleMapUrl?.state?.toLowerCase() || 
                               restaurant.googleMapUrl?.stateShort?.toLowerCase() || '');
      if (restaurantState && (
        restaurantState.includes('new territories') ||
        restaurantState.includes('new_territories') ||
        restaurantState.includes('territories') ||
        restaurantState.includes('hong kong') ||
        restaurantState.includes('hongkong') ||
        restaurantState.includes('kowloon')
      )) {
        if (index < 3) console.log(`  ✅ Restaurant ${index} matched by state:`, restaurantState);
        return true;
      }
      
      if (index < 3) console.log(`  ❌ Restaurant ${index} no match`);
      return false;
    });
    console.log(`🇭🇰 Hong Kong filter result: ${filtered.length} restaurants`);
    return filtered;
  }
  
  if (selectedLocation.type === 'city') {
    return restaurants.filter(restaurant => {
      // Strategy 1: Coordinate-based filtering (within radius)
      if (selectedLocation.coordinates && 
          restaurant.googleMapUrl?.latitude && 
          restaurant.googleMapUrl?.longitude) {
        
        const restaurantCoords = {
          lat: parseFloat(restaurant.googleMapUrl.latitude),
          lng: parseFloat(restaurant.googleMapUrl.longitude)
        };
        
        const distance = calculateDistance(selectedLocation.coordinates!, restaurantCoords);
        if (distance <= radiusKm) {
          return true;
        }
      }
      
      // Strategy 2: City name matching (fuzzy)
      const restaurantCity = restaurant.googleMapUrl?.city?.toLowerCase();
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
        restaurant.googleMapUrl,
        restaurant.streetAddress,
        ''
      ).toLowerCase();
      
      if (fullAddress.includes(selectedCity)) {
        return true;
      }
      
      // Strategy 4: Parent country fallback
      const parentCountry = getParentCountryFromCity(selectedLocation.key);
      if (parentCountry && restaurant.googleMapUrl?.countryShort === parentCountry.shortLabel) {
        return true;
      }
      
      return false;
    });
  } else if (selectedLocation.type === 'country') {
    // Special case: Enhanced matching for Hong Kong country
    const isHongKongCountry = selectedLocation.key === 'hongkong';
    
    if (isHongKongCountry) {
      console.log('🇭🇰 Hong Kong country filter activated');
    }
    
    const filtered = restaurants.filter((restaurant, index) => {
      // Log first 3 restaurants for Hong Kong
      if (isHongKongCountry && index < 3) {
        console.log(`Restaurant ${index}:`, {
          name: restaurant.name,
          hasGoogleMapUrl: !!restaurant.googleMapUrl,
          countryShort: restaurant.googleMapUrl?.countryShort,
          country: restaurant.googleMapUrl?.country,
          city: restaurant.googleMapUrl?.city,
          state: restaurant.googleMapUrl?.state,
          streetAddress: restaurant.streetAddress
        });
      }
      
      // Strategy 1: Exact country code match
      if (restaurant.googleMapUrl?.countryShort === selectedLocation.shortLabel) {
        if (isHongKongCountry && index < 3) console.log(`  ✅ Restaurant ${index} matched by country code`);
        return true;
      }
      
      // Strategy 2: Country name matching (fuzzy)
      const restaurantCountry = restaurant.googleMapUrl?.country?.toLowerCase();
      const selectedCountry = selectedLocation.label.toLowerCase();
      
      if (restaurantCountry && (
        restaurantCountry === selectedCountry ||
        restaurantCountry.includes(selectedCountry) ||
        selectedCountry.includes(restaurantCountry)
      )) {
        if (isHongKongCountry && index < 3) console.log(`  ✅ Restaurant ${index} matched by country name:`, restaurantCountry);
        return true;
      }
      
      // Strategy 3: Address string matching
      const fullAddress = getBestAddress(
        restaurant.googleMapUrl,
        restaurant.streetAddress,
        ''
      ).toLowerCase();
      
      if (isHongKongCountry && index < 3) console.log(`  Address:`, fullAddress);
      
      if (fullAddress.includes(selectedCountry)) {
        if (isHongKongCountry && index < 3) console.log(`  ✅ Restaurant ${index} matched by address containing country`);
        return true;
      }
      
      // Strategy 4: For Hong Kong, check all districts in address
      if (isHongKongCountry) {
        if (fullAddress.includes('hong kong') || 
            fullAddress.includes('hongkong') ||
            fullAddress.includes('new territories') ||
            fullAddress.includes('new_territories') ||
            fullAddress.includes('kowloon') ||
            fullAddress.includes('hong kong island')) {
          if (index < 3) console.log(`  ✅ Restaurant ${index} matched by HK district in address`);
          return true;
        }
        
        // Check city field for Hong Kong districts
        const restaurantCity = restaurant.googleMapUrl?.city?.toLowerCase() || '';
        if (restaurantCity && (
          restaurantCity.includes('hong kong') ||
          restaurantCity.includes('hongkong') ||
          restaurantCity.includes('kowloon') ||
          restaurantCity.includes('territories') ||
          restaurantCity.includes('island')
        )) {
          if (index < 3) console.log(`  ✅ Restaurant ${index} matched by HK city:`, restaurantCity);
          return true;
        }
        
        // Check state field for Hong Kong districts
        const restaurantState = (restaurant.googleMapUrl?.state?.toLowerCase() || 
                                 restaurant.googleMapUrl?.stateShort?.toLowerCase() || '');
        if (restaurantState && (
          restaurantState.includes('new territories') ||
          restaurantState.includes('new_territories') ||
          restaurantState.includes('territories') ||
          restaurantState.includes('hong kong') ||
          restaurantState.includes('hongkong') ||
          restaurantState.includes('kowloon')
        )) {
          if (index < 3) console.log(`  ✅ Restaurant ${index} matched by HK state:`, restaurantState);
          return true;
        }
        
        if (index < 3) console.log(`  ❌ Restaurant ${index} no match`);
      }
      
      return false;
    });
    
    if (isHongKongCountry) {
      console.log(`🇭🇰 Hong Kong country filter result: ${filtered.length} restaurants`);
    }
    
    return filtered;
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
        restaurant.googleMapUrl?.latitude && 
        restaurant.googleMapUrl?.longitude) {
      
      const restaurantCoords = {
        lat: parseFloat(restaurant.googleMapUrl.latitude),
        lng: parseFloat(restaurant.googleMapUrl.longitude)
      };
      
      const distance = calculateDistance(selectedLocation.coordinates!, restaurantCoords);
      
      if (distance <= 10) score = 1.0;
      else if (distance <= 50) score = 0.8;
      else if (distance <= 100) score = 0.6;
      else if (distance <= 200) score = 0.4;
    }
    
    // City name exact match
    const restaurantCity = restaurant.googleMapUrl?.city?.toLowerCase();
    const selectedCity = selectedLocation.label.toLowerCase();
    
    if (restaurantCity === selectedCity) {
      score = Math.max(score, 0.9);
    } else if (restaurantCity && restaurantCity.includes(selectedCity)) {
      score = Math.max(score, 0.7);
    }
    
    // Address contains city
    const fullAddress = getBestAddress(
      restaurant.googleMapUrl,
      restaurant.streetAddress,
      ''
    ).toLowerCase();
    
    if (fullAddress.includes(selectedCity)) {
      score = Math.max(score, 0.5);
    }
    
  } else if (selectedLocation.type === 'country') {
    // Exact country code match
    if (restaurant.googleMapUrl?.countryShort === selectedLocation.shortLabel) {
      score = 1.0;
    }
    
    // Country name match
    const restaurantCountry = restaurant.googleMapUrl?.country?.toLowerCase();
    const selectedCountry = selectedLocation.label.toLowerCase();
    
    if (restaurantCountry === selectedCountry) {
      score = Math.max(score, 0.9);
    } else if (restaurantCountry && restaurantCountry.includes(selectedCountry)) {
      score = Math.max(score, 0.7);
    }
    
    // Address contains country
    const fullAddress = getBestAddress(
      restaurant.googleMapUrl,
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
