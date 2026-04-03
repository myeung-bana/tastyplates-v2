import "@/styles/components/cuisine-filter.scss";
import { useEffect, useState } from "react";
import { FiGlobe, FiX } from "react-icons/fi";
import { useHaptic } from "@/hooks/useHaptic";
import CuisinePillSelector from "./CuisinePillSelector";

const PILL_BASE =
  "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans cursor-pointer whitespace-nowrap";
const PILL_ACTIVE =
  "flex items-center gap-2 px-4 py-2 border border-[#ff7c0a] bg-[#ff7c0a] text-white rounded-[50px] transition-colors font-normal text-sm font-neusans cursor-pointer whitespace-nowrap";

const FOOTER_RESET =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans cursor-pointer";
const FOOTER_APPLY =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ff7c0a] border border-[#ff7c0a] text-white rounded-[50px] hover:bg-[#e66d08] transition-colors font-normal text-sm font-neusans cursor-pointer";

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
  const { trigger: haptic } = useHaptic();

  useEffect(() => {
    setSelectedCuisinesSet(new Set(selectedCuisines));
    setSelectedPalatesSet(new Set(selectedPalates));
  }, [selectedCuisines, selectedPalates]);

  const applyFilters = () => {
    haptic("success");
    const cuisinesArray = Array.from(selectedCuisinesSet);
    const palatesArray = Array.from(selectedPalatesSet);

    onFilterChange(cuisinesArray, palatesArray);

    if (onApplyFilters) {
      onApplyFilters(cuisinesArray, palatesArray);
    }

    setIsModalOpen(false);
  };

  const resetFilters = () => {
    haptic("light");
    setSelectedCuisinesSet(new Set());
    setSelectedPalatesSet(new Set());
  };

  const getActiveFiltersCount = () => {
    return selectedCuisinesSet.size + selectedPalatesSet.size;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <>
      {/* Cuisine Filter Button — matches RestaurantHeader pill style */}
      <button
        onClick={() => { haptic("light"); setIsModalOpen(true); }}
        className={activeFiltersCount > 0 ? PILL_ACTIVE : PILL_BASE}
      >
        <FiGlobe className="w-4 h-4" />
        <span>Cuisine</span>
        {activeFiltersCount > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#ff7c0a] text-[11px] font-medium">
            {activeFiltersCount}
          </span>
        )}
      </button>

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
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="cuisine-filter__body">
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

          {/* Footer — pill-style buttons */}
          <div className="cuisine-filter__footer">
            <button onClick={resetFilters} className={FOOTER_RESET}>
              Reset
            </button>
            <button onClick={applyFilters} className={FOOTER_APPLY}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CuisineFilter;
