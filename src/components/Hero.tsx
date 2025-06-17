"use client";
import { FiSearch, FiMapPin, FiNavigation } from "react-icons/fi";
import { MdStore } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import "@/styles/components/_hero.scss";
import Image from "next/image";
import CustomMultipleSelect from "@/components/ui/Select/CustomMultipleSelect";
import CustomSelect from "@/components/ui/Select/Select";
import { palateOptions } from "@/constants/formOptions";
import { Key } from "@react-types/shared";
import SelectOptions from "@/components/ui/Options/SelectOptions";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { useRouter } from "next/navigation";
import { debounce } from "@/utils/debounce";

const Hero = () => {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    // Initialize both debounced functions once
    const [debouncedPalate] = debounce(fetchAddressByPalate, 500);
    const [debouncedListing] = debounce(fetchListingsName, 500);

    fetchPalatesDebouncedRef.current = debouncedPalate;
    fetchListingsDebouncedRef.current = debouncedListing;
    fetchPalatesDebouncedRef.current?.(new Set<Key>());
    fetchListingsDebouncedRef.current?.('');
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch location data");
          }

          const data = await response.json();
          // Construct address string from response
          const address = [
            data.city,
            data.principalSubdivision,
            data.countryName,
          ]
            .filter(Boolean)
            .join(", ");

          setLocation(address);
        } catch (error) {
          console.error("Error fetching location:", error);
          alert("Unable to fetch your location");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const palateLabels = Array.from(selectedPalates).join(",");
    const queryParams = new URLSearchParams();

    if (isSearchListing && listing) {
      queryParams.set("listing", listing);
    } else {
      if (palateLabels) queryParams.set("palates", palateLabels);
      if (location) queryParams.set("address", location);
    }

    router.push(`/restaurants?${queryParams.toString()}`);
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

  const fetchAddressByPalate = async (values: Set<Key>) => {
    try {
      setAddressLoading(true);
      const slugs = Array.from(values).map((val) => val.toString());

      const result = await RestaurantService.fetchAddressByPalate("", slugs);
      const uniqueLocations = Array.from(
        new Set(result.nodes.map((r: any) => r.listingDetails?.googleMapUrl?.streetAddress?.toLowerCase().trim()))
      ).filter(Boolean);

      const locationOptionsFormatted = uniqueLocations.map((loc) => ({
        key: loc as string,
        label: loc as string,
      }));

      setLocationOptions(locationOptionsFormatted);
      setAddressLoading(false);
    } catch (error) {
      console.error("Failed to fetch restaurant locations by palate:", error);
      setAddressLoading(false);
    }
  }

  const fetchListingsName = async (search: string = '') => {
    try {
      const result = await RestaurantService.fetchListingsName(search);
      const formatted = result.nodes.map((item: any) => ({
        key: item.slug,
        label: item.title,
      }));
      setListingOptions(formatted);
    } catch (err) {
      console.error("Error loading listing options", err);
      setListingOptions([]);
    } finally {
      setListingLoading(false);
    }
  };

  const handlePalateChange = async (values: Set<Key>) => {
    setLocation('')
    setListing('')
    setSelectedPalates(values);
    const selectedLabels = Array.from(values)
      .map((value) => {
        for (const category of palateOptions) {
          const found = category.children?.find(
            (child) => child.key === value
          );
          if (found) return found.label;
        }
        return value;
      })
      .join(", ");

    setCuisine(selectedLabels);

    fetchPalatesDebouncedRef.current?.(values);
  };

  const handleCuisineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation('')
    setListing('')
    const inputValue = e.target.value;
    setCuisine(inputValue);

    const newSelection = new Set<Key>();
    const searchTerms = inputValue
      .split(",")
      .map(term => term.trim().toLowerCase())
      .filter(term => term !== "");

    if (searchTerms.length > 0) {
      palateOptions.forEach((group) => {
        group.children?.forEach((item) => {
          const itemLabel = item.label.toLowerCase();
          if (searchTerms.some(term => itemLabel.includes(term))) {
            newSelection.add(item.key);
          }
        });
      });
    }

    setSelectedPalates(newSelection);
    fetchPalatesDebouncedRef.current?.(newSelection);
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
            src="/images/hero-bg.png"
            width={1980}
            height={538}
            className="absolute inset-0 w-full -z-10 h-[538px] object-cover hidden sm:block"
            alt="Hero background"
          />
          <img
            src="/images/hero-bg-sp.png"
            width={640}
            height={466}
            className="absolute inset-0 w-full h-[466px] -z-10 object-left-top object-cover sm:hidden"
            alt="Hero background"
          />
          <h1 className="hero__title">Discover & Share Amazing Restaurant</h1>
          <p className="hero__description">
            Find and share your favourite restaurants based on your palate.
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
                    <label className="text-sm md:text-lg font-medium text-[#31343F]">
                      My Palate
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search Palate"
                        className="hero__search-input"
                        value={cuisine}
                        onChange={handleCuisineChange}
                        onClick={handlePalateInputClick}
                      />
                    </div>
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !hidden md:!flex flex-col !items-start w-[50%]">
                    <label className="text-sm md:text-lg font-medium text-[#31343F]">
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
                    value={selectedPalates}
                    onChange={handlePalateChange}
                    onClose={handleSearchModalClose}
                    placeholder="Search Palate"
                    dropDownClassName="!max-h-[350px]"
                    baseClassName="!p-0 !h-0 !top-20 !absolute !left-0 !w-[45%] z-50"
                    className="!bg-transparent !border-0 !shadow-none !w-full !cursor-default"
                  />
                  <SelectOptions
                    isLoading={addressLoading}
                    isOpen={showLocationModal}
                    options={locationOptions}
                    searchValue={location}
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
                      className="hero__search-input md:my-3.5"
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
                disabled={!listing ? (!location && !cuisine) ? true : false : false}
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
              Search by Listing Name
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
