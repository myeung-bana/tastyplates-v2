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
          className="cuisine-filter__button font-neusans"
        >
          <span className="cuisine-filter__button-text font-neusans">
            Cuisine
            {activeFiltersCount > 0 && (
              <span className="cuisine-filter__badge font-neusans">{activeFiltersCount}</span>
            )}
          </span>
        </button>
      </div>

      {/* Slide-in Modal */}
      <div className={`cuisine-filter__modal ${isModalOpen ? 'cuisine-filter__modal--open' : ''}`}>
        <div className="cuisine-filter__overlay" onClick={() => setIsModalOpen(false)} />
        <div className="cuisine-filter__content font-neusans">
          {/* Header */}
          <div className="cuisine-filter__header">
            <h2 className="cuisine-filter__title font-neusans">Cuisine</h2>
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
              <h3 className="cuisine-filter__section-title font-neusans">Palate by Region</h3>
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
                      <h4 className="cuisine-filter__palate-category-title font-neusans">{region}</h4>
                      <span className="cuisine-filter__region-count font-neusans">
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
                          <span className="cuisine-filter__checkbox-label font-neusans">{palate}</span>
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
              className="cuisine-filter__button cuisine-filter__button--secondary font-neusans"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="cuisine-filter__button cuisine-filter__button--primary font-neusans"
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
