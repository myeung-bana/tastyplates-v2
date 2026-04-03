import "@/styles/components/filter2.scss";
import { useEffect, useMemo, useState } from "react";
import { FiSliders, FiX } from "react-icons/fi";
import { PiArrowsDownUp } from "react-icons/pi";
import { usePriceRanges } from "@/hooks/usePriceRanges";
import { useHaptic } from "@/hooks/useHaptic";
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
  canUsePreferenceSort?: boolean;
  /** When `?palate=` is present — sort list by reviewers matching that palate (client-side). */
  canUsePalateContextSort?: boolean;
}

const BASE_SORT_OPTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'MY_PREFERENCE', label: 'My Preference', description: 'Ranks restaurants based on your personal palate profile and past reviews.' },
  { key: 'PALATE_CONTEXT', label: 'Palate match', description: 'Ranks by ratings from reviewers who share the selected palate.' },
  { key: 'SMART', label: 'Smart Sort', description: 'A balanced mix of rating, review count, and recency for the best overall picks.' },
  { key: 'DESC', label: 'Highest Rated', description: 'Shows the top-rated restaurants first.' },
  { key: 'ASC', label: 'Lowest Rated', description: 'Shows the lowest-rated restaurants first.' },
  { key: 'NEWEST', label: 'Newest', description: 'Shows the most recently added restaurants first.' },
];

const RATING_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 3.0, label: '3.0' },
  { value: 3.5, label: '3.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.8, label: '4.8+' },
  { value: 5.0, label: '5 Stars' },
];

const PILL_BASE =
  "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans cursor-pointer whitespace-nowrap";
const PILL_ACTIVE =
  "flex items-center gap-2 px-4 py-2 border border-[#ff7c0a] bg-[#ff7c0a] text-white rounded-[50px] transition-colors font-normal text-sm font-neusans cursor-pointer whitespace-nowrap";

const FOOTER_RESET =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans cursor-pointer";
const FOOTER_APPLY =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ff7c0a] border border-[#ff7c0a] text-white rounded-[50px] hover:bg-[#e66d08] transition-colors font-normal text-sm font-neusans cursor-pointer";

const Filter2 = ({
  onFilterChange,
  initialCuisines = [],
  initialPalates = [],
  initialSortOption = 'SMART',
  canUsePreferenceSort = false,
  canUsePalateContextSort = false,
}: Filter2Props) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState<boolean>(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialCuisines);
  const [selectedPalates, setSelectedPalates] = useState<string[]>(initialPalates);
  const [price, setPrice] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>(initialSortOption || 'SMART');

  const { priceRanges, loading: isLoadingPrices } = usePriceRanges();
  const { trigger: haptic } = useHaptic();

  const sortOptions = useMemo(() => {
    let opts = canUsePreferenceSort
      ? BASE_SORT_OPTIONS
      : BASE_SORT_OPTIONS.filter((opt) => opt.key !== 'MY_PREFERENCE');
    if (!canUsePalateContextSort) {
      opts = opts.filter((opt) => opt.key !== 'PALATE_CONTEXT');
    }
    return opts;
  }, [canUsePreferenceSort, canUsePalateContextSort]);

  useEffect(() => {
    setSelectedCuisines(initialCuisines);
    setSelectedPalates(initialPalates);
    const nextSort =
      !canUsePreferenceSort && initialSortOption === 'MY_PREFERENCE'
        ? 'SMART'
        : !canUsePalateContextSort && initialSortOption === 'PALATE_CONTEXT'
          ? 'SMART'
          : (initialSortOption || 'SMART');
    setSortOption(nextSort);
  }, [initialCuisines, initialPalates, initialSortOption, canUsePreferenceSort, canUsePalateContextSort]);

  useEffect(() => {
    if (!canUsePreferenceSort && sortOption === 'MY_PREFERENCE') {
      setSortOption('SMART');
      onFilterChange({
        cuisine: selectedCuisines,
        price: price || null,
        rating: rating > 0 ? rating : null,
        palates: selectedPalates,
        sortOption: 'SMART',
      });
    }
  }, [canUsePreferenceSort, sortOption, onFilterChange, selectedCuisines, selectedPalates, price, rating]);

  useEffect(() => {
    if (!canUsePalateContextSort && sortOption === 'PALATE_CONTEXT') {
      setSortOption('SMART');
      onFilterChange({
        cuisine: selectedCuisines,
        price: price || null,
        rating: rating > 0 ? rating : null,
        palates: selectedPalates,
        sortOption: 'SMART',
      });
    }
  }, [canUsePalateContextSort, sortOption, onFilterChange, selectedCuisines, selectedPalates, price, rating]);

  const handleCuisineChange = (cuisines: string[], palates: string[]) => {
    setSelectedCuisines(cuisines);
    setSelectedPalates(palates);
  };

  const selectPrice = (value: string) => {
    haptic("selection");
    setPrice(price === value ? "" : value);
  };

  const selectRating = (value: number) => {
    haptic("selection");
    setRating(rating === value ? 0 : value);
  };

  const resetFilter = () => {
    haptic("light");
    setPrice("");
    setRating(0);
  };

  const applyFilters = (cuisineOverride?: string[], palateOverride?: string[]) => {
    haptic("success");
    const cuisine = cuisineOverride ?? selectedCuisines;
    const palates = palateOverride ?? selectedPalates;

    onFilterChange({
      cuisine,
      price: price || null,
      rating: rating > 0 ? rating : null,
      palates,
      sortOption: sortOption || null,
    });
    setIsModalOpen(false);
  };

  const [pendingSort, setPendingSort] = useState<string>(sortOption);

  const handleSortSelect = (key: string) => {
    haptic("selection");
    setPendingSort(key);
  };

  const applySortOption = () => {
    haptic("success");
    setSortOption(pendingSort);
    setIsSortModalOpen(false);
    onFilterChange({
      cuisine: selectedCuisines,
      price: price || null,
      rating: rating > 0 ? rating : null,
      palates: selectedPalates,
      sortOption: pendingSort,
    });
  };

  const cancelSort = () => {
    haptic("light");
    setPendingSort(sortOption);
    setIsSortModalOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (price !== "") count++;
    if (rating > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <>
      {/* ─── Top bar trigger pills ─── */}
      <div className="filter2__buttons text-sm font-neusans">
        <div className="filter2__buttons-left">
          {/* Cuisine — desktop only */}
          <div className="hidden md:block">
            <CuisineFilter
              onFilterChange={handleCuisineChange}
              selectedCuisines={selectedCuisines}
              selectedPalates={selectedPalates}
              onApplyFilters={(cuisines, palates) => applyFilters(cuisines, palates)}
            />
          </div>

          {/* Price & Rating trigger (icon-only on mobile) */}
          <button
            onClick={() => { haptic("light"); setIsModalOpen(true); }}
            className={activeFiltersCount > 0 ? PILL_ACTIVE : PILL_BASE}
          >
            <FiSliders className="w-4 h-4" />
            <span className="hidden md:inline">Price & Rating</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#ff7c0a] text-[11px] font-medium">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort trigger — icon pill (icon-only on mobile) */}
        <div className="filter2__buttons-right">
          <button
            onClick={() => { haptic("light"); setPendingSort(sortOption); setIsSortModalOpen(true); }}
            className={sortOption !== 'SMART' ? PILL_ACTIVE : PILL_BASE}
            aria-label="Sort"
          >
            <PiArrowsDownUp className="w-4 h-4" />
            <span className="hidden md:inline">{sortOptions.find((s) => s.key === sortOption)?.label || 'Sort'}</span>
          </button>
        </div>
      </div>

      {/* ─── Price & Rating slide-in modal ─── */}
      <div className={`filter2__modal ${isModalOpen ? 'filter2__modal--open' : ''}`}>
        <div className="filter2__overlay" onClick={() => setIsModalOpen(false)} />
        <div className="filter2__content font-neusans">
          <div className="filter2__header">
            <h2 className="filter2__title font-neusans">Price & Rating</h2>
            <button onClick={() => setIsModalOpen(false)} className="filter2__close" aria-label="Close">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="filter2__body">
            {/* Price pills */}
            <div className="filter2__section">
              <h3 className="filter2__section-title font-neusans">Price Range</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => selectPrice("")}
                  className={price === "" ? PILL_ACTIVE : PILL_BASE}
                >
                  All Prices
                </button>
                {isLoadingPrices ? (
                  <span className="text-sm text-gray-400 font-neusans py-2">Loading…</span>
                ) : (
                  priceRanges.map((pr) => {
                    const key = pr.slug || pr.id.toString();
                    return (
                      <button
                        key={pr.id}
                        onClick={() => selectPrice(key)}
                        className={price === key ? PILL_ACTIVE : PILL_BASE}
                      >
                        {pr.display_name || pr.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Rating pills */}
            <div className="filter2__section">
              <h3 className="filter2__section-title font-neusans">Minimum Rating</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { haptic("selection"); setRating(0); }}
                  className={rating === 0 ? PILL_ACTIVE : PILL_BASE}
                >
                  Any
                </button>
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectRating(opt.value)}
                    className={rating === opt.value ? PILL_ACTIVE : PILL_BASE}
                  >
                    ★ {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="filter2__footer">
            <button onClick={resetFilter} className={FOOTER_RESET}>
              Reset
            </button>
            <button onClick={() => applyFilters()} className={FOOTER_APPLY}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ─── Sort slide-in modal ─── */}
      <div className={`filter2__modal ${isSortModalOpen ? 'filter2__modal--open' : ''}`}>
        <div className="filter2__overlay" onClick={cancelSort} />
        <div className="filter2__content font-neusans">
          <div className="filter2__header">
            <h2 className="filter2__title font-neusans">Sort by</h2>
            <button onClick={cancelSort} className="filter2__close" aria-label="Close">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="filter2__body">
            <div className="flex flex-col gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSortSelect(opt.key)}
                  className={`text-left rounded-xl px-4 py-3 border transition-colors ${
                    pendingSort === opt.key
                      ? "border-[#ff7c0a] bg-orange-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className={`block text-sm font-medium font-neusans ${
                    pendingSort === opt.key ? "text-[#ff7c0a]" : "text-gray-900"
                  }`}>
                    {opt.label}
                  </span>
                  <span className="block text-xs font-neusans text-gray-500 mt-0.5 leading-relaxed">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter2__footer">
            <button onClick={cancelSort} className={FOOTER_RESET}>
              Cancel
            </button>
            <button onClick={applySortOption} className={FOOTER_APPLY}>
              Apply Sort
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Filter2;
