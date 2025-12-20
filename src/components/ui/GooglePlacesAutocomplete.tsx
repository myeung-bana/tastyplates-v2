"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';

export interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: { place_id: string; description: string }) => void;
  placeholder?: string;
  searchType?: 'restaurant' | 'address';
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable Google Places Autocomplete component
 * Styled to match the search input in Listing page
 */
export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a restaurant...',
  searchType = 'restaurant',
  className = '',
  disabled = false,
}) => {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps API
  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key is not set in environment variables.');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      setIsGoogleLoaded(true);
      return;
    }

    // Load Google Maps script if not already loaded
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      (window as any).initGooglePlaces = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          setIsGoogleLoaded(true);
        }
      };

      return () => {
        // Cleanup: remove the callback
        if ((window as any).initGooglePlaces) {
          delete (window as any).initGooglePlaces;
        }
      };
    } else {
      // Script already exists, wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          setIsGoogleLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Fetch predictions when input changes
  const fetchPredictions = useCallback(
    (inputValue: string) => {
      if (!autocompleteServiceRef.current || !inputValue.trim()) {
        setPredictions([]);
        setShowPredictions(false);
        return;
      }

      setIsLoading(true);

      // Configure request based on search type
      const request: google.maps.places.AutocompletionRequest = {
        input: inputValue,
        types: searchType === 'restaurant' ? ['establishment'] : ['address'],
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filter for restaurants if searchType is 'restaurant'
          const filtered = searchType === 'restaurant'
            ? predictions.filter((p) => 
                p.types.some((type) => 
                  type.includes('restaurant') || 
                  type.includes('food') || 
                  type.includes('meal') ||
                  type.includes('establishment')
                )
              )
            : predictions;

          setPredictions(filtered);
          setShowPredictions(filtered.length > 0);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    },
    [searchType]
  );

  // Debounce predictions
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.description);
    setPredictions([]);
    setShowPredictions(false);
    onPlaceSelect({
      place_id: prediction.place_id,
      description: prediction.description,
    });
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5] h-[50px]">
        <div className="flex items-center flex-1 gap-2">
          <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              if (predictions.length > 0) {
                setShowPredictions(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled || !isGoogleLoaded}
            className="font-neusans flex-1 border-none outline-none bg-transparent text-sm md:text-base text-[#31343F] placeholder-gray-400"
          />
        </div>
        {isLoading && (
          <div className="flex-shrink-0">
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

      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePredictionSelect(prediction)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                index !== predictions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="font-medium text-[#31343F]">{prediction.structured_formatting.main_text}</div>
              {prediction.structured_formatting.secondary_text && (
                <div className="text-sm text-gray-500 mt-0.5">
                  {prediction.structured_formatting.secondary_text}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
