"use client";
import { FiSearch } from "react-icons/fi";
import { MdStore } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import "@/styles/components/_hero.scss";
import CustomMultipleSelect from "@/components/ui/Select/CustomMultipleSelect";
import { palateOptions } from "@/constants/formOptions";
import { Key } from "@react-types/shared";
import SelectOptions from "@/components/ui/Options/SelectOptions";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { useRouter } from "next/navigation";
import { debounce } from "@/utils/debounce";
import { RESTAURANTS } from "@/constants/pages";
import { PAGE } from "@/lib/utils";
// Removed unused imports
import { HERO_BG, HERO_BG_SP } from "@/constants/images";

const restaurantService = new RestaurantService();

const Hero = () => {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  // Removed unused state
  const [addressLoading, setAddressLoading] = useState(false);
  const [isSearchListing, setIsSearchListing] = useState(false);
  const [listing, setListing] = useState("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationOptions, setLocationOptions] = useState<{
    key: string;
    label: string;
    children?: any[];
  }[]>([]);
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingOptions, setListingOptions] = useState<{ key: string; label: string }[]>([]);
  const [listingLoading, setListingLoading] = useState(false);
  const fetchPalatesDebouncedRef = useRef<(values: Set<Key>) => void>();
  const fetchListingsDebouncedRef = useRef<(input: string) => void>();
  const [currentPage, setCurrentPage] = useState(1);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [listingEndCursor, setListingEndCursor] = useState<string | null>(null);
  const [listingHasNextPage, setListingHasNextPage] = useState(false);
  const [listingCurrentPage, setListingCurrentPage] = useState(1);

  useEffect(() => {
    // Initialize both debounced functions once
    const [debouncedPalate] = debounce(fetchAddressByPalate, 500);
    const [debouncedListing] = debounce(fetchListingsName, 500);

    fetchPalatesDebouncedRef.current = debouncedPalate;
    fetchListingsDebouncedRef.current = debouncedListing;
    fetchPalatesDebouncedRef.current?.(new Set<Key>());
    fetchListingsDebouncedRef.current?.('');
  }, []);

  // Removed unused function

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (isSearchListing && listing) {
      queryParams.set("listing", listing);
    } else {
      if (selectedPalates.size > 0) {
        const selectedSlugs = Array.from(selectedPalates).map(key => key.toString());
        queryParams.set("ethnic", selectedSlugs.join(','));
      } else if (cuisine) { 
        let ethnicValue = cuisine;
        if (cuisine.startsWith("What ") && cuisine.endsWith(" like to eat?")) {
          ethnicValue = cuisine.substring("What ".length, cuisine.length - " like to eat?".length);
        }
        if (ethnicValue) {
            queryParams.set("ethnic", ethnicValue);
        }
      }
      if (location) queryParams.set("address", location);
    }

    router.push(PAGE(RESTAURANTS, [], queryParams.toString()));
  };

  const searchByListingName = () => {
    setIsSearchListing(!isSearchListing);
  };

  const handlePalateInputClick = () => {
    setShowSearchModal(true);
  };

  const handleLocationInputClick = async () => {
    setShowLocationModal(true)
  };

  const fetchAddressByPalate = async (values: Set<Key>, page = 1) => {
    try {
      setAddressLoading(true);
      const slugs = Array.from(values).map((val) => val.toString());

      const result = await restaurantService.fetchAddressByPalate("", slugs, 32, page === 1 ? null : endCursor);
      const uniqueLocations = Array.from(
        new Set(result.nodes.map((r: any) => r.listingDetails?.googleMapUrl?.streetAddress?.toLowerCase().trim()))
      ).filter(Boolean);

      const locationOptionsFormatted = uniqueLocations.map((loc) => ({
        key: loc as string,
        label: loc as string,
      }));

      setLocationOptions(prev => page === 1 ? locationOptionsFormatted : [...prev, ...locationOptionsFormatted]);
      setCurrentPage(page);
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
      setAddressLoading(false);
    } catch (error) {
      console.error("Failed to fetch restaurant locations by palate:", error);
      setAddressLoading(false);
    }
  }

  const fetchListingsName = async (search: string = '', page = 1) => {
    try {
      setListingLoading(true);
      const result = await restaurantService.fetchListingsName(
        search,
        32,
        page === 1 ? null : listingEndCursor
      );
      const formatted = result.nodes.map((item: any) => ({
        key: item.slug,
        label: item.title,
      }));
      setListingOptions(prev => page === 1 ? formatted : [...prev, ...formatted]);
      setListingCurrentPage(page);
      setListingEndCursor(result.pageInfo.endCursor);
      setListingHasNextPage(result.pageInfo.hasNextPage);
    } catch (err) {
      console.error("Error loading listing options", err);
      setListingOptions([]);
    } finally {
      setListingLoading(false);
    }
  };

  const handlePalateChange = async (values: Set<Key>, selectedHeaderLabel: string | null) => {
    setLocation('');
    setListing('');
    const childValues = new Set<Key>();

    if (selectedHeaderLabel) {
      const matchedGroup = palateOptions.find(
        (group) => group.label == selectedHeaderLabel
      );
  
      if (matchedGroup && matchedGroup.children) {
        matchedGroup.children.forEach((child) => {
          childValues.add(child.key);
        });
      }
      // setCuisine(`What ${selectedHeaderLabel} like to eat?`);
      setCuisine(selectedHeaderLabel)
    } else if (values.size > 0) {
      const selectedChildKey = Array.from(values)[0];
      const selectedChild = palateOptions.flatMap(opt => opt.children || []).find(child => child.key === selectedChildKey);
      if (selectedChild) {
        // setCuisine(`What ${selectedChild.label} like to eat?`);
        setCuisine(selectedChild.label)
      } else {
        setCuisine('');
      }
    } else {
      setCuisine('');
    }

    setSelectedPalates(values);
    // if childValues size is 0, the header checkbox is not check
    fetchPalatesDebouncedRef.current?.(childValues.size == 0 ? values : childValues);
  };

  const handleCuisineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation('')
    setListing('')
    const inputValue = e.target.value;
    setCuisine(inputValue);

    setSelectedPalates(new Set<Key>());
  };

  const handleListingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setListing(inputValue);
    setLocation('');
    setCuisine('');
    setShowListingModal(true);

    const normalizedSearch = inputValue.trim().toLowerCase();
    const alreadyExists = listingOptions.some(
      (option) => option.label.toLowerCase().includes(normalizedSearch)
    );

    if (alreadyExists) return;
    setListingLoading(true);

    fetchListingsDebouncedRef.current?.(inputValue.trim());
  };

  const handleSearchModalClose = () => {
    setShowSearchModal(false);
  };

  return (
    <section className="hero mx-auto">
      <div className="hero__container mx-auto">
        <div className="hero__content mx-auto">
          <img
            src={HERO_BG}
            width={1980}
            height={538}
            className="absolute inset-0 w-full -z-10 h-[538px] object-cover object-[70%] hidden sm:block"
            alt="Hero background"
          />
          <img
            src={HERO_BG_SP}
            width={640}
            height={466}
            className="absolute inset-0 w-full h-[466px] -z-10 object-left-top object-cover sm:hidden"
            alt="Hero background"
          />
          <h1 className="hero__title">Discover the Meal that fits Your Taste</h1>
          <p className="hero__description">
          Dine like a Brazilian in Tokyo - or Korean in New York?
          </p>
          <form onSubmit={handleSearch} className="hero__search">
            <div className="hero__search-wrapper relative">
              {/* Mobile Search - Restaurant Name */}
              <div className="hero__search-restaurant text-center md:!hidden">
                <input
                  type="text"
                  placeholder="Start Your Search"
                  className="hero__search-input text-center"
                  value={cuisine}
                  onChange={(e) => {
                    setCuisine(e.target.value)
                    setListing('')
                  }}
                />
              </div>
              {!isSearchListing ? (
                <>
                  <div className="hero__search-restaurant !hidden md:!flex flex-col !items-start w-[50%]">
                    <label className="text-sm md:text-[0.9rem] font-medium text-[#31343F]">
                      {/* {cuisine.length > 0 ? "" : "What ______ like to eat?"} */}
                      Discover by Cultural Palate
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search Cuisine"
                        className="hero__search-input"
                        value={cuisine}
                        onChange={handleCuisineChange}
                        onClick={handlePalateInputClick}
                      />
                    </div>
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !hidden md:!flex flex-col !items-start w-[50%]">
                    <label className="text-sm md:text-[0.9rem] font-medium text-[#31343F]">
                      Location
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search location"
                        className="hero__search-input"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value)
                          setListing('')
                        }}
                        onClick={handleLocationInputClick}
                      />
                    </div>
                  </div>
                  <CustomMultipleSelect
                    enableCheckboxHeader={true}
                    enableSelectionDropdown={true}
                    hideTagRendering={true}
                    showModal={showSearchModal}
                    hideDropdownLabel={true}
                    hideDropdownSearch={true}
                    items={palateOptions}
                    limitValueLength={1}
                    value={selectedPalates}
                    onSelectionChangeWithHeader={handlePalateChange}
                    onClose={handleSearchModalClose}
                    placeholder="Search Cuisine"
                    dropDownClassName="!max-h-[350px]"
                    baseClassName="!p-0 !h-0 !top-20 !absolute !left-0 !w-[45%] z-50"
                    className="!bg-transparent !border-0 !shadow-none !w-full !cursor-default"
                  />
                  <SelectOptions
                    isLoading={addressLoading}
                    isOpen={showLocationModal}
                    options={locationOptions}
                    searchValue={location}
                    hasNextPage={hasNextPage}
                    onLoadMore={() => fetchAddressByPalate(selectedPalates, currentPage + 1)}
                    onSelect={(label) => {
                      setLocation(label);
                      setShowLocationModal(false);
                      setListing('')
                    }}
                    onClose={() => setShowLocationModal(false)}
                    className="!p-2 !top-20 !absolute !right-0 !w-[55%] z-50 !max-h-[350px]"
                  />
                </>
              ) : (
                <>
                  <div className="hero__search-restaurant !bg-transparent">
                    <FiSearch className="hero__search-icon" />
                    <input
                      type="text"
                      placeholder="Search by Listing Name"
                      className="hero__search-input"
                      value={listing}
                      onChange={(e) => {
                        handleListingChange(e)
                      }}
                      onClick={() => {
                        setShowListingModal(true)
                      }}
                    />
                  </div>
                  <SelectOptions
                    isOpen={showListingModal}
                    isLoading={listingLoading}
                    options={listingOptions}
                    searchValue={listing}
                    hasNextPage={listingHasNextPage}
                    onLoadMore={() => fetchListingsName(listing.trim(), listingCurrentPage + 1)}
                    onSelect={(label) => {
                      setListing(label);
                      setShowListingModal(false);
                      setLocation('');
                      setCuisine('');
                    }}
                    onClose={() => setShowListingModal(false)}
                    className="!p-2 !top-20 !absolute !left-0 !w-full z-50 !max-h-[350px]"
                  />
                </>
              )}
              <button
                type="submit"
                className="hero__search-button h-8 w-8 sm:h-11 sm:w-11 text-center"
                disabled={!listing && !location && !cuisine && selectedPalates.size === 0}
              >
                <FiSearch className="hero__search-icon stroke-white" />
              </button>
            </div>
          </form>
          <div className="flex gap-2 justify-center mt-6 items-center">
            <MdStore className="size-4 sm:size-5 fill-[#FCFCFC]" />
            <button
              onClick={searchByListingName}
              className="border-b border-[#FCFCFC] font-semibold text-sm sm:text-base text-[#FCFCFC] leading-5"
            >
              {!isSearchListing ? ("Search by Listing Name") : ("Search by Palate")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;