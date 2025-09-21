import "@/styles/components/cuisine-filter.scss";
import { useEffect, useState } from "react";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";

interface Palate {
  key: string;
  label: string;
  children: {
    key: string;
    label: string;
  }[];
}

interface CuisineFilterProps {
  onFilterChange: (cuisines: string[], palates: string[]) => void;
  selectedCuisines: string[];
  selectedPalates: string[];
  onApplyFilters?: () => void;
}

const categoryService = new CategoryService();
const palateService = new PalatesService();

// Featured cuisines from homepage
const featuredCuisines = [
  "Italian",
  "Japanese", 
  "American",
  "Chinese",
  "Indian",
  "Thai"
];

// Regional palate organization
const palateRegions = {
  "East Asian": ["Chinese", "Japanese", "Korean", "Mongolian", "Taiwanese"],
  "South Asian": ["Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepalese", "Afghan"],
  "South East Asian": ["Thai", "Vietnamese", "Indonesian", "Malaysian", "Filipino", "Singaporean", "Cambodian", "Laotian", "Myanmar"],
  "Middle Eastern": ["Turkish", "Lebanese", "Iranian", "Israeli", "Syrian", "Jordanian", "Iraqi", "Egyptian", "Moroccan"],
  "African": ["Ethiopian", "Nigerian", "South African", "Moroccan", "Egyptian", "Kenyan", "Ghanaian", "Senegalese"],
  "North American": ["American", "Canadian", "Mexican", "Cuban", "Jamaican", "Haitian", "Dominican"],
  "European": ["Italian", "French", "Spanish", "German", "British", "Greek", "Portuguese", "Polish", "Russian", "Swedish", "Norwegian", "Dutch", "Belgian", "Swiss", "Austrian"],
  "Oceanic": ["Australian", "New Zealand", "Fijian", "Tongan", "Samoan", "Hawaiian"]
};

const CuisineFilter = ({ onFilterChange, selectedCuisines, selectedPalates, onApplyFilters }: CuisineFilterProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCuisinesSet, setSelectedCuisinesSet] = useState<Set<string>>(new Set(selectedCuisines));
  const [selectedPalatesSet, setSelectedPalatesSet] = useState<Set<string>>(new Set(selectedPalates));
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [dbCuisines, setDbCuisines] = useState<{ name: string; slug: string }[]>([]);
  const [dbPalates, setDbPalates] = useState<Palate[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isLoadingPalates, setIsLoadingPalates] = useState<boolean>(true);

  useEffect(() => {
    categoryService.fetchCategories()
      .then((data) => {
        setDbCuisines((data as unknown as { name: string; slug: string; }[]) || []);
      })
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  useEffect(() => {
    palateService.fetchPalates()
      .then((data) => {
        const allChildSlugs = new Set<string>();
        (data as unknown as Record<string, unknown>[])?.forEach((p: Record<string, unknown>) => {
          ((p.children as Record<string, unknown>)?.nodes as Record<string, unknown>[])?.forEach((c: Record<string, unknown>) => {
            allChildSlugs.add((c.slug as string) || (c.databaseId as number).toString());
          });
        });

        const rootPalates = (data as unknown as Record<string, unknown>[])?.filter((p: Record<string, unknown>) =>
          !allChildSlugs.has((p.slug as string) || (p.databaseId as number).toString())
        ) || [];

        const transformedPalates: Palate[] = rootPalates.map((p: Record<string, unknown>) => ({
          key: (p.slug as string) || (p.databaseId as number).toString(),
          label: p.name as string,
          children: ((p.children as Record<string, unknown>)?.nodes as Record<string, unknown>[])?.map((c: Record<string, unknown>) => ({
            key: (c.slug as string) || (c.databaseId as number).toString(),
            label: c.name as string,
          })) || [],
        })) || [];

        setDbPalates(transformedPalates);
      })
      .catch((error) => console.error("Error fetching palates:", error))
      .finally(() => setIsLoadingPalates(false));
  }, []);

  // Sync with homepage filter selections
  useEffect(() => {
    console.log('🔄 CuisineFilter syncing with:', { selectedCuisines, selectedPalates });
    setSelectedCuisinesSet(new Set(selectedCuisines));
    setSelectedPalatesSet(new Set(selectedPalates));
    
    // Update region selection based on palate selection
    const updatedRegions = new Set<string>();
    Object.keys(palateRegions).forEach(region => {
      const regionPalates = getPalatesInRegion(region);
      if (regionPalates.every(palate => selectedPalates.includes(palate))) {
        updatedRegions.add(region);
      }
    });
    setSelectedRegions(updatedRegions);
  }, [selectedCuisines, selectedPalates]);

  // Filter cuisines to only show featured ones
  const featuredCuisineData = dbCuisines.filter(cuisine => 
    featuredCuisines.includes(cuisine.name)
  );

  // Helper function to get all palates in a region
  const getPalatesInRegion = (region: string): string[] => {
    return palateRegions[region as keyof typeof palateRegions] || [];
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

  const handleCuisineChange = (slug: string) => {
    setSelectedCuisinesSet((prevSelectedCuisines) => {
      const newSelection = new Set(prevSelectedCuisines);
      if (newSelection.has(slug)) {
        newSelection.delete(slug);
      } else {
        newSelection.add(slug);
      }
      return newSelection;
    });
  };

  const handlePalateChange = (keys: Set<string>) => {
    setSelectedPalatesSet(keys);
  };

  // Handle region selection - select/deselect all palates in region
  const handleRegionChange = (region: string) => {
    const regionPalates = getPalatesInRegion(region);
    const newPalatesSet = new Set(selectedPalatesSet);
    
    if (isRegionFullySelected(region)) {
      // If region is fully selected, deselect all palates in region
      regionPalates.forEach(palate => newPalatesSet.delete(palate));
      setSelectedRegions(prev => {
        const newRegions = new Set(prev);
        newRegions.delete(region);
        return newRegions;
      });
    } else {
      // If region is not fully selected, select all palates in region
      regionPalates.forEach(palate => newPalatesSet.add(palate));
      setSelectedRegions(prev => {
        const newRegions = new Set(prev);
        newRegions.add(region);
        return newRegions;
      });
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
    
    // Update region selection based on palate selection
    const updatedRegions = new Set<string>();
    Object.keys(palateRegions).forEach(region => {
      const regionPalates = getPalatesInRegion(region);
      if (regionPalates.every(p => newPalatesSet.has(p))) {
        updatedRegions.add(region);
      }
    });
    setSelectedRegions(updatedRegions);
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
    setSelectedRegions(new Set());
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
