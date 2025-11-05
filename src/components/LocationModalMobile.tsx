"use client";
import React, { useState } from 'react';
import { FiArrowLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useLocation } from '@/contexts/LocationContext';
import { LOCATION_HIERARCHY, LocationOption } from '@/constants/location';
import BottomSheet from './ui/BottomSheet/BottomSheet';

interface LocationModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationModalMobile: React.FC<LocationModalMobileProps> = ({ isOpen, onClose }) => {
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'countries' | 'cities'>('countries');

  // Helper function to get parent country's short code for cities
  const getParentCountryCode = (cityKey: string): string => {
    for (const country of LOCATION_HIERARCHY.countries) {
      const city = country.cities.find(c => c.key === cityKey);
      if (city) {
        return country.shortLabel;
      }
    }
    return '';
  };

  // Helper function to format location display
  const formatLocationDisplay = (location: LocationOption): string => {
    // Special case: If Hong Kong city is selected, display as "Hong Kong, HK"
    if (location.type === 'city' && 
        (location.key === 'hong_kong_island' || 
         location.key === 'kowloon' || 
         location.key === 'new_territories')) {
      return 'Hong Kong, HK';
    }
    
    if (location.type === 'city') {
      const countryCode = getParentCountryCode(location.key);
      return `${location.label}, ${countryCode}`;
    } else if (location.type === 'country') {
      return `${location.label}, ${location.shortLabel}`;
    }
    return location.label;
  };

  const handleCountrySelect = (countryKey: string) => {
    // Special case: Hong Kong should be selectable directly as a unified region
    if (countryKey === 'hongkong') {
      const hongKongCountry = LOCATION_HIERARCHY.countries.find(c => c.key === 'hongkong');
      if (hongKongCountry) {
        // Create a country-level location option for Hong Kong
        const hongKongLocation: LocationOption = {
          key: hongKongCountry.key,
          label: hongKongCountry.label,
          shortLabel: hongKongCountry.shortLabel,
          flag: hongKongCountry.flag,
          currency: hongKongCountry.currency,
          timezone: hongKongCountry.timezone,
          type: 'country'
        };
        setSelectedLocation(hongKongLocation);
        onClose();
        setSelectedCountry(null);
        setViewMode('countries');
        return;
      }
    }
    
    // For other countries, show city selection as normal
    setSelectedCountry(countryKey);
    setViewMode('cities');
  };

  const handleCitySelect = (city: LocationOption) => {
    setSelectedLocation(city);
    onClose();
    // Reset modal state
    setSelectedCountry(null);
    setViewMode('countries');
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
    setViewMode('countries');
  };

  const handleClose = () => {
    onClose();
    // Reset modal state
    setSelectedCountry(null);
    setViewMode('countries');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={viewMode === 'countries' ? 'Select Country' : 'Select City'}
      maxHeight="85vh"
    >
      <div className="px-4 pb-6">
        {/* Current Selection Display */}
        {selectedLocation && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2 font-neusans">Current:</h3>
            <div className="flex items-center gap-2">
              <img 
                src={selectedLocation.flag} 
                alt={`${selectedLocation.label} flag`}
                className="w-5 h-4 object-cover rounded-sm"
              />
              <span className="text-base font-medium text-gray-900 font-neusans">
                {formatLocationDisplay(selectedLocation)}
              </span>
            </div>
          </div>
        )}

        {/* Back Button for Cities View */}
        {viewMode === 'cities' && (
          <button
            onClick={handleBackToCountries}
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors font-neusans"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Countries</span>
          </button>
        )}

        {/* Location Options */}
        <div className="space-y-2">
          {viewMode === 'countries' ? (
            // Country Selection View
            LOCATION_HIERARCHY.countries.map((country) => (
              <button
                key={country.key}
                onClick={() => handleCountrySelect(country.key)}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 text-left"
              >
                <div className="flex-shrink-0">
                  <img 
                    src={country.flag} 
                    alt={`${country.label} flag`}
                    className="w-12 h-9 object-cover rounded-md"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-medium text-gray-900 font-neusans">
                      {country.label}
                    </span>
                    <span className="text-sm text-gray-500 font-neusans">
                      {country.shortLabel}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-neusans">
                    {country.cities.length} cities
                  </span>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))
          ) : (
            // City Selection View
            selectedCountry && LOCATION_HIERARCHY.countries
              .find(c => c.key === selectedCountry)?.cities.map((city) => (
                <button
                  key={city.key}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                    selectedLocation.key === city.key
                      ? 'bg-[#E36B00] text-white'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`text-base font-medium font-neusans ${
                      selectedLocation.key === city.key ? 'text-white' : 'text-gray-900'
                    }`}>
                      {city.label}
                    </span>
                    <span className={`text-sm ml-2 font-neusans ${
                      selectedLocation.key === city.key ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      ({city.shortLabel})
                    </span>
                  </div>
                  {selectedLocation.key === city.key && (
                    <FiCheck className={`w-5 h-5 flex-shrink-0 ${
                      selectedLocation.key === city.key ? 'text-white' : 'text-gray-400'
                    }`} />
                  )}
                </button>
              ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default LocationModalMobile;

