import "@/styles/components/cuisine-filter.scss";
import { useEffect, useState } from "react";
import { RESTAURANT_CONSTANTS } from '@/constants/utils';


interface CuisineFilterProps {
  onFilterChange: (cuisines: string[], palates: string[]) => void;
  selectedCuisines: string[];
  selectedPalates: string[];
  onApplyFilters?: () => void;
}



// Regional palate organization - using constants
const palateRegions = RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS;

const CuisineFilter = ({ onFilterChange, selectedCuisines, selectedPalates, onApplyFilters }: CuisineFilterProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCuisinesSet, setSelectedCuisinesSet] = useState<Set<string>>(new Set(selectedCuisines));
  const [selectedPalatesSet, setSelectedPalatesSet] = useState<Set<string>>(new Set(selectedPalates));



  // Sync with homepage filter selections
  useEffect(() => {
    console.log('🔄 CuisineFilter syncing with:', { selectedCuisines, selectedPalates });
    setSelectedCuisinesSet(new Set(selectedCuisines));
    setSelectedPalatesSet(new Set(selectedPalates));
    
  }, [selectedCuisines, selectedPalates]);

  // Helper function to get all palates in a region
  const getPalatesInRegion = (region: string): string[] => {
    return [...(palateRegions[region as keyof typeof palateRegions] || [])];
  };

  // Helper function to check if a region is fully selected
  const isRegionFullySelected = (region: string): boolean => {
    const regionPalates = getPalatesInRegion(region);
    return regionPalates.every(palate => selectedPalatesSet.has(palate));
  };

  // Helper function to check if a region is partially selected
  const isRegionPartiallySelected = (region: string): boolean => {
    const regionPalates = getPalatesInRegion(region);
    return regionPalates.some(palate => selectedPalatesSet.has(palate)) && !isRegionFullySelected(region);
  };

  // Handle region selection - select/deselect all palates in region
  const handleRegionChange = (region: string) => {
    const regionPalates = getPalatesInRegion(region);
    const newPalatesSet = new Set(selectedPalatesSet);
    
    if (isRegionFullySelected(region)) {
      // If region is fully selected, deselect all palates in region
      regionPalates.forEach(palate => newPalatesSet.delete(palate));
    } else {
      // If region is not fully selected, select all palates in region
      regionPalates.forEach(palate => newPalatesSet.add(palate));
    }
    
    setSelectedPalatesSet(newPalatesSet);
  };

  // Handle individual palate selection
  const handleIndividualPalateChange = (palate: string) => {
    const newPalatesSet = new Set(selectedPalatesSet);
    
    if (newPalatesSet.has(palate)) {
      newPalatesSet.delete(palate);
    } else {
      newPalatesSet.add(palate);
    }
    
    setSelectedPalatesSet(newPalatesSet);
    
  };

  const applyFilters = () => {
    const cuisinesArray = Array.from(selectedCuisinesSet);
    const palatesArray = Array.from(selectedPalatesSet);
    
    // Log when palate-based sorting is activated
    if (palatesArray.length > 0) {
      console.log('🎯 Palate-based sorting activated for:', palatesArray);
    }
    
    // Update the filter state
    onFilterChange(cuisinesArray, palatesArray);
    
    // Trigger the parent's apply filters to refetch data
    if (onApplyFilters) {
      onApplyFilters();
    }
    
    setIsModalOpen(false);
  };

  const resetFilters = () => {
    setSelectedCuisinesSet(new Set());
    setSelectedPalatesSet(new Set());
  };

  const getActiveFiltersCount = () => {
    return selectedCuisinesSet.size + selectedPalatesSet.size;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <>
      {/* Cuisine Filter Button */}
      <div className="cuisine-filter">
        <button
          onClick={() => setIsModalOpen(true)}
          className="cuisine-filter__button"
        >
          <span className="cuisine-filter__button-text">
            Cuisine
            {activeFiltersCount > 0 && (
              <span className="cuisine-filter__badge">{activeFiltersCount}</span>
            )}
          </span>
        </button>
      </div>

      {/* Slide-in Modal */}
      <div className={`cuisine-filter__modal ${isModalOpen ? 'cuisine-filter__modal--open' : ''}`}>
        <div className="cuisine-filter__overlay" onClick={() => setIsModalOpen(false)} />
        <div className="cuisine-filter__content">
          {/* Header */}
          <div className="cuisine-filter__header">
            <h2 className="cuisine-filter__title">Cuisine</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="cuisine-filter__close"
            >
            </button>
          </div>

          {/* Content */}
          <div className="cuisine-filter__body">
            {/* Palate Section */}
            <div className="cuisine-filter__section">
              <h3 className="cuisine-filter__section-title">Palate by Region</h3>
              <div className="cuisine-filter__palate-section">
                {Object.entries(palateRegions).map(([region, palates]) => (
                  <div key={region} className="cuisine-filter__palate-category">
                    <div 
                      className={`cuisine-filter__region-header ${isRegionFullySelected(region) ? 'cuisine-filter__region-header--selected' : ''} ${isRegionPartiallySelected(region) ? 'cuisine-filter__region-header--partial' : ''}`}
                      onClick={() => handleRegionChange(region)}
                    >
                      <input
                        type="checkbox"
                        className="cuisine-filter__checkbox"
                        checked={isRegionFullySelected(region)}
                        readOnly
                      />
                      <h4 className="cuisine-filter__palate-category-title">{region}</h4>
                      <span className="cuisine-filter__region-count">
                        ({palates.filter(palate => selectedPalatesSet.has(palate)).length}/{palates.length})
                      </span>
                    </div>
                    <div className="cuisine-filter__palate-subcategory">
                      {palates.map(palate => (
                        <div
                          key={palate}
                          className={`cuisine-filter__checkbox-item ${selectedPalatesSet.has(palate) ? 'cuisine-filter__checkbox-item--selected' : ''}`}
                          onClick={e => {
                            e.stopPropagation();
                            handleIndividualPalateChange(palate);
                          }}
                        >
                          <input
                            type="checkbox"
                            className="cuisine-filter__checkbox"
                            checked={selectedPalatesSet.has(palate)}
                            readOnly
                          />
                          <span className="cuisine-filter__checkbox-label">{palate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="cuisine-filter__footer">
            <button
              onClick={resetFilters}
              className="cuisine-filter__button cuisine-filter__button--secondary"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="cuisine-filter__button cuisine-filter__button--primary"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CuisineFilter;
