"use client";
import { useState, useEffect } from 'react';
import { LOCATION_HIERARCHY, SUPPORTED_LOCATIONS, LocationOption, CountryLocation } from '@/constants/location';

interface LocationsHierarchy {
  countries: CountryLocation[];
}

interface UseLocationsResult {
  hierarchy: LocationsHierarchy;
  flatList: LocationOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches active locations from the database via `/api/v1/locations/get-locations`.
 * Falls back to the hardcoded LOCATION_HIERARCHY constant if the request fails,
 * so the UI always has data to render.
 */
export function useLocations(): UseLocationsResult {
  const [hierarchy, setHierarchy] = useState<LocationsHierarchy>(LOCATION_HIERARCHY);
  const [flatList, setFlatList] = useState<LocationOption[]>(SUPPORTED_LOCATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocations() {
      try {
        const res = await fetch('/api/v1/locations/get-locations', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.success || !json.hierarchy?.countries?.length) {
          throw new Error(json.error || 'Empty locations response');
        }

        if (!cancelled) {
          setHierarchy(json.hierarchy);
          setFlatList(json.flatList ?? []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          // Keep the hardcoded fallback already in state — no reset needed.
          setError(err.message ?? 'Failed to load locations');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLocations();
    return () => { cancelled = true; };
  }, []);

  return { hierarchy, flatList, isLoading, error };
}
