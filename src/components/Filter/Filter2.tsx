import "@/styles/components/filter2.scss";
import { useEffect, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { usePriceRanges } from "@/hooks/usePriceRanges";
import CuisineFilter from "./CuisineFilter";

interface Filter2Props {
  onFilterChange: (filters: {
    cuisine?: string[] | null;
    price?: string | null;
    rating?: number | null;
    palates?: string[] | null;
    sortOption?: string | null;
  }) => void;
  initialCuisines?: string[];
  initialPalates?: string[];
  initialSortOption?: string | null;
}


const SORT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'MY_PREFERENCE', label: 'My Preference' },
  { key: 'SMART', label: 'Smart' },
  { key: 'DESC', label: 'Highest Rated' },
  { key: 'ASC', label: 'Lowest Rated' },
  { key: 'NEWEST', label: 'Newest' },
];

const Filter2 = ({
  onFilterChange,
  initialCuisines = [],
  initialPalates = [],
  initialSortOption = 'SMART',
}: Filter2Props) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialCuisines);
  const [selectedPalates, setSelectedPalates] = useState<string[]>(initialPalates);
  const [price, setPrice] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>(initialSortOption || 'SMART');

  // Use centralized usePriceRanges hook to fetch price data
  const { priceRanges, loading: isLoadingPrices } = usePriceRanges();

  // Sync with initial values from parent
  useEffect(() => {
    setSelectedCuisines(initialCuisines);
    setSelectedPalates(initialPalates);
    setSortOption(initialSortOption || 'SMART');
  }, [initialCuisines, initialPalates, initialSortOption]);

  const handleCuisineChange = (cuisines: string[], palates: string[]) => {
    setSelectedCuisines(cuisines);
    setSelectedPalates(palates);
  };

  const selectPrice = (value: string) => {
    setPrice(price === value ? "" : value);
    setIsPriceOpen(false);
  };

  const resetFilter = () => {
    setPrice("");
    setRating(0);
  };

  const applyFilters = () => {
    console.log('🔄 Filter2 applyFilters called with:', {
      cuisine: selectedCuisines,
      palates: selectedPalates,
      price: price || null,
      rating: rating > 0 ? rating : null,
      sortOption,
    });
    
    onFilterChange({
      cuisine: selectedCuisines,
      price: price || null,
      rating: rating > 0 ? rating : null,
      palates: selectedPalates,
      sortOption: sortOption || null,
    });
    setIsModalOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (price !== "") count++;
    if (rating > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Get selected price display name
  const selectedPriceDisplay = priceRanges.find(pr => pr.slug === price || pr.id.toString() === price)?.display_name || "Select Price";

  return (
    <>
      {/* Filter Buttons */}
      <div className="filter2__buttons text-sm font-neusans">
        <div className="filter2__buttons-left">
          <div className="hidden md:block">
            <CuisineFilter 
              onFilterChange={handleCuisineChange}
              selectedCuisines={selectedCuisines}
              selectedPalates={selectedPalates}
              onApplyFilters={applyFilters}
            />
          </div>
          <div className="filter2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="filter2__button font-neusans"
            >
              <span className="filter2__button-text text-sm font-neusans">
                Price & Rating
                {activeFiltersCount > 0 && (
                  <span className="filter2__badge font-neusans">{activeFiltersCount}</span>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="filter2__buttons-right">
          <CustomPopover
            isOpen={isSortOpen}
            setIsOpen={setIsSortOpen}
            align="end"
            trigger={
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="filter2__button font-neusans"
              >
                <span className="filter2__button-text text-sm font-neusans">
                  Sort: {SORT_OPTIONS.find((s) => s.key === sortOption)?.label || 'Smart'}
                </span>
              </button>
            }
            content={
              <div className="filter2__dropdown font-neusans">
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => {
                      setSortOption(opt.key);
                      setIsSortOpen(false);
                      // Apply immediately to feel snappy (no need to open modal)
                      onFilterChange({
                        cuisine: selectedCuisines,
                        price: price || null,
                        rating: rating > 0 ? rating : null,
                        palates: selectedPalates,
                        sortOption: opt.key,
                      });
                    }}
                    className={`filter2__option font-neusans ${sortOption === opt.key ? "filter2__option--active" : ""}`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>

      {/* Slide-in Modal (left) - match CuisineFilter behavior */}
      <div className={`filter2__modal ${isModalOpen ? 'filter2__modal--open' : ''}`}>
        <div className="filter2__overlay" onClick={() => setIsModalOpen(false)} />
        <div className="filter2__content font-neusans">
          {/* Header */}
          <div className="filter2__header">
            <h2 className="filter2__title font-neusans">Filter</h2>
            <button onClick={() => setIsModalOpen(false)} className="filter2__close" />
          </div>

          {/* Content */}
          <div className="filter2__body">
            {/* Price Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title font-neusans">Price</h3>
              <div className="filter2__subsection">
                <label className="filter2__label font-neusans">Price Range</label>
                <CustomPopover
                  isOpen={isPriceOpen}
                  setIsOpen={setIsPriceOpen}
                  align="center"
                  trigger={
                    <button
                      onClick={() => setIsPriceOpen(!isPriceOpen)}
                      className="filter2__select font-neusans"
                    >
                      <span className="filter2__select-text font-neusans">
                        {price ? selectedPriceDisplay : "Select Price"}
                      </span>
                      <PiCaretDown className="filter2__select-icon" />
                    </button>
                  }
                  content={
                    <div className="filter2__dropdown font-neusans">
                      <div
                        onClick={() => selectPrice("")}
                        className={`filter2__option font-neusans ${price === "" ? "filter2__option--active" : ""}`}
                      >
                        All Prices
                      </div>
                      {isLoadingPrices ? (
                        <div className="filter2__option font-neusans">Loading prices...</div>
                      ) : (
                        priceRanges.map((priceRange) => (
                          <div
                            key={priceRange.id}
                            onClick={() => selectPrice(priceRange.slug || priceRange.id.toString())}
                            className={`filter2__option font-neusans ${price === (priceRange.slug || priceRange.id.toString()) ? "filter2__option--active" : ""}`}
                          >
                            {priceRange.display_name || priceRange.name}
                          </div>
                        ))
                      )}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Rating Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title font-neusans">Rating</h3>
              <div className="filter2__rating">
                <label htmlFor="rating" className="filter2__rating-label font-neusans">
                  Over {rating}
                </label>
                <input
                  type="range"
                  id="rating"
                  name="rating"
                  value={rating}
                  min="1"
                  max="5"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRating(Number(e.target.value))}
                  className="filter2__rating-slider"
                />
                <div className="filter2__rating-labels">
                  <span className="font-neusans">1</span>
                  <span className="font-neusans">2</span>
                  <span className="font-neusans">3</span>
                  <span className="font-neusans">4</span>
                  <span className="font-neusans">5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="filter2__footer">
            <button onClick={resetFilter} className="filter2__button filter2__button--secondary font-neusans">Reset</button>
            <button onClick={applyFilters} className="filter2__button filter2__button--primary font-neusans">Apply</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Filter2;
