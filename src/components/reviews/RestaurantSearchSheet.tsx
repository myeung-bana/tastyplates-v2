"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiSearch } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { RestaurantMatchInline } from "@/components/reviews/RestaurantMatchInline";
import { RestaurantPlaceData, fetchPlaceDetails } from "@/lib/google-places-utils";
import { RestaurantV2 } from "@/app/api/v1/services/restaurantV2Service";
import { LocationOption, LOCATION_HIERARCHY } from "@/constants/location";
import toast from "react-hot-toast";
import "@/styles/components/_restaurant-search-sheet.scss";

const ANIM_MS = 380;
const DEBOUNCE_MS = 300;

interface RestaurantSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting: (restaurant: RestaurantV2) => void;
  onCreateNew: (placeData: RestaurantPlaceData) => void;
  selectedLocation?: LocationOption;
}

function getParentCountryCode(cityKey: string): string {
  for (const country of LOCATION_HIERARCHY.countries) {
    if (country.cities.find((c) => c.key === cityKey)) return country.shortLabel;
  }
  return "";
}

function formatLocationDisplay(location: LocationOption): string {
  if (
    location.type === "city" &&
    ["hong_kong_island", "kowloon", "new_territories"].includes(location.key)
  )
    return "Hong Kong, HK";
  if (location.type === "city")
    return `${location.label}, ${getParentCountryCode(location.key)}`;
  if (location.type === "country") return `${location.label}, ${location.shortLabel}`;
  return location.label;
}

export default function RestaurantSearchSheet({
  isOpen,
  onClose,
  onSelectExisting,
  onCreateNew,
  selectedLocation,
}: RestaurantSearchSheetProps) {
  // --- sheet animation state ---
  const [portalActive, setPortalActive] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // --- search state ---
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // --- match / detail state ---
  const [selectedPlace, setSelectedPlace] = useState<RestaurantPlaceData | null>(null);
  const [existingRestaurant, setExistingRestaurant] = useState<RestaurantV2 | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // ── Google Maps init ──────────────────────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;

    if (window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      setIsGoogleLoaded(true);
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          setIsGoogleLoaded(true);
          clearInterval(check);
        } else if (attempts >= 100) clearInterval(check);
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=__initGPlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    (window as any).__initGPlaces = () => {
      if (window.google?.maps?.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        setIsGoogleLoaded(true);
      }
    };
    return () => {
      delete (window as any).__initGPlaces;
    };
  }, []);

  // ── Sheet open / close animation ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setPortalActive(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetVisible(true));
      });
      document.body.style.overflow = "hidden";
      // Auto-focus after animation settles
      setTimeout(() => inputRef.current?.focus(), ANIM_MS + 50);
    } else if (portalActive) {
      setSheetVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setPortalActive(false);
        resetState();
      }, ANIM_MS);
      document.body.style.overflow = "";
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  // ── helpers ────────────────────────────────────────────────────────
  const resetState = () => {
    setSearchValue("");
    setPredictions([]);
    setSelectedPlace(null);
    setExistingRestaurant(null);
    setIsMatching(false);
  };

  // ── Fetch predictions ──────────────────────────────────────────────
  const fetchPredictions = useCallback(
    (input: string) => {
      if (!autocompleteServiceRef.current || !input.trim()) {
        setPredictions([]);
        return;
      }

      setIsSearching(true);

      const request: google.maps.places.AutocompletionRequest = {
        input,
        types: ["establishment"],
      };

      if (selectedLocation && window.google?.maps) {
        if (selectedLocation.type === "city" && selectedLocation.coordinates) {
          try {
            request.locationBias = new window.google.maps.Circle({
              center: selectedLocation.coordinates,
              radius: 50000,
            });
          } catch {
            request.locationBias = new window.google.maps.LatLng(
              selectedLocation.coordinates.lat,
              selectedLocation.coordinates.lng
            );
          }
        }
        if (selectedLocation.type === "country" && selectedLocation.shortLabel) {
          request.componentRestrictions = {
            country: selectedLocation.shortLabel.toLowerCase(),
          };
        }
      }

      autocompleteServiceRef.current.getPlacePredictions(request, (preds, status) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
          const filtered = preds
            .filter((p) => {
              const types = p.types || [];
              const isFood = types.some(
                (t) =>
                  t.includes("restaurant") ||
                  t.includes("food") ||
                  t.includes("meal") ||
                  t.includes("cafe") ||
                  t.includes("bakery") ||
                  t.includes("bar")
              );
              if (isFood) return true;
              if (!types.some((t) => t.includes("establishment"))) return false;
              const q = input.toLowerCase();
              return ["restaurant", "resto", "food", "dining", "eat", "cafe", "bakery", "bar", "bistro"].some((kw) =>
                q.includes(kw)
              );
            })
            .sort((a, b) => {
              const score = (p: google.maps.places.AutocompletePrediction) => {
                const types = p.types || [];
                let v = 0;
                if (types.some((t) => t.includes("restaurant"))) v += 3;
                if (types.some((t) => ["food", "meal", "cafe", "bakery", "bar"].some((k) => t.includes(k)))) v += 2;
                if (types.some((t) => t.includes("establishment"))) v += 1;
                return v;
              };
              return score(b) - score(a);
            });
          setPredictions(filtered);
        } else {
          setPredictions([]);
        }
      });
    },
    [selectedLocation]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchValue(v);
    setSelectedPlace(null);
    setExistingRestaurant(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(v), DEBOUNCE_MS);
  };

  const clearSearch = () => {
    setSearchValue("");
    setPredictions([]);
    setSelectedPlace(null);
    setExistingRestaurant(null);
    inputRef.current?.focus();
  };

  // ── Handle prediction tap ──────────────────────────────────────────
  const handlePredictionTap = useCallback(
    async (prediction: google.maps.places.AutocompletePrediction) => {
      setSearchValue(prediction.structured_formatting.main_text);
      setPredictions([]);
      setIsMatching(true);

      try {
        const placeData = await fetchPlaceDetails(prediction.place_id);
        if (!placeData) {
          toast.error("Failed to fetch restaurant details.");
          setIsMatching(false);
          return;
        }
        setSelectedPlace(placeData);

        try {
          const res = await fetch("/api/v1/restaurants-v2/match-restaurant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              place_id: placeData.place_id,
              name: placeData.name,
              address: placeData.formatted_address,
              latitude: placeData.geometry?.location?.lat(),
              longitude: placeData.geometry?.location?.lng(),
            }),
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setExistingRestaurant(data.match && data.restaurant ? data.restaurant : null);
        } catch {
          setExistingRestaurant(null);
        }
      } catch {
        toast.error("Failed to fetch restaurant details.");
      } finally {
        setIsMatching(false);
      }
    },
    []
  );

  const handleSelectExisting = useCallback(
    (restaurant: RestaurantV2) => {
      onSelectExisting(restaurant);
      onClose();
    },
    [onSelectExisting, onClose]
  );

  const handleCreateNew = useCallback(
    (placeData: RestaurantPlaceData) => {
      onCreateNew(placeData);
      onClose();
    },
    [onCreateNew, onClose]
  );

  // ── Render ─────────────────────────────────────────────────────────
  if (!portalActive || typeof document === "undefined") return null;

  const hasQuery = searchValue.trim().length > 0;
  const showResults = hasQuery && predictions.length > 0 && !selectedPlace;
  const showEmpty = hasQuery && predictions.length === 0 && !isSearching && !selectedPlace;

  return createPortal(
    <div
      className={`restaurant-search-sheet ${sheetVisible ? "restaurant-search-sheet--visible" : ""}`}
    >
      <div className="restaurant-search-sheet__overlay" onClick={onClose} />

      <div className="restaurant-search-sheet__panel">
        {/* ── Sticky search header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          {/* Top bar with close */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <MdClose className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-base font-neusans font-medium text-[#31343F]">
              Find a Listing
            </h2>
          </div>

          {/* Search input */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-gray-100 px-3.5 py-2.5">
              <FiSearch className="h-[18px] w-[18px] shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={handleInputChange}
                placeholder="Search by Listing Name"
                disabled={!isGoogleLoaded}
                className="flex-1 border-none bg-transparent text-[15px] font-neusans text-[#31343F] placeholder-gray-400 outline-none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {isSearching && (
                <svg className="h-4 w-4 shrink-0 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {hasQuery && !isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="shrink-0 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
                  aria-label="Clear search"
                >
                  <MdClose className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Summary line: "sushi" · 5 places */}
            {hasQuery && !selectedPlace && (
              <div className="mt-2 flex items-center gap-1.5 px-1 text-xs text-gray-500 font-neusans">
                <span className="truncate max-w-[60%] font-medium text-gray-700">
                  &ldquo;{searchValue.trim()}&rdquo;
                </span>
                <span className="shrink-0">&middot;</span>
                <span className="shrink-0">
                  {isSearching
                    ? "Searching..."
                    : `${predictions.length} place${predictions.length !== 1 ? "s" : ""}`}
                </span>
              </div>
            )}

            {selectedLocation && !selectedPlace && (
              <p className="mt-1.5 px-1 text-xs text-gray-400 font-neusans">
                Searching in{" "}
                <span className="font-medium text-gray-500">
                  {formatLocationDisplay(selectedLocation)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Match detail view */}
          {selectedPlace && !isMatching && (
            <div className="px-4 pt-2 pb-8">
              <RestaurantMatchInline
                googlePlaceData={selectedPlace}
                existingRestaurant={existingRestaurant}
                onSelectExisting={handleSelectExisting}
                onCreateNew={handleCreateNew}
                onClose={() => {
                  setSelectedPlace(null);
                  setExistingRestaurant(null);
                  setSearchValue("");
                  inputRef.current?.focus();
                }}
              />
            </div>
          )}

          {/* Matching spinner */}
          {isMatching && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-500 font-neusans">
              <svg className="h-5 w-5 animate-spin text-[#ff7c0a]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking restaurant...
            </div>
          )}

          {/* All Results list */}
          {showResults && (
            <div>
              <div className="px-4 pt-3 pb-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-neusans">
                  All Results
                </h3>
              </div>
              <ul className="pb-8">
                {predictions.map((prediction) => (
                  <li key={prediction.place_id}>
                    <button
                      type="button"
                      onClick={() => handlePredictionTap(prediction)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-gray-50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <HiOutlineLocationMarker className="h-[18px] w-[18px] text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[#31343F] font-neusans">
                          {prediction.structured_formatting.main_text}
                        </p>
                        {prediction.structured_formatting.secondary_text && (
                          <p className="mt-0.5 truncate text-[13px] text-gray-500 font-neusans">
                            {prediction.structured_formatting.secondary_text}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 font-neusans">No results found</p>
              <p className="mt-1 text-xs text-gray-500 font-neusans">
                Try a different search term or check the spelling
              </p>
            </div>
          )}

          {/* Initial state — no query yet */}
          {!hasQuery && !selectedPlace && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                <FiSearch className="h-5 w-5 text-[#ff7c0a]" />
              </div>
              <p className="text-sm font-medium text-gray-700 font-neusans">
                Search for a restaurant
              </p>
              <p className="mt-1 text-xs text-gray-500 font-neusans">
                Type a name to find restaurants and establishments
              </p>
            </div>
          )}

          {/* Help footer */}
          {!selectedPlace && (
            <div className="px-4 pb-8">
              <p className="text-xs text-gray-400 font-neusans text-center">
                Can&apos;t find your listing?{" "}
                <a href="mailto:support@tastyplates.co" className="text-[#ff7c0a] hover:underline">
                  Contact the Tastyplates Team
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
