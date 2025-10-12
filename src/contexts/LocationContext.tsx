"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LOCATIONS, DEFAULT_LOCATION, LOCATION_STORAGE_KEY, LocationOption } from '@/constants/location';
import Cookies from 'js-cookie';

interface LocationContextType {
  selectedLocation: LocationOption;
  setSelectedLocation: (location: LocationOption) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocationState] = useState<LocationOption>(
    SUPPORTED_LOCATIONS.find(loc => loc.key === DEFAULT_LOCATION) || SUPPORTED_LOCATIONS[0] || {
      key: 'toronto',
      label: 'Toronto',
      shortLabel: 'TO',
      flag: 'https://flagcdn.com/ca.svg',
      currency: 'CAD',
      timezone: 'America/Toronto',
      type: 'city',
      parentKey: 'canada',
      coordinates: { lat: 43.6532, lng: -79.3832 }
    }
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load location from localStorage or cookies
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    const cookieLocation = Cookies.get('tastyplates_location');
    
    const locationKey = savedLocation || cookieLocation || DEFAULT_LOCATION;
    const location = SUPPORTED_LOCATIONS.find(loc => loc.key === locationKey);
    
    if (location) {
      setSelectedLocationState(location);
    }
    
    setIsLoading(false);
  }, []);

  const setSelectedLocation = (location: LocationOption) => {
    setSelectedLocationState(location);
    localStorage.setItem(LOCATION_STORAGE_KEY, location.key);
    Cookies.set('tastyplates_location', location.key, { expires: 365 }); // 1 year
  };

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
