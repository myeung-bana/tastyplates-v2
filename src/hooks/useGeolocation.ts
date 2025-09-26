"use client";
import { useState, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<GeolocationPosition | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Use Google Maps Geocoding API if available
      if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        
        return new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              const address = results[0];
              
              // Extract city, state, and country for better matching
              const locationParts = [];
              
              // Try to get city
              const cityComponent = address.address_components?.find(component => 
                component.types.includes('locality') || component.types.includes('administrative_area_level_2')
              );
              if (cityComponent) {
                locationParts.push(cityComponent.long_name);
              }
              
              // Try to get state/province
              const stateComponent = address.address_components?.find(component => 
                component.types.includes('administrative_area_level_1')
              );
              if (stateComponent) {
                locationParts.push(stateComponent.long_name);
              }
              
              // Try to get country
              const countryComponent = address.address_components?.find(component => 
                component.types.includes('country')
              );
              if (countryComponent) {
                locationParts.push(countryComponent.long_name);
              }
              
              // Return the most relevant location keyword (usually city)
              const locationKeyword = locationParts[0] || address.formatted_address;
              resolve(locationKeyword);
            } else {
              reject(new Error('Geocoding failed'));
            }
          });
        });
      } else {
        // Fallback: Use a simple reverse geocoding service
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        const data = await response.json();
        
        if (data.locality) {
          return data.locality;
        } else if (data.principalSubdivision) {
          return data.principalSubdivision;
        } else if (data.countryName) {
          return data.countryName;
        } else {
          return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }),
          (err: GeolocationError) => {
            let errorMessage = "Unable to retrieve your location";
            
            switch (err.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = "Location access denied by user";
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = "Location information unavailable";
                break;
              case 3: // TIMEOUT
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

      setCoordinates(position);
      
      // Reverse geocode to get location keywords
      const locationKeywords = await reverseGeocode(position.latitude, position.longitude);
      setLocation(locationKeywords);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to detect location";
      setError(errorMessage);
      console.error('Geolocation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [reverseGeocode]);

  const clearLocation = useCallback(() => {
    setLocation("");
    setCoordinates(null);
    setError(null);
  }, []);

  return {
    location,
    coordinates,
    isLoading,
    error,
    detectLocation,
    clearLocation,
    setLocation // Allow manual override
  };
};
