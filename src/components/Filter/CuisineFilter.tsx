import "@/styles/components/cuisine-filter.scss";
import { useEffect, useState } from "react";
import CuisinePillSelector from "./CuisinePillSelector";


interface CuisineFilterProps {
  onFilterChange: (cuisines: string[], palates: string[]) => void;
  selectedCuisines: string[];
  selectedPalates: string[];
  /** Fresh selection — parent must use these instead of React state to avoid stale reads after Apply. */
  onApplyFilters?: (cuisines: string[], palates: string[]) => void;
}
const CuisineFilter = ({ onFilterChange, selectedCuisines, selectedPalates, onApplyFilters }: CuisineFilterProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCuisinesSet, setSelectedCuisinesSet] = useState<Set<string>>(new Set(selectedCuisines));
  const [selectedPalatesSet, setSelectedPalatesSet] = useState<Set<string>>(new Set(selectedPalates));



  // Sync with homepage filter selections
  useEffect(() => {
    setSelectedCuisinesSet(new Set(selectedCuisines));
    setSelectedPalatesSet(new Set(selectedPalates));
  }, [selectedCuisines, selectedPalates]);

  const applyFilters = () => {
    const cuisinesArray = Array.from(selectedCuisinesSet);
    const palatesArray = Array.from(selectedPalatesSet);

    onFilterChange(cuisinesArray, palatesArray);

    if (onApplyFilters) {
      onApplyFilters(cuisinesArray, palatesArray);
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
                <CuisinePillSelector
                  selectedPalates={selectedPalatesSet}
                  onSelectedPalatesChange={setSelectedPalatesSet}
                  showSelectionMeta
                />
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
