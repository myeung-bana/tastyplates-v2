// services/geolocation/geolocationService.ts

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  city?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
  locationKeyword: string;
}

export class GeolocationService {
  /**
   * Reverse geocode coordinates to get location information
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
    try {
      // Use Google Maps Geocoding API if available
      if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
        return this.reverseGeocodeWithGoogle(lat, lng);
      } else {
        // Fallback: Use a free reverse geocoding service
        return this.reverseGeocodeWithFallback(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        locationKeyword: `${lat.toFixed(2)}, ${lng.toFixed(2)}`
      };
    }
  }

  /**
   * Use Google Maps API for reverse geocoding
   */
  private async reverseGeocodeWithGoogle(lat: number, lng: number): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const address = results[0];
          const components = address.address_components || [];
          
          // Extract location components
          const city = components.find(component => 
            component.types.includes('locality') || 
            component.types.includes('administrative_area_level_2')
          )?.long_name;
          
          const state = components.find(component => 
            component.types.includes('administrative_area_level_1')
          )?.long_name;
          
          const country = components.find(component => 
            component.types.includes('country')
          )?.long_name;
          
          // Determine the best location keyword for restaurant matching
          const locationKeyword = this.getBestLocationKeyword(city, state, country);
          
          resolve({
            city,
            state,
            country,
            formattedAddress: address.formatted_address,
            locationKeyword
          });
        } else {
          reject(new Error('Google Maps geocoding failed'));
        }
      });
    });
  }

  /**
   * Use fallback service for reverse geocoding
   */
  private async reverseGeocodeWithFallback(lat: number, lng: number): Promise<LocationInfo> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      const locationKeyword = this.getBestLocationKeyword(
        data.locality,
        data.principalSubdivision,
        data.countryName
      );
      
      return {
        city: data.locality,
        state: data.principalSubdivision,
        country: data.countryName,
        formattedAddress: data.localityInfo?.administrative?.[0]?.name || data.locality,
        locationKeyword
      };
    } catch (error) {
      console.error('Fallback geocoding error:', error);
      return {
        locationKeyword: `${lat.toFixed(2)}, ${lng.toFixed(2)}`
      };
    }
  }

  /**
   * Determine the best location keyword for restaurant matching
   * Priority: City > State > Country
   */
  private getBestLocationKeyword(city?: string, state?: string, country?: string): string {
    if (city) return city;
    if (state) return state;
    if (country) return country;
    return 'Unknown Location';
  }

  /**
   * Check if geolocation is supported by the browser
   */
  isGeolocationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Get current position with error handling
   */
  async getCurrentPosition(): Promise<GeolocationCoordinates> {
    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        (error) => {
          let errorMessage = "Unable to retrieve your location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}
