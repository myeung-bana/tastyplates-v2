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
 * Format address in a multi-line format for better readability
 * @param googleMapUrl - GoogleMapUrl object with address components
 * @returns Formatted multi-line address or single line fallback
 */
export function formatAddressMultiLine(
  googleMapUrl: GoogleMapUrl | null
): string {
  if (!googleMapUrl) return '';
  
  const lines: string[] = [];
  
  // Line 1: Street address
  if (googleMapUrl.streetAddress?.trim()) {
    lines.push(googleMapUrl.streetAddress.trim());
  } else if (googleMapUrl.streetNumber || googleMapUrl.streetName) {
    const street = [googleMapUrl.streetNumber, googleMapUrl.streetName]
      .filter(Boolean)
      .join(' ');
    if (street) lines.push(street);
  }
  
  // Line 2: City, State, Postal Code
  const cityStateParts = [
    googleMapUrl.city,
    googleMapUrl.stateShort || googleMapUrl.state,
    googleMapUrl.postCode
  ].filter(Boolean);
  
  if (cityStateParts.length > 0) {
    lines.push(cityStateParts.join(', '));
  }
  
  // Line 3: Country
  if (googleMapUrl.country?.trim()) {
    lines.push(googleMapUrl.country.trim());
  } else if (googleMapUrl.countryShort?.trim()) {
    lines.push(googleMapUrl.countryShort.trim());
  }
  
  return lines.join('\n');
}

/**
 * Format address in a single line format
 * @param googleMapUrl - GoogleMapUrl object with address components
 * @returns Formatted single-line address
 */
export function formatAddressSingleLine(
  googleMapUrl: GoogleMapUrl | null
): string {
  if (!googleMapUrl) return '';
  
  const parts: string[] = [];
  
  // Street address
  if (googleMapUrl.streetAddress?.trim()) {
    parts.push(googleMapUrl.streetAddress.trim());
  } else if (googleMapUrl.streetNumber || googleMapUrl.streetName) {
    const street = [googleMapUrl.streetNumber, googleMapUrl.streetName]
      .filter(Boolean)
      .join(' ');
    if (street) parts.push(street);
  }
  
  // City, State, Postal Code
  const cityStateParts = [
    googleMapUrl.city,
    googleMapUrl.stateShort || googleMapUrl.state,
    googleMapUrl.postCode
  ].filter(Boolean);
  
  if (cityStateParts.length > 0) {
    parts.push(cityStateParts.join(', '));
  }
  
  // Country
  if (googleMapUrl.country?.trim()) {
    parts.push(googleMapUrl.country.trim());
  } else if (googleMapUrl.countryShort?.trim()) {
    parts.push(googleMapUrl.countryShort.trim());
  }
  
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
  const composedAddress = formatAddress(googleMapUrl || null, { fallbackText: '' });
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

/**
 * Get city and country for restaurant cards
 * Unified format: "City, CountryCode" or "District, CountryCode" for Hong Kong
 * @param googleMapUrl - GoogleMapUrl object
 * @param fallbackText - Default text if no city/country available
 * @returns City, CountryCode format or fallback text
 */
export function getCityCountry(
  googleMapUrl?: GoogleMapUrl | null,
  fallbackText: string = 'Location not available'
): string {
  if (!googleMapUrl) return fallbackText;
  
  // Always use country code (countryShort) instead of full country name
  const countryCode = googleMapUrl.countryShort?.trim();
  
  // Get city/district name
  const city = googleMapUrl.city?.trim();
  
  // For Hong Kong: Keep district names (Kowloon, Hong Kong Island, New Territories)
  // Show as "District, HK"
  if (countryCode === 'HK' && city) {
    return `${city}, ${countryCode}`;
  }
  
  // Standard format: "City, CountryCode"
  if (city && countryCode) {
    return `${city}, ${countryCode}`;
  }
  
  // Fallback: If only city is available
  if (city) {
    return city;
  }
  
  // Fallback: If only country code is available
  if (countryCode) {
    return countryCode;
  }
  
  // Final fallback
  return fallbackText;
}
