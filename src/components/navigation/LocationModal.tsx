"use client";
import React, { useState } from 'react';
import { FiX, FiArrowLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { useLocation } from '@/contexts/LocationContext';
import { LocationOption } from '@/constants/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
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

    // Countries with no cities are directly selectable (e.g. Hong Kong as a region)
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

  if (!isOpen) return null;

  return (
    <div className="navbar__location-modal">
      <div className="navbar__location-modal-overlay" onClick={handleClose} />
      <div className="navbar__location-modal-content">
        {/* Header with breadcrumb */}
        <div className="navbar__location-modal-header">
          <button 
            onClick={viewMode === 'cities' ? handleBackToCountries : handleClose}
            className="navbar__location-modal-back"
          >
            <FiArrowLeft className="navbar__location-modal-back-icon" />
          </button>
          <h2 className="navbar__location-modal-title font-neusans font-normal">
            {viewMode === 'countries' ? 'Select Country' : 'Select City'}
          </h2>
          <button onClick={handleClose} className="navbar__location-modal-close">
            <FiX className="navbar__location-modal-close-icon" />
          </button>
        </div>

        {/* Current Selection Display */}
        {selectedLocation && (
          <div className="navbar__location-modal-selected">
            <h3 className="navbar__location-modal-selected-title font-neusans font-normal">Current:</h3>
            <div className="navbar__location-modal-selected-tags">
              <span className="navbar__location-modal-selected-tag">
                <img 
                  src={selectedLocation.flag} 
                  alt={`${selectedLocation.label} flag`}
                  className="navbar__location-modal-selected-flag"
                />
                <span className="font-neusans font-normal">
                  {formatLocationDisplay(selectedLocation)}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Location Options */}
        <div className="navbar__location-modal-options">
          {viewMode === 'countries' ? (
            // Country Selection View
            locationHierarchy.countries.map((country) => (
              <button
                key={country.key}
                onClick={() => handleCountrySelect(country.key)}
                className="navbar__location-modal-country-card"
              >
                <div className="navbar__location-modal-country-flag">
                  <img src={country.flag} alt={`${country.label} flag`} />
                </div>
                <div className="navbar__location-modal-country-info">
                  <span className="navbar__location-modal-country-name font-neusans font-normal">
                    {country.label}
                  </span>
                  <span className="navbar__location-modal-country-short font-neusans font-normal">
                    {country.shortLabel}
                  </span>
                  <span className="navbar__location-modal-country-cities font-neusans font-normal">
                    {country.cities.length} cities
                  </span>
                </div>
                <FiChevronRight className="navbar__location-modal-arrow" />
              </button>
            ))
          ) : (
            // City Selection View
            selectedCountry && locationHierarchy.countries
              .find(c => c.key === selectedCountry)?.cities.map((city) => (
                <button
                  key={city.key}
                  onClick={() => handleCitySelect(city)}
                  className={`navbar__location-modal-city-card ${
                    selectedLocation.key === city.key ? 'selected' : ''
                  }`}
                >
                  <div className="navbar__location-modal-city-info">
                    <span className="navbar__location-modal-city-name font-neusans font-normal">
                      {city.label}
                    </span>
                    <span className="navbar__location-modal-city-short font-neusans font-normal">
                      ({city.shortLabel})
                    </span>
                  </div>
                  {selectedLocation.key === city.key && (
                    <FiCheck className="navbar__location-modal-check" />
                  )}
                </button>
              ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="navbar__location-modal-actions">
          <button
            onClick={handleClose}
            className="navbar__location-modal-done font-neusans font-normal"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
