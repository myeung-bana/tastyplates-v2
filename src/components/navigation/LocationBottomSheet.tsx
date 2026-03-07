"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useLocation } from '@/contexts/LocationContext';
import { LocationOption } from '@/constants/location';
import BottomSheet from '../ui/BottomSheet/BottomSheet';

interface LocationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({ isOpen, onClose }) => {
  const { selectedLocation, setSelectedLocation, locationHierarchy } = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'countries' | 'cities'>('countries');

  // Helper function to get parent country's short code for cities
  const getParentCountryCode = (cityKey: string): string => {
    for (const country of locationHierarchy.countries) {
      const city = country.cities.find(c => c.key === cityKey);
      if (city) return country.shortLabel;
    }
    return '';
  };

  // Helper function to format location display
  const formatLocationDisplay = (location: LocationOption): string => {
    if (location.type === 'city') {
      const countryCode = getParentCountryCode(location.key);
      return `${location.label}, ${countryCode}`;
    } else if (location.type === 'country') {
      return `${location.label}, ${location.shortLabel}`;
    }
    return location.label;
  };

  const handleCountrySelect = (countryKey: string) => {
    const country = locationHierarchy.countries.find(c => c.key === countryKey);
    if (!country) return;

    // Countries with no cities are directly selectable as a region
    if (country.cities.length === 0) {
      const countryLocation: LocationOption = {
        key: country.key,
        label: country.label,
        shortLabel: country.shortLabel,
        flag: country.flag,
        currency: country.currency,
        timezone: country.timezone,
        type: 'country',
      };
      setSelectedLocation(countryLocation);
      onClose();
      setSelectedCountry(null);
      setViewMode('countries');
      return;
    }

    setSelectedCountry(countryKey);
    setViewMode('cities');
  };

  const handleCitySelect = (city: LocationOption) => {
    setSelectedLocation(city);
    onClose();
    setSelectedCountry(null);
    setViewMode('countries');
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
    setViewMode('countries');
  };

  const handleClose = () => {
    onClose();
    setSelectedCountry(null);
    setViewMode('countries');
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const bottomSheetContent = (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={viewMode === 'countries' ? 'Select Country' : 'Select City'}
      maxHeight="85vh"
      className="w-full"
    >
      <div className="px-4 pb-6 w-full">
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
        <div className="space-y-2 w-full">
          {viewMode === 'countries' ? (
            // Country Selection View
            locationHierarchy.countries.map((country) => (
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
                  <div className="flex items-center gap-2 mb-0">
                    <span className="text-base font-normal text-gray-900 font-neusans mb-0">
                      {country.label}
                    </span>
                    <span className="text-sm font-normal text-gray-500 font-neusans mb-0">
                      {country.shortLabel}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-neusans mb-0">
                    {country.cities.length} cities
                  </span>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))
          ) : (
            // City Selection View
            selectedCountry && locationHierarchy.countries
              .find(c => c.key === selectedCountry)?.cities.map((city) => (
                <button
                  key={city.key}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                    selectedLocation.key === city.key
                      ? 'bg-[#ff7c0a] text-white'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`mb-0 text-base font-medium font-neusans ${
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

  if (!mounted) return null;

  return createPortal(bottomSheetContent, document.body);
};

export default LocationBottomSheet;
