"use client";
import React, { useState, useEffect } from "react";
import { FiX, FiSearch, FiMapPin, FiChevronDown } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useLocation } from "@/contexts/LocationContext";
import { palateOptions } from "@/constants/formOptions";
import { RESTAURANTS } from "@/constants/pages";
import { LOCATION_HIERARCHY } from "@/constants/location";
import LocationBottomSheet from "../navigation/LocationBottomSheet";

interface SearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "tastyplates_recent_searches";
const MAX_RECENT_SEARCHES = 10;

const SearchMenu: React.FC<SearchMenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { selectedLocation } = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<string>>(new Set());
  const [searchMode, setSearchMode] = useState<"cuisine" | "keyword">("cuisine");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentSearches(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error("Failed to parse recent searches:", e);
          setRecentSearches([]);
        }
      }
    }
  }, []);

  // Save search term to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term || term.trim().length === 0) return;
    
    const trimmedTerm = term.trim();
    let updatedSearches = [...recentSearches];
    
    // Remove if already exists (case-insensitive)
    updatedSearches = updatedSearches.filter(s => s.toLowerCase() !== trimmedTerm.toLowerCase());
    
    // Add to front
    updatedSearches.unshift(trimmedTerm);
    
    // Keep only last 10
    updatedSearches = updatedSearches.slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updatedSearches);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    }
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  };

  // Helper to get location display text
  const getLocationDisplayText = () => {
    if (
      selectedLocation.type === "city" &&
      (selectedLocation.key === "hong_kong_island" ||
        selectedLocation.key === "kowloon" ||
        selectedLocation.key === "new_territories")
    ) {
      return "Hong Kong, HK";
    }

    if (selectedLocation.type === "city") {
      const getParentCountryCode = (cityKey: string): string => {
        for (const country of LOCATION_HIERARCHY.countries) {
          const city = country.cities.find((c: { key: string }) => c.key === cityKey);
          if (city) {
            return country.shortLabel;
          }
        }
        return "";
      };
      const countryCode = getParentCountryCode(selectedLocation.key);
      return `${selectedLocation.label}, ${countryCode}`;
    } else if (selectedLocation.type === "country") {
      return `${selectedLocation.label}, ${selectedLocation.shortLabel}`;
    }
    return selectedLocation.label;
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchMode === "keyword") {
      if (searchValue) {
        // Save to recent searches
        saveRecentSearch(searchValue);
        params.set("listing", encodeURIComponent(searchValue));
      }
    } else {
      if (searchValue) {
        params.set("search", encodeURIComponent(searchValue));
      }
      if (selectedPalates.size > 0) {
        params.set("palates", Array.from(selectedPalates).join(","));
      }
    }

    const queryString = params.toString();
    router.push(queryString ? `${RESTAURANTS}?${queryString}` : RESTAURANTS);
    onClose();
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchValue(term);
  };

  const toggleSearchMode = () => {
    setSearchMode((prevMode) => (prevMode === "cuisine" ? "keyword" : "cuisine"));
    setSearchValue("");
    setSelectedPalates(new Set());
  };

  const handlePalateSelection = (palateKey: string, isRegion: boolean = false) => {
    const newSelection = new Set(selectedPalates);

    if (isRegion) {
      const region = palateOptions.find((r) => r.key === palateKey);
      if (region?.children) {
        region.children.forEach((child) => {
          newSelection.delete(child.key);
        });
      }

      if (newSelection.has(palateKey)) {
        newSelection.delete(palateKey);
      } else {
        newSelection.add(palateKey);
      }
    } else {
      const parentRegion = palateOptions.find((region) =>
        region.children?.some((child) => child.key === palateKey)
      );

      if (parentRegion) {
        newSelection.delete(parentRegion.key);
      }

      if (newSelection.has(palateKey)) {
        newSelection.delete(palateKey);
      } else {
        newSelection.add(palateKey);
      }
    }

    setSelectedPalates(newSelection);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Search Menu - Full Screen */}
      <div
        className={`md:hidden fixed top-0 right-0 z-[60] w-full h-full bg-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full font-neusans">
          {/* Minimal Header - Just Close Button */}
          <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close search menu"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 space-y-5">
              {/* Region Selection - Compact */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{getLocationDisplayText()}</span>
                </div>
                <FiChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Search Mode Toggle - Pill Style */}
              <div className="flex gap-2">
                <button
                  onClick={() => searchMode === "keyword" && toggleSearchMode()}
                  className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    searchMode === "cuisine"
                      ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                      : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Cuisine
                </button>
                <button
                  onClick={() => searchMode === "cuisine" && toggleSearchMode()}
                  className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    searchMode === "keyword"
                      ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                      : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Keyword
                </button>
              </div>

              {/* Keyword Search Input */}
              {searchMode === "keyword" && (
                <div className="pt-2 space-y-4">
                  {/* Search Input - WHITE BACKGROUND */}
                  <input
                    type="text"
                    placeholder="Search by keyword..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && searchValue.trim()) {
                        handleSearch();
                      }
                    }}
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7c0a] focus:border-transparent"
                  />

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-500">
                          Recent Searches
                        </h4>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, index) => (
                          <button
                            key={`${term}-${index}`}
                            onClick={() => handleRecentSearchClick(term)}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cuisine Selection - Tag Cloud Style */}
              {searchMode === "cuisine" && (
                <div className="pt-1">
                  {/* Clear Button */}
                  {selectedPalates.size > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        {selectedPalates.size} selected
                      </span>
                      <button
                        onClick={() => setSelectedPalates(new Set())}
                        className="text-xs text-[#ff7c0a] hover:text-[#e66b00] font-medium underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* All Cuisines Pill */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedPalates(new Set());
                        setSearchValue("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedPalates.size === 0
                          ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      All Cuisines
                    </button>
                  </div>

                  {/* Cuisine Sections */}
                  <div className="space-y-4">
                    {palateOptions.map((region) => (
                      <div key={region.key}>
                        {/* Section Title */}
                        <h4 className="text-xs font-medium text-gray-500 mb-2">
                          {region.label}
                        </h4>

                        {/* Pills: All Region + Individual Cuisines */}
                        <div className="flex flex-wrap gap-2">
                          {/* All Region Pill */}
                          <button
                            onClick={() => handlePalateSelection(region.key, true)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              selectedPalates.has(region.key)
                                ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            All {region.label}
                          </button>

                          {/* Individual Cuisine Pills */}
                          {region.children?.map((cuisine) => (
                            <button
                              key={cuisine.key}
                              onClick={() => handlePalateSelection(cuisine.key, false)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                selectedPalates.has(cuisine.key)
                                  ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <img
                                src={cuisine.flag || ""}
                                alt=""
                                className="w-3.5 h-2.5 object-cover rounded-sm flex-shrink-0"
                              />
                              <span>{cuisine.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Search Button - Sticky */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleSearch}
              disabled={searchMode === "keyword" && !searchValue}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#ff7c0a] text-white rounded-full font-medium text-sm hover:bg-[#e66b00] active:bg-[#cc5f00] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-white text-sm font-medium">Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Location Selection Modal */}
      <LocationBottomSheet isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </>
  );
};

export default SearchMenu;

