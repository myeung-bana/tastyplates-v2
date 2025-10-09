"use client";
import React, { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import LocationModal from './LocationModal';

interface LocationButtonProps {
  isTransparent?: boolean;
}

const LocationButton: React.FC<LocationButtonProps> = ({ isTransparent = false }) => {
  const { selectedLocation } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowLocationModal(true)}
        className={`bg-[#FCFCFC66]/40 rounded-[50px] text-sm h-11 px-6 hidden md:flex flex-row flex-nowrap items-center gap-2 backdrop-blur-sm ${
          isTransparent ? 'text-white' : 'text-[#494D5D]'
        }`}
      >
        <img 
          src={selectedLocation.flag} 
          alt={`${selectedLocation.label} flag`}
          className="w-5 h-4 object-cover rounded-sm"
        />
        <span className={`text-sm font-semibold ${isTransparent ? 'text-white' : 'text-[#494D5D]'}`}>
          {selectedLocation.label}
        </span>
      </button>

      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
};

export default LocationButton;
