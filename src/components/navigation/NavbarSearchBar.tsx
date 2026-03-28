"use client";
import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiCommand } from 'react-icons/fi';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { palateOptions } from '@/constants/formOptions';
import { getFirstPalateKeyFromUrlParam } from '@/lib/palateSlug';

interface NavbarSearchBarProps {
  isAuthenticated: boolean;
  isTransparent?: boolean; // New prop for transparent background
}

interface SelectedPalate {
  key: string;
  label: string;
  isRegion?: boolean;
}

const NavbarSearchBar: React.FC<NavbarSearchBarProps> = ({ 
  isAuthenticated, 
  isTransparent = false 
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPalates, setSelectedPalates] = useState<Set<string>>(new Set());
  const [showPalateModal, setShowPalateModal] = useState(false);
  const [searchMode, setSearchMode] = useState<'cuisine' | 'keyword'>('cuisine');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Pre-select palate from /restaurants?palate=… (or legacy ?ethnic=)
  useEffect(() => {
    if (!pathname?.startsWith('/restaurants')) return;
    const raw = searchParams.get('palate') || searchParams.get('ethnic');
    const key = getFirstPalateKeyFromUrlParam(raw);
    if (!key) {
      setSelectedPalates(new Set());
      return;
    }
    setSelectedPalates(new Set([key]));
  }, [pathname, searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchMode === 'keyword') {
      // For keyword search, use 'listing' parameter (equivalent to Hero section's "Search by Listing Name")
      if (searchValue) {
        params.set('listing', encodeURIComponent(searchValue));
      }
    } else {
      // For cuisine search, use existing logic
      if (searchValue) {
        params.set('search', encodeURIComponent(searchValue));
      }
      // `palate` = Search Score context on restaurant detail pages; omit when browsing all cuisines
      if (selectedPalates.size > 0) {
        params.set('palate', Array.from(selectedPalates).join(','));
      }
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/restaurants?${queryString}` : '/restaurants');
    setShowPalateModal(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode(prevMode => prevMode === 'cuisine' ? 'keyword' : 'cuisine');
    setSearchValue(''); // Clear search value when switching modes
    setSelectedPalates(new Set()); // Clear selected palates when switching to keyword mode
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (searchMode === 'cuisine') {
      setShowPalateModal(true);
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  // Single selection: either one region (e.g. All East Asian) OR one country (e.g. Japanese). Clicking current selection resets to All Cuisines.
  const handlePalateSelection = (palateKey: string, _isRegion: boolean = false) => {
    const isOnlySelection = selectedPalates.size === 1 && selectedPalates.has(palateKey);
    if (isOnlySelection) {
      setSelectedPalates(new Set());
      return;
    }
    setSelectedPalates(new Set([palateKey]));
  };

  const getSelectedPalateLabels = (): string[] => {
    return Array.from(selectedPalates).map(key => {
      // Check if it's a region
      const region = palateOptions.find(r => r.key === key);
      if (region) {
        return region.label;
      }
      
      // Check if it's an individual cuisine
      for (const region of palateOptions) {
        const cuisine = region.children?.find(c => c.key === key);
        if (cuisine) {
          return cuisine.label;
        }
      }
      
      return key;
    });
  };

  const getDisplayText = (): string => {
    if (searchMode === 'keyword') {
      return searchValue || 'Search by Keyword...';
    }
    const labels = getSelectedPalateLabels();
    if (labels.length === 0) return 'All Cuisines';
    return labels[0] || 'All Cuisines';
  };

  return (
    <>
      <div className={`navbar__search-container ${isTransparent ? 'navbar__search-container--transparent' : ''}`}>
        <div className={`navbar__search-bar ${isTransparent ? 'navbar__search-bar--transparent' : ''} ${isInputFocused ? 'navbar__search-bar--focused' : ''}`}>
          <input
            type="text"
            placeholder={getDisplayText()}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="navbar__search-input"
            readOnly={searchMode === 'cuisine'} // Only read-only for cuisine mode
          />
          <button
            onClick={toggleSearchMode}
            className="navbar__search-mode-toggle"
            title={`Switch to ${searchMode === 'cuisine' ? 'Keyword' : 'Cuisine'} search`}
          >
            <FiCommand className="navbar__search-mode-icon" />
          </button>
          <button
            onClick={handleSearch}
            className="navbar__search-button"
            disabled={searchMode === 'keyword' && !searchValue}
          >
            <FiSearch className="navbar__search-icon" />
          </button>
        </div>
      </div>

      {/* Full-Screen Palate Selection Modal */}
      {showPalateModal && (
        <div className="navbar__palate-modal">
          <div className="navbar__palate-modal-overlay" onClick={() => setShowPalateModal(false)} />
          <div className="navbar__palate-modal-content">
            {/* Header */}
            <div className="navbar__palate-modal-header">
              <h2 className="navbar__palate-modal-title">Discover By Palate</h2>
              <button 
                onClick={() => setShowPalateModal(false)}
                className="navbar__palate-modal-close"
              >
                <FiX className="navbar__palate-modal-close-icon" />
              </button>
            </div>

            {/* Selected Palates Display */}
            {selectedPalates.size > 0 && (
              <div className="navbar__palate-modal-selected">
                <h3 className="navbar__palate-modal-selected-title">Selected:</h3>
                <div className="navbar__palate-modal-selected-tags">
                  {getSelectedPalateLabels().map((label, index) => (
                    <span key={index} className="navbar__palate-modal-selected-tag">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Palate Options */}
            <div className="navbar__palate-modal-options">
              <div className="navbar__palate-modal-region">
              <button
                onClick={() => {
                  setSelectedPalates(new Set());
                  setSearchValue('');
                }}
                className={`navbar__palate-modal-pill navbar__palate-modal-pill--region ${
                  selectedPalates.size === 0 ? 'navbar__palate-modal-pill--selected' : ''
                }`}
              >
                All Cuisines
                {selectedPalates.size === 0 && (
                  <span className="navbar__palate-modal-all-badge">Default</span>
                )}
              </button>
                </div>
              {palateOptions.map((region) => (
                <div key={region.key} className="navbar__palate-modal-region">
                  <h3 className="navbar__palate-modal-region-title">{region.label}</h3>
                  
                  {/* Region Button */}
                  <button
                    onClick={() => handlePalateSelection(region.key, true)}
                    className={`navbar__palate-modal-pill navbar__palate-modal-pill--region ${
                      selectedPalates.has(region.key) ? 'navbar__palate-modal-pill--selected' : ''
                    }`}
                  >
                    All {region.label}
                  </button>

                  {/* Individual Cuisine Buttons */}
                  <div className="navbar__palate-modal-cuisines">
                    {region.children?.map((cuisine) => (
                      <button
                        key={cuisine.key}
                        onClick={() => handlePalateSelection(cuisine.key, false)}
                        className={`navbar__palate-modal-pill navbar__palate-modal-pill--cuisine ${
                          selectedPalates.has(cuisine.key) ? 'navbar__palate-modal-pill--selected' : ''
                        }`}
                      >
                        <img 
                          src={cuisine.flag || ''} 
                          alt={`${cuisine.label} flag`}
                          className="navbar__palate-modal-flag"
                        />
                        {cuisine.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="navbar__palate-modal-actions">
              <button
                onClick={() => {
                  setSelectedPalates(new Set());
                  setSearchValue('');
                }}
                className="navbar__palate-modal-clear"
              >
                Reset
              </button>
              <button
                onClick={() => setShowPalateModal(false)}
                className="navbar__palate-modal-done"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarSearchBar;
