import "@/styles/components/filter2.scss";
import { useEffect, useState } from "react";
import { PiCaretDown, PiX } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { CategoryService } from "@/services/category/categoryService";
import { STAR } from "@/constants/images";
import { capitalizeFirstLetter } from "@/lib/utils";
import Image from "next/image";
import CuisineFilter from "./CuisineFilter";

interface Filter2Props {
  onFilterChange: (filters: {
    cuisine?: string[] | null;
    price?: string | null;
    rating?: number | null;
    badges?: string | null;
    sortOption?: string | null;
    palates?: string[] | null;
  }) => void;
  initialCuisines?: string[];
  initialPalates?: string[];
}

interface Palate {
  key: string;
  label: string;
  children: {
    key: string;
    label: string;
  }[];
}

const categoryService = new CategoryService();

const Filter2 = ({ onFilterChange, initialCuisines = [], initialPalates = [] }: Filter2Props) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialCuisines);
  const [selectedPalates, setSelectedPalates] = useState<string[]>(initialPalates);
  const [price, setPrice] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [badge, setBadge] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("None");

  const [dbCuisines, setDbCuisines] = useState<{ name: string; slug: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);

  // Sync with initial values from parent
  useEffect(() => {
    setSelectedCuisines(initialCuisines);
    setSelectedPalates(initialPalates);
  }, [initialCuisines, initialPalates]);

  useEffect(() => {
    categoryService.fetchCategories()
      .then((data) => {
        setDbCuisines((data as unknown as { name: string; slug: string; }[]) || []);
      })
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const prices = [
    { name: "$", value: "$" },
    { name: "$$", value: "$$" },
    { name: "$$$", value: "$$$" },
  ];

  const badges = [
    { name: 'All', value: 'All' },
    { name: 'Best Service', value: 'Best Service' },
    { name: 'Insta Worthy', value: 'Insta-Worthy' },
    { name: 'Must Revisit', value: 'Must Revisit' },
    { name: 'Value For Money', value: 'Value for Money' },
  ];

  const sortOptions = [
    { name: 'none', value: 'None' },
    { name: 'ASC', value: 'Ascending (Lowest to Highest)' },
    { name: 'DESC', value: 'Descending (Highest to Lowest)' },
  ];

  const handleCuisineChange = (cuisines: string[], palates: string[]) => {
    setSelectedCuisines(cuisines);
    setSelectedPalates(palates);
  };



  const selectFilter = (value: string, type?: string) => {
    switch (type) {
      case 'badge':
        setBadge(value);
        setIsBadgeOpen(false);
        break;
      case 'sortOption':
        setSortOption(value);
        setIsSortOpen(false);
        break;
      default:
        const newSelection = new Set(selectedCuisines);
        if (newSelection.has(value)) {
          newSelection.delete(value);
        } else {
          newSelection.add(value);
        }
        setSelectedCuisines(newSelection);
        setIsCuisineOpen(false);
        break;
    }
  };

  const handleChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(price === value ? "" : value);
  };

  const resetFilter = () => {
    setPrice("");
    setBadge("All");
    setSortOption("None");
    setRating(0);
  };

  const applyFilters = () => {
    console.log('🔄 Filter2 applyFilters called with:', {
      cuisine: selectedCuisines,
      palates: selectedPalates,
      price: price || null,
      rating: rating > 0 ? rating : null,
      badges: badge === "All" ? null : badge,
      sortOption: sortOption === "None" ? null : sortOption,
    });
    
    onFilterChange({
      cuisine: selectedCuisines,
      price: price || null,
      rating: rating > 0 ? rating : null,
      badges: badge === "All" ? null : badge,
      sortOption: sortOption === "None" ? null : sortOption,
      palates: selectedPalates,
    });
    setIsModalOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (price !== "") count++;
    if (badge !== "All") count++;
    if (rating > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <>
      {/* Filter Buttons */}
      <div className="filter2__buttons">
        <CuisineFilter 
          onFilterChange={handleCuisineChange}
          selectedCuisines={selectedCuisines}
          selectedPalates={selectedPalates}
          onApplyFilters={applyFilters}
        />
        <div className="filter2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="filter2__button"
          >
            <span className="filter2__button-text">
              Filter
              {activeFiltersCount > 0 && (
                <span className="filter2__badge">{activeFiltersCount}</span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Slide-in Modal */}
      <div className={`filter2__modal ${isModalOpen ? 'filter2__modal--open' : ''}`}>
        <div className="filter2__overlay" onClick={() => setIsModalOpen(false)} />
        <div className="filter2__content">
          {/* Header */}
          <div className="filter2__header">
            <h2 className="filter2__title">Filter</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="filter2__close"
            >
              <PiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="filter2__body">
            {/* Category Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title">Category</h3>
              <div className="filter2__subsection">
                <label className="filter2__label">All Categories</label>
                <CustomPopover
                  isOpen={isCuisineOpen}
                  setIsOpen={setIsCuisineOpen}
                  align="center"
                  trigger={
                    <button
                      onClick={() => setIsCuisineOpen(!isCuisineOpen)}
                      className="filter2__select"
                    >
                      <span className="filter2__select-text">
                        {selectedCuisines.length > 0
                          ? selectedCuisines.join(", ")
                          : "Select Categories"}
                      </span>
                      <PiCaretDown className="filter2__select-icon" />
                    </button>
                  }
                  content={
                    <div className="filter2__dropdown">
                      <div
                        onClick={() => setSelectedCuisines([])}
                        className={`filter2__option ${selectedCuisines.length === 0 ? "filter2__option--active" : ""}`}
                      >
                        All
                      </div>
                      {isLoadingCategories ? (
                        <div className="filter2__option">Loading categories...</div>
                      ) : (
                        dbCuisines.map((item: { name: string, slug: string }, index: number) => (
                          <div
                            key={index}
                            className="filter2__option filter2__option--checkbox"
                            onClick={() => {
                              const newSelection = [...selectedCuisines];
                              const slug = item.slug || item.name;
                              if (newSelection.includes(slug)) {
                                setSelectedCuisines(newSelection.filter(s => s !== slug));
                              } else {
                                setSelectedCuisines([...newSelection, slug]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              className="filter2__checkbox"
                              checked={selectedCuisines.includes(item.slug || item.name)}
                              readOnly
                            />
                            <label className="filter2__checkbox-label">
                              {item.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Price Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title">Price</h3>
              <div className="filter2__price-grid">
                {prices.map((item, index) => (
                  <div key={index} className="filter2__price-item">
                    <div className={`filter2__price-option ${price === item.value ? "filter2__price-option--active" : ""}`}>
                      <input
                        id={`price-${index}`}
                        type="checkbox"
                        name="price"
                        value={item.value as string}
                        checked={price === item.value}
                        onChange={handleChangePrice}
                        className="filter2__price-input"
                      />
                      <label
                        htmlFor={`price-${index}`}
                        className="filter2__price-label"
                      >
                        {item.name}
                      </label>
                    </div>
                    {index < prices.length - 1 && (
                      <div className="filter2__price-divider" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title">Badges</h3>
              <div className="filter2__subsection">
                <label className="filter2__label">Badges</label>
                <CustomPopover
                  isOpen={isBadgeOpen}
                  setIsOpen={setIsBadgeOpen}
                  align="center"
                  trigger={
                    <button
                      onClick={() => setIsBadgeOpen(!isBadgeOpen)}
                      className="filter2__select"
                    >
                      <span className="filter2__select-text">
                        {badge === "all" ? "All" : badges?.find(b => b.name === badge)?.value || "All"}
                      </span>
                      <PiCaretDown className="filter2__select-icon" />
                    </button>
                  }
                  content={
                    <div className="filter2__dropdown">
                      {badges?.map((item: Record<string, unknown>, index: number) => (
                        <div
                          onClick={() => selectFilter(item.name as string, 'badge')}
                          className={`filter2__option ${badge == item.name ? "filter2__option--active" : ""}`}
                          key={index}
                        >
                          {item.value as string}
                        </div>
                      ))}
                    </div>
                  }
                />
              </div>
              <div className="filter2__subsection">
                <label className="filter2__label">Sort By</label>
                <CustomPopover
                  isOpen={isSortOpen}
                  setIsOpen={setIsSortOpen}
                  align="center"
                  trigger={
                    <button
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="filter2__select"
                    >
                      <span className="filter2__select-text">
                        {sortOption === "none" ? "None" : sortOptions.find(s => s.name === sortOption)?.value || "None"}
                      </span>
                      <PiCaretDown className="filter2__select-icon" />
                    </button>
                  }
                  content={
                    <div className="filter2__dropdown">
                      {sortOptions.map((item, index) => (
                        <div
                          onClick={() => selectFilter(item.name, 'sortOption')}
                          className={`filter2__option ${sortOption == item.name ? "filter2__option--active" : ""}`}
                          key={index}
                        >
                          {item.value as string}
                        </div>
                      ))}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Rating Section */}
            <div className="filter2__section">
              <h3 className="filter2__section-title">Rating</h3>
              <div className="filter2__rating">
                <label htmlFor="rating" className="filter2__rating-label">
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
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="filter2__footer">
            <button
              onClick={resetFilter}
              className="filter2__button filter2__button--secondary"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="filter2__button filter2__button--primary"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Filter2;
