"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_LOCATION, LOCATION_STORAGE_KEY, LocationOption, CountryLocation } from '@/constants/location';
import { useLocations } from '@/hooks/useLocations';
import Cookies from 'js-cookie';

interface LocationContextType {
  selectedLocation: LocationOption;
  setSelectedLocation: (location: LocationOption) => void;
  locationHierarchy: { countries: CountryLocation[] };
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_SELECTED: LocationOption = {
  key: 'toronto',
  label: 'Toronto',
  shortLabel: 'TO',
  flag: 'https://flagcdn.com/ca.svg',
  currency: 'CAD',
  timezone: 'America/Toronto',
  type: 'city',
  parentKey: 'canada',
  coordinates: { lat: 43.6532, lng: -79.3832 },
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hierarchy, flatList, isLoading: locationsLoading } = useLocations();

  const [selectedLocation, setSelectedLocationState] = useState<LocationOption>(DEFAULT_SELECTED);
  const [hydrated, setHydrated] = useState(false);

  // Once the locations list is ready, resolve the saved key from storage/cookies.
  useEffect(() => {
    if (locationsLoading) return;

    const savedKey = localStorage.getItem(LOCATION_STORAGE_KEY) || Cookies.get('tastyplates_location') || DEFAULT_LOCATION;
    const match = flatList.find(loc => loc.key === savedKey);
    if (match) setSelectedLocationState(match);
    setHydrated(true);
  }, [locationsLoading, flatList]);

  const setSelectedLocation = (location: LocationOption) => {
    setSelectedLocationState(location);
    localStorage.setItem(LOCATION_STORAGE_KEY, location.key);
    Cookies.set('tastyplates_location', location.key, { expires: 365 });
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        locationHierarchy: hierarchy,
        isLoading: locationsLoading || !hydrated,
      }}
    >
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
