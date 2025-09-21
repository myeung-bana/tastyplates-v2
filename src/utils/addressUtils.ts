export interface GoogleMapUrl {
  streetAddress?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  stateShort?: string;
  country?: string;
  countryShort?: string;
  postCode?: string;
  latitude?: string;
  longitude?: string;
  placeId?: string;
  zoom?: number;
}

/**
 * Format address from GoogleMapUrl components
 * Based on admin portal logic from documentation/restaurant-address.md
 * @param googleMapUrl - GoogleMapUrl object with address components
 * @param options - Formatting options
 * @returns Formatted address string
 */
export function formatAddress(
  googleMapUrl: GoogleMapUrl | null, 
  options: { fallbackText?: string } = {}
): string {
  if (!googleMapUrl) return options.fallbackText || '';
  
  // Priority 1: Use streetAddress if available (most complete)
  if (googleMapUrl.streetAddress && googleMapUrl.streetAddress.trim().length > 0) {
    return googleMapUrl.streetAddress;
  }
  
  // Priority 2: Compose from individual components
  const parts = [
    [googleMapUrl.streetNumber, googleMapUrl.streetName].filter(Boolean).join(' '),
    googleMapUrl.city,
    googleMapUrl.stateShort || googleMapUrl.state,
    googleMapUrl.countryShort || googleMapUrl.country,
    googleMapUrl.postCode
  ].filter(Boolean) as string[];
  
  return parts.join(', ');
}

/**
 * Get the best available address using priority logic from admin portal
 * Priority: streetAddress → composed address → listingStreet → fallback
 * @param googleMapUrl - GoogleMapUrl object
 * @param listingStreet - Fallback text field
 * @param fallbackText - Default text if no address available
 * @returns Best available address string
 */
export function getBestAddress(
  googleMapUrl?: GoogleMapUrl | null,
  listingStreet?: string | null,
  fallbackText: string = 'No address available'
): string {
  // Priority 1: Google Map URL street address
  if (googleMapUrl?.streetAddress?.trim()) {
    return googleMapUrl.streetAddress;
  }
  
  // Priority 2: Google Map URL composed address
  const composedAddress = formatAddress(googleMapUrl, { fallbackText: '' });
  if (composedAddress && composedAddress !== 'No address available') {
    return composedAddress;
  }
  
  // Priority 3: Simple listing street
  if (listingStreet?.trim()) {
    return listingStreet;
  }
  
  return fallbackText;
}

/**
 * Truncate address for display in cards
 * @param address - Full address string
 * @param maxLength - Maximum length before truncation
 * @returns Truncated address with ellipsis
 */
export function truncateAddress(address: string, maxLength: number = 50): string {
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength).trim() + '...';
}

/**
 * Get address for restaurant cards with proper truncation
 * @param googleMapUrl - GoogleMapUrl object
 * @param listingStreet - Fallback text field
 * @param maxLength - Maximum length for display
 * @returns Truncated address suitable for cards
 */
export function getCardAddress(
  googleMapUrl?: GoogleMapUrl | null,
  listingStreet?: string | null,
  maxLength: number = 60
): string {
  const address = getBestAddress(googleMapUrl, listingStreet, 'No address available');
  return truncateAddress(address, maxLength);
}
