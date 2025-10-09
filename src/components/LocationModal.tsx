"use client";
import React from 'react';
import { FiX } from 'react-icons/fi';
import { useLocation } from '@/contexts/LocationContext';
import { SUPPORTED_LOCATIONS, LocationOption } from '@/constants/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { selectedLocation, setSelectedLocation } = useLocation();

  const handleLocationSelect = (location: LocationOption) => {
    setSelectedLocation(location);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="navbar__location-modal">
      <div className="navbar__location-modal-overlay" onClick={onClose} />
      <div className="navbar__location-modal-content">
        {/* Header */}
        <div className="navbar__location-modal-header">
          <h2 className="navbar__location-modal-title">Choose Your Region</h2>
          <button 
            onClick={onClose}
            className="navbar__location-modal-close"
          >
            <FiX className="navbar__location-modal-close-icon" />
          </button>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="navbar__location-modal-selected">
            <h3 className="navbar__location-modal-selected-title">Selected:</h3>
            <div className="navbar__location-modal-selected-tags">
              <span className="navbar__location-modal-selected-tag">
                <img 
                  src={selectedLocation.flag} 
                  alt={`${selectedLocation.label} flag`}
                  className="navbar__location-modal-selected-flag"
                />
                {selectedLocation.label}
              </span>
            </div>
          </div>
        )}

        {/* Location Options */}
        <div className="navbar__location-modal-options">
          {SUPPORTED_LOCATIONS.map((location) => (
            <button
              key={location.key}
              onClick={() => handleLocationSelect(location)}
              className={`navbar__location-modal-pill ${
                selectedLocation.key === location.key ? 'navbar__location-modal-pill--selected' : ''
              }`}
            >
              <img 
                src={location.flag} 
                alt={`${location.label} flag`}
                className="navbar__location-modal-flag"
              />
              {location.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="navbar__location-modal-actions">
          <button
            onClick={onClose}
            className="navbar__location-modal-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
