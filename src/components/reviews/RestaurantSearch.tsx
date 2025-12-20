"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { RestaurantMatchDialog } from './RestaurantMatchDialog';
import { fetchPlaceDetails, RestaurantPlaceData } from '@/lib/google-places-utils';
import { RestaurantV2 } from '@/app/api/v1/services/restaurantV2Service';

export interface RestaurantSelection {
  type: 'existing' | 'new';
  restaurantUuid?: string;
  placeData?: RestaurantPlaceData;
}

interface RestaurantSearchProps {
  onRestaurantSelect: (selection: RestaurantSelection) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Main restaurant search component styled to match /review-listing
 */
export function RestaurantSearch({
  onRestaurantSelect,
  className = '',
  placeholder = 'Search by Listing Name',
}: RestaurantSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<RestaurantPlaceData | null>(null);
  const [existingRestaurant, setExistingRestaurant] = useState<RestaurantV2 | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key is not set in environment variables.');
      return;
    }

    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) return;

      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment'],
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.place_id) {
          handlePlaceSelect({
            place_id: place.place_id,
            description: place.name || place.formatted_address || '',
          });
        }
      });
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          initAutocomplete();
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = async (place: { place_id: string; description: string }) => {
    if (!place.place_id) {
      setError('Invalid place selection');
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      const placeData = await fetchPlaceDetails(place.place_id);
      if (!placeData) {
        setError('Failed to fetch restaurant details. Please try again.');
        setIsMatching(false);
        return;
      }

      setSelectedPlace(placeData);

      try {
        const matchResponse = await fetch('/api/v1/restaurants-v2/match-restaurant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: placeData.place_id,
            name: placeData.name,
            address: placeData.formatted_address,
            latitude: placeData.geometry?.location?.lat(),
            longitude: placeData.geometry?.location?.lng(),
          }),
        });

        if (!matchResponse.ok) {
          throw new Error('Failed to check for existing restaurant');
        }

        const matchData = await matchResponse.json();

        if (matchData.match && matchData.restaurant) {
          setExistingRestaurant(matchData.restaurant);
        } else {
          setExistingRestaurant(null);
        }

        setShowMatchDialog(true);
      } catch (matchError) {
        console.error('Error matching restaurant:', matchError);
        setError('Failed to check for existing restaurant. Please try again.');
        setExistingRestaurant(null);
        setShowMatchDialog(true);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError('Failed to fetch restaurant details. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectExisting = (restaurant: RestaurantV2) => {
    onRestaurantSelect({
      type: 'existing',
      restaurantUuid: restaurant.uuid,
    });
    setSearchValue(restaurant.title);
    setSelectedPlace(null);
    setExistingRestaurant(null);
  };

  const handleCreateNew = (placeData: RestaurantPlaceData) => {
    onRestaurantSelect({
      type: 'new',
      placeData: placeData,
    });
    setSearchValue(placeData.name);
    setSelectedPlace(null);
    setExistingRestaurant(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="my-6 md:my-10 max-w-[525px] w-full px-6 lg:px-0">
        <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
          <div className="flex items-center flex-1 gap-2">
            <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              className="font-neusans flex-1 border-none outline-none bg-transparent text-sm md:text-base text-[#31343F] placeholder-gray-400"
              value={searchValue}
              onChange={handleInputChange}
              disabled={isMatching}
            />
          </div>
          {isMatching && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <svg
                className="animate-spin h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {selectedPlace && (
        <RestaurantMatchDialog
          open={showMatchDialog}
          onOpenChange={setShowMatchDialog}
          googlePlaceData={selectedPlace}
          existingRestaurant={existingRestaurant}
          onSelectExisting={handleSelectExisting}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  );
}
