"use client";
import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { useLocation } from '@/contexts/LocationContext';
import { LOCATION_HIERARCHY } from '@/constants/location';
import LocationModal from './LocationModal';

interface LocationButtonProps {
  isTransparent?: boolean;
}

const LocationButton: React.FC<LocationButtonProps> = ({ isTransparent = false }) => {
  const { selectedLocation } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  // Smart display logic - always show City, Country format
  const getDisplayText = () => {
    // Special case: If Hong Kong city is selected, display as "Hong Kong, HK"
    if (selectedLocation.type === 'city' && 
        (selectedLocation.key === 'hong_kong_island' || 
         selectedLocation.key === 'kowloon' || 
         selectedLocation.key === 'new_territories')) {
      return 'Hong Kong, HK';
    }
    
    if (selectedLocation.type === 'city') {
      // For cities, show "City, Country" format (e.g., "Vancouver, CA")
      const countryCode = getParentCountryCode(selectedLocation.key);
      return `${selectedLocation.label}, ${countryCode}`;
    } else if (selectedLocation.type === 'country') {
      // For countries, show "Country, CountryCode" format (e.g., "Canada, CA")
      return `${selectedLocation.label}, ${selectedLocation.shortLabel}`;
    }
    return selectedLocation.label;
  };

  return (
    <>
      <button 
        onClick={() => setShowLocationModal(true)}
        className={`bg-[#FCFCFC66]/40 rounded-[50px] text-sm h-11 px-6 hidden md:flex flex-row flex-nowrap items-center gap-2 backdrop-blur-sm font-neusans font-normal ${
          isTransparent ? 'text-white' : 'text-[#494D5D]'
        }`}
      >
        <img 
          src={selectedLocation.flag} 
          alt={`${selectedLocation.label} flag`}
          className="w-5 h-4 object-cover rounded-sm"
        />
        <span className={`font-neusans text-sm ${isTransparent ? 'text-white' : 'text-[#494D5D]'}`}>
          {getDisplayText()}
        </span>
        <FiChevronDown className={`w-4 h-4 ${isTransparent ? 'text-white' : 'text-[#494D5D]'}`} />
      </button>

      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
};

export default LocationButton;
