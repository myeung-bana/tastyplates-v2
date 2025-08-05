// app/components/AddListing.tsx

"use client";
import React, { FormEvent, useEffect, useState, Suspense, useRef, useCallback } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import Rating from "../Review/Rating";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";
import { useSession } from "next-auth/react";
import Select, { components } from "react-select";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { ReviewService } from "@/services/Reviews/reviewService";
import CustomOption from "@/components/ui/Select/CustomOption";
import debounce from 'lodash.debounce';
import { LISTING, LISTING_DRAFT, WRITING_GUIDELINES } from "@/constants/pages";
import FallbackImage from "@/components/ui/Image/FallbackImage";
import { CASH, FLAG, HELMET, PHONE } from "@/constants/images";
import { maximumImage, minimumImage, reviewDescriptionLimit, reviewTitleLimit, listingTitleLimit } from "@/constants/validation";
import { set } from "date-fns";
import { maximumImageLimit, maximumReviewDescription, maximumReviewTitle, minimumImageLimit, maximumListingTitle } from "@/constants/messages";

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}
const AddListingPage = (props: any) => {
  const [listing, setListing] = useState({
    address: "",
    latitude: 0,
    longitude: 0,
    category: "",
    name: "",
    priceRange: "",
    title: "",
    content: "",
    phone: "",
    openingHours: "",
    palates: [],
    listingCategories: [],
    countries: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 1);
  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedrecognition, setSelectedRecognition] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [palates, setPalates] = useState([]);
  const [selectedPalates, setSelectedPalates] = useState<
    { label: string; value: string }[]
  >([]);
  const { data: session, status } = useSession();
  const sess = session?.accessToken || "";
  const [reviewMainTitle, setReviewMainTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewStars, setReviewStars] = useState(0);
  const searchParams = useSearchParams();

  const [currentRestaurantDbId, setCurrentRestaurantDbId] = useState(0);

  const [descriptionError, setDescriptionError] = useState("");
  const [uploadedImageError, setUploadedImageError] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [nameError, setNameError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [palatesError, setPalatesError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [priceRangeError, setPriceRangeError] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [addressPredictions, setAddressPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const [reviewTitleError, setReviewTitleError] = useState('');

  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API Key is not set in environment variables.");
      return;
    }

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setAutocompleteService(new window.google.maps.places.AutocompleteService());
          const dummyDiv = document.createElement('div');
          setPlacesService(new window.google.maps.places.PlacesService(dummyDiv));
        }
      };
    } else {
      if (window.google && window.google.maps && window.google.maps.places) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
        const dummyDiv = document.createElement('div');
        setPlacesService(new window.google.maps.places.PlacesService(dummyDiv));
      }
    }
  }, []);

  const CustomGroupHeading = (props: any) => (
    <components.GroupHeading {...props}>
      <span className="font-bold text-black text-[13px]">{props.children}</span>
    </components.GroupHeading>
  );

  const palateOptions = palates.map((group: any) => ({
    label: group.name,
    options: group.children.nodes.map((cuisine: any) => ({
      value: cuisine.databaseId,
      label: cuisine.name,
    })),
  }));

  const validateStep1 = () => {
    let isValid = true;
    if (!listing.name) {
      setNameError("Listing name is required.");
      isValid = false;
    } else if (listing.name.length > listingTitleLimit) {
      setNameError(maximumListingTitle(listingTitleLimit));
      isValid = false;
    } else {
      setNameError("");
    }
    if (!listing.listingCategories || listing.listingCategories.length === 0) {
      setCategoryError("At least one category is required.");
      isValid = false;
    } else {
      setCategoryError("");
    }
    if (selectedPalates.length === 0) {
      setPalatesError("At least one cuisine must be selected.");
      isValid = false;
    } else {
      setPalatesError("");
    }
    if (!listing.address) {
      setAddressError("Address is required.");
      isValid = false;
    } else {
      setAddressError("");
    }
    if (!listing.priceRange) {
      setPriceRangeError("Price range is required.");
      isValid = false;
    } else {
      setPriceRangeError("");
    }
    return isValid;
  };


  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // Use a custom modal or toast for alerts instead of window.alert
      // alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!placesService) {
        console.error("PlacesService not initialized.");
        // alert("Google Maps services not ready.");
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setListing((prev) => ({
            ...prev,
            address: formattedAddress,
            latitude: lat,
            longitude: lng,
          }));
          setAddressError("");
        } else {
          console.error("Geocoding error:", status, results);
          // alert("Failed to get address from Google Maps");
        }
      });
    }, (error) => {
      // Use a custom modal or toast for alerts instead of window.alert
      // alert("Unable to retrieve your location");
      console.error(error);
    });
  };

  const handleChange = (selected: any) => {
    if (selected.length <= 2) {
      setSelectedPalates(selected);
      setPalatesError("");
    } else {
      setPalatesError("You can select a maximum of 2 cuisines.");
      setSelectedPalates(selected.slice(0, 2));
    }
  };

  useEffect(() => {
    CategoryService.fetchCategories()
      .then(setCategories)
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    PalatesService.fetchPalates()
      .then(setPalates)
      .catch((error) => console.error("Error fetching palates:", error))
      .finally(() => setIsLoading(false));
  }, []);

  const tags = [
    { id: 1, name: "Must Revisit", icon: FLAG },
    { id: 2, name: "Insta-Worthy", icon: PHONE },
    { id: 3, name: "Value for Money", icon: CASH },
    { id: 4, name: "Best Service", icon: HELMET },
  ];

  const prices = [
    { name: "$", value: "$" },
    { name: "$$", value: "$$" },
    { name: "$$$", value: "$$$" },
  ];

  const handleChangePrice = (value: string) => {
    setListing({ ...listing, priceRange: value });
    setPriceRangeError("");
  };

  const handleChangeRecognition = (tagName: string) => {
    setSelectedRecognition((prev) =>
      prev.includes(tagName)
        ? prev.filter((name) => name !== tagName)
        : [...prev, tagName]
    );
  };

  const handleRating = (rate: number) => {
    setReviewStars(rate);
    setRatingError("");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const resIdFromUrl = searchParams?.get("resId");
      const fetchDraftDetails = async () => {
        const currentResId = Number(resIdFromUrl);

        if (currentResId > 0) {
          setIsLoading(true);
          try {
            const restaurantData = await RestaurantService.fetchRestaurantById(
              currentResId.toString(),
              "DATABASE_ID"
            );
            localStorage.setItem('restID', currentResId.toString());

            if (restaurantData) {
              const initialSelectedPalates = restaurantData.palates?.nodes?.map((palate: any) => ({
                label: palate.name,
                value: palate.databaseId,
              })) || [];
              const initialCategory = restaurantData.listingCategories?.nodes?.[0]?.name || "";

              setListing((prevListing) => ({
                ...prevListing,
                name: restaurantData.title || "",
                title: restaurantData.title || "",
                content: restaurantData.content || "",
                address: restaurantData.listingDetails?.googleMapUrl?.streetAddress || restaurantData.listingStreet || "",
                latitude: restaurantData.listingDetails?.googleMapUrl?.latitude || 0,
                longitude: restaurantData.listingDetails?.googleMapUrl?.longitude || 0,
                phone: restaurantData.listingDetails?.phone || "",
                openingHours: restaurantData.listingDetails?.openingHours || "",
                priceRange: restaurantData.priceRange || "",
                category: initialCategory,
              }));
              setSelectedPalates(initialSelectedPalates);
              setCurrentRestaurantDbId(restaurantData.databaseId || 0);
              setStep(1);
            } else {
              console.warn("No data returned for resId:", currentResId);
            }
          } catch (error) {
            console.error("Failed to fetch draft details:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      };

      fetchDraftDetails();
    }
  }, [searchParams]);

  const submitListingAndReview = async (
    e: FormEvent,
    options: {
      action: "continue" | "saveDraft"| "publish";
      listingStatus?: "pending" | "draft";
      reviewMode?: "draft";
      isSaveAndExit?: boolean;
      includeReview?: boolean;
    }
  ) => {
    e.preventDefault();

    const { action, listingStatus = "draft", reviewMode = "draft", isSaveAndExit = false, includeReview = false } = options;

    // ✅ Step 1 Validation
    if (!validateStep1() && currentRestaurantDbId === 0) {
      return;
    }

   
    if (action === "continue") {
      setIsLoading(true);
      setTimeout(() => {
        setStep(2);
        setIsLoading(false);
      }, 300);
      return;
    }

    let hasError = false;

    // ✅ Review validation if review is included
    if (includeReview) {
      if (reviewStars === 0) {
        setRatingError("Rating is required.");
        hasError = true;
      } else {
        setRatingError("");
      }

      if (selectedFiles.length < minimumImage) {
        setUploadedImageError(minimumImageLimit(minimumImage));
        hasError = true;
      } else if (selectedFiles.length > maximumImage) {
        setUploadedImageError(maximumImageLimit(maximumImage));
        hasError = true;
      } else {
        setUploadedImageError("");
      }

      if (content.trim() === "") {
        setDescriptionError("Description is required.");
        hasError = true;
      } else if (content.length > reviewDescriptionLimit) {
        setDescriptionError(maximumReviewDescription(reviewDescriptionLimit));
        hasError = true;
      } else {
        setDescriptionError("");
      }

      if (reviewMainTitle.length > reviewTitleLimit) {
        setReviewTitleError(maximumReviewTitle(reviewTitleLimit));
        hasError = true;
      } else {
        setReviewTitleError("");
      }
    }

    if (hasError) return;

    // ✅ Loading states
    isSaveAndExit || action === "saveDraft" ? setIsLoadingDraft(true) : setIsLoading(true);

    try {
      // ✅ Prepare payload
      const payload: any = {
        listing: {
          id: currentRestaurantDbId || 0,
          name: listing.name,
          listingStreet: listing.address || "",
          priceRange: listing.priceRange,
          streetAddress: listing.address,
          categories: Array.isArray(listing.listingCategories)
            ? listing.listingCategories
            : listing.category
              ? [listing.category]
              : [],
          latitude: String(listing.latitude),
          longitude: String(listing.longitude),
          palates: selectedPalates.map((p) => p.label),
          status: listingStatus,
        },
      };

      // ✅ Add review data if applicable
      if (includeReview) {
        payload.review = {
          review_stars: reviewStars,
          review_main_title: reviewMainTitle,
          content,
          review_images_idz: selectedFiles,
          recognitions: selectedrecognition || [],
          mode: reviewMode,
        };
      }

      // ✅ API call
      const response = await RestaurantService.createRestaurantListingAndReview(payload, sess);

      if (response?.listing?.id || response?.id) {
        setCurrentRestaurantDbId(response.listing?.id || response.id);
      }

      setIsSubmitted(true);

      // ✅ Redirect logic
      if (listingStatus === "pending") {
        router.push(LISTING_DRAFT);
      } else if (includeReview && reviewMode !== "draft") {
        router.push(LISTING);
      }

      
      if (includeReview) {
        setReviewStars(0);
        setReviewMainTitle("");
        setContent("");
        setSelectedFiles([]);
        setIsDoneSelecting(false);
        setSelectedRecognition([]);
      }
    } catch (error) {
      console.error("Failed to submit listing and review:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingDraft(false);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (selectedFiles.length + files.length > maximumImage) {
        setUploadedImageError(maximumImageLimit(maximumImage));
        event.target.value = '';
        return;
      } else {
        setUploadedImageError("");
      }

      let imageList: string[] = [];
      let filesProcessed = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onloadend = () => {
          imageList.push(reader.result as string);
          filesProcessed++;
          if (filesProcessed === files.length) {
            setSelectedFiles((prevFiles) => [...prevFiles, ...imageList]);
            setIsDoneSelecting(true);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const deleteSelectedFile = (fileToDelete: string) => {
    setSelectedFiles(selectedFiles.filter((item: string) => item !== fileToDelete));
    if (selectedFiles.length - 1 === 0) {
      setIsDoneSelecting(false);
    }
  };

  // Function to fetch address predictions using AutocompleteService
  const fetchAddressPredictions = useCallback(
    debounce(async (input: string) => {
      if (!autocompleteService || input.length < 3) {
        setAddressPredictions([]);
        setShowPredictions(false);
        return;
      }

      autocompleteService.getPlacePredictions(
        { input: input, },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setAddressPredictions(predictions);
            setShowPredictions(true);
          } else {
            setAddressPredictions([]);
            setShowPredictions(false);
            console.error("Error fetching place predictions:", status);
          }
        }
      );
    }, 500),
    [autocompleteService] // Recreate debounce if autocompleteService changes
  );

  // Handle address input change
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setListing({ ...listing, address: value });
    setAddressError("");
    fetchAddressPredictions(value);
  };

  // Handle selecting an address prediction
  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setListing((prev) => ({
      ...prev,
      address: prediction.description,
    }));
    setAddressPredictions([]);
    setShowPredictions(false);
    setAddressError("");

    if (placesService) {
      placesService.getDetails(
        { placeId: prediction.place_id, fields: ['geometry.location'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            setListing((prev) => ({
              ...prev,
              latitude: place.geometry?.location?.lat?.() ?? 0,
              longitude: place.geometry?.location?.lng?.() ?? 0,
            }));
          } else {
            console.error("Error fetching place details:", status);
          }
        }
      );
    }
  };

  return (
    <>
      <div className="font-inter mt-16 md:mt-20 max-w-[82rem] mx-auto px-3 md:px-6 lg:p-0">
        <div className="flex flex-col justify-center items-center">
          <h1 className="mt-8 text-lg leading-[22px] md:text-2xl md:leading-[27px] text-[#31343F] text font-medium">
            Add Listing
          </h1>
          {/* Conditional rendering for steps, covered by outer Suspense */}
          {step === 1 && (
            <>
              <form
                className="listing__form max-w-[672px] w-full my-6 md:my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-white"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="text-center">
                  <p className="text-[#494D5D] text-[10px] md:text-sm font-medium">
                    Step 1 of 2
                  </p>
                  <h1 className="text-[#31343F] text-sm md:text-xl font-medium mt-2">
                    Listing Details
                  </h1>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Title</label>
                  <div className="listing__input-group">
                    <input
                      type="text"
                      name="name"
                      className="listing__input"
                      placeholder="Listing Name"
                      value={listing.name}
                      maxLength={listingTitleLimit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length > listingTitleLimit) {
                          setNameError(maximumListingTitle(listingTitleLimit));
                        } else {
                          setNameError("");
                        }
                        setListing({ ...listing, name: value });
                      }}
                    />
                    {nameError && (
                      <p className="text-red-500 text-sm mt-1">
                        {nameError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Cuisine (Select up to 2 cuisines)
                  </label>
                  <div className="listing__input-group">
                    <Select
                      options={palateOptions}
                      value={selectedPalates}
                      onChange={handleChange}
                      isMulti
                      closeMenuOnSelect={false}
                      isSearchable
                      placeholder="Select palates..."
                      className="!rounded-[10px] text-sm"
                      hideSelectedOptions={false}
                      components={{
                        Option: CustomOption,
                        GroupHeading: CustomGroupHeading,
                      }}
                    />
                    {palatesError && (
                      <p className="text-red-500 text-sm mt-1">
                        {palatesError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Category (Select up to 3 categories)
                  </label>
                  <div className="listing__input-group">
                    <Select
                      options={categories.map((c: any) => ({
                        value: c.slug || c.name,
                        label: c.name,
                      }))}
                      value={listing.listingCategories.map((cat) => ({
                        label: cat,
                        value: cat,
                      }))}
                      onChange={(selected: any) => {
                        const selectedValues = selected.map((item: any) => item.value);

                        if (selectedValues.length > 3) {
                          setCategoryError("You can select a maximum of 3 categories.");
                          const trimmed = selected.slice(0, 3).map((item: any) => item.value);
                          setListing({ ...listing, listingCategories: trimmed });
                        } else {
                          setListing({ ...listing, listingCategories: selectedValues });
                          setCategoryError("");
                        }
                      }}
                      isMulti
                      placeholder="Select categories..."
                      className="!rounded-[10px] text-sm"
                      hideSelectedOptions={false}
                      closeMenuOnSelect={false}
                      components={{
                        Option: CustomOption,
                      }}
                    />
                    {categoryError && (
                      <p className="text-red-500 text-sm mt-1">{categoryError}</p>
                    )}
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Address</label>
                  <div className="listing__input-group relative">
                    <input
                      type="text"
                      name="address"
                      className="listing__input"
                      placeholder="Enter address"
                      value={listing.address}
                      onChange={handleAddressInputChange}
                      onFocus={() => listing.address.length >= 3 && setShowPredictions(true)}
                      onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                      ref={addressInputRef}
                    />
                    {addressError && (
                      <p className="text-red-500 text-sm mt-1">
                        {addressError}
                      </p>
                    )}
                    {showPredictions && addressPredictions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-[#CACACA] rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {addressPredictions.map((prediction) => (
                          <li
                            key={prediction.place_id}
                            className="p-3 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                            onMouseDown={() => handlePredictionSelect(prediction)} // Use onMouseDown to prevent onBlur from hiding list
                          >
                            <CiLocationOn className="size-4 md:size-5 text-[#494D5D]" />
                            <span>{prediction.description}</span>
                          </li>
                        ))}
                        <li className="p-3 text-right text-xs text-gray-500">
                          powered by Google
                        </li>
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-nowrap gap-2 items-center">
                    <CiLocationOn className="size-4 md:size-5" />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="cursor-pointer border-b border-[#494D5D] font-semibold text-sm md:text-base text-[#494D5D]"
                    >
                      Use my Current Location
                    </button>
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Price</label>
                  <div className="listing__listing-checkbox-grid border-[1.5px] border-[#797979] rounded-xl p-2">
                    {prices.map((price, index) => (
                      <div
                        key={index}
                        className="flex flex-nowrap items-center gap-2"
                      >
                        <div
                          className={`listing-checkbox-item ${listing?.priceRange === price.value
                            ? "bg-[#F1F1F1]"
                            : "bg-transparent"
                            }`}
                          onClick={() => handleChangePrice(price.value)}
                        >
                          <input
                            id={`price-${index}`}
                            type="radio"
                            name="price"
                            value={price.value}
                            checked={listing?.priceRange === price.value}
                            readOnly
                            className="listing-checkbox"
                          />
                          <label
                            htmlFor={`price-${index}`}
                            className="block listing-checkbox-label"
                          >
                            {price.name}
                          </label>
                        </div>

                        {index < prices.length - 1 && (
                          <div className="my-auto border-r-[1.5px] h-4/5 border-[#797979] w-fit"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  {priceRangeError && (
                    <p className="text-red-500 text-sm mt-1">
                      {priceRangeError}
                    </p>
                  )}
                </div>
                <p className="text-xs md:text-sm text-[#31343F]">
                  By submitting listing, you agree to TastyPlates’s'&nbsp;
                  <br></br>
                  <Link
                    href={WRITING_GUIDELINES}
                    className="underline"
                    target="_blank"
                  >
                    Listing Guidelines
                  </Link>
                </p>
                <div className="flex gap-3 md:gap-4 justify-center items-center">
                  <button
                    type="button"
                    className="listing__button"
                    onClick={(e) => submitListingAndReview(e, { action: "continue" })}
                  >
                    {isLoading && (
                      <svg
                        className="animate-spin w-5 h-5 text-white inline-block mr-2"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeDasharray="164"
                          strokeDashoffset="40"
                        />
                      </svg>
                    )}
                    Continue
                  </button>
                  <button
                    className="underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                    type="button"
                    onClick={(e) => submitListingAndReview(e, {action : "saveDraft", listingStatus: "pending" })}
                  >
                    {isLoadingDraft && (
                      <svg
                        className="animate-spin w-5 h-5 text-black inline-block mr-2"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeDasharray="164"
                          strokeDashoffset="40"
                        />
                      </svg>
                    )}
                    Save and Exit
                  </button>
                </div>
              </form>
            </>
          )}
          {step === 2 && (
            <form
              className="listing__form max-w-[672px] w-full my-10 px-4 py-6 md:py-8 md:px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="text-center">
                <p className="text-[#494D5D] text-[10px] md:text-sm font-medium">
                  Step 2 of 2
                </p>
                <h1 className="text-[#31343F] text-sm md:text-xl font-medium mt-2">
                  Write a Review
                </h1>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Rating</label>
                <div className="listing__input-group">
                  <Rating
                    defaultRating={reviewStars}
                    totalStars={5}
                    onRating={handleRating}
                  />
                  <span className="text-[10px] leading-3 md:text-base">
                    Rating should be solely based on taste of the food
                  </span>
                  {ratingError && (
                    <p className="text-red-500 text-sm mt-1">
                      {ratingError}
                    </p>
                  )}
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Title</label>
                <div className="listing__input-group">
                  <textarea
                    name="reviewTitle"
                    className="listing__input resize-vertical"
                    placeholder="Title of your review"
                    value={reviewMainTitle}
                    onChange={(e) => {
                      setReviewMainTitle(e.target.value);
                      setReviewTitleError("");
                    }}
                    rows={2}
                  ></textarea>
                  {reviewTitleError && (
                    <p className="text-red-500 text-sm mt-1">
                      {reviewTitleError}
                    </p>
                  )}
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Description</label>
                <div className="listing__input-group">
                  <textarea
                    name="reviewDescription"
                    className="listing__input resize-vertical"
                    placeholder="Write a review about the food, service or ambiance of the restaurant"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setDescriptionError("");
                    }}
                    rows={6}
                  ></textarea>
                  {descriptionError && (
                    <p className="text-red-500 text-sm mt-1">
                      {descriptionError}
                    </p>
                  )}
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">
                  Upload Photos (Max 6 Photos)
                </label>
                <div className="submitRestaurants__input-group">
                  <label className="flex gap-2 items-center rounded-xl py-2 px-4 md:py-3 md:px-6 border border-[#494D5D] w-fit cursor-pointer">
                    <MdOutlineFileUpload className="size-4 md:size-5" />
                    <input
                      type="file"
                      name="image"
                      className="submitRestaurants__input hidden"
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                    />
                    <span className="text-sm md:text-base text-[#494D5D] font-semibold">
                      Upload
                    </span>
                  </label>
                </div>
                {uploadedImageError && (
                  <p className="text-red-500 text-sm mt-1">
                    {uploadedImageError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFiles.map((item: string, index: number) => (
                    <div className="rounded-2xl relative" key={index}>
                      <button
                        type="button"
                        onClick={() => deleteSelectedFile(item)}
                        className="absolute top-3 right-3 rounded-full bg-[#FCFCFC] p-2"
                      >
                        <MdClose className="size-3 md:size-4" />
                      </button>
                      <FallbackImage
                        src={item}
                        alt={`Uploaded image ${index}`}
                        className="rounded-2xl object-cover"
                        width={187}
                        height={140}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Give Recognition</label>
                <div className="listing__listing-checkbox-grid !flex flex-wrap items-center">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`listing-checkbox-item flex items-center gap-2 !w-fit !rounded-[50px] !px-4 !py-2 border-[1.5px] border-[#494D5D] ${selectedrecognition.includes(tag.name)
                        ? "bg-[#cac9c9]"
                        : "bg-transparent"
                        }`}
                      onClick={() => handleChangeRecognition(tag.name)}
                    >
                      <Image src={tag.icon} width={24} height={24} alt="icon" />
                      <input
                        type="checkbox"
                        id={`recognition-${tag.id}`}
                        value={tag.name}
                        checked={selectedrecognition.includes(tag.name)}
                        onChange={() => handleChangeRecognition(tag.name)}
                        className="listing-checkbox hidden"
                      />
                      <label
                        htmlFor={`recognition-${tag.id}`}
                        className="listing-checkbox-label cursor-pointer"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs md:text-sm text-[#31343F]">
                By posting review, you agree to TastyPlates'&nbsp;
                <Link
                  href={WRITING_GUIDELINES}
                  className="underline"
                  target="_blank"
                >
                  Writing Guidelines
                </Link>
              </p>
              <div className="flex justify-center gap-3 md:gap-4 items-center">
                <button
                  type="button"
                  className="listing__button flex"
                  onClick={(e) => submitListingAndReview(e, { action: "publish", listingStatus: "draft", reviewMode: "draft", isSaveAndExit: false, includeReview: true })}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin w-5 h-5 text-white inline-block mr-2"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray="164"
                        strokeDashoffset="40"
                      />
                    </svg>
                  )}
                  Submit Listing
                </button>
                <button
                  type="button"
                  onClick={(e) => submitListingAndReview(e, { action: "saveDraft", listingStatus: "pending", reviewMode: "draft", includeReview: true })}
                  className="underline flex h-fit text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                >
                  {isLoadingDraft && (
                    <svg
                      className="animate-spin w-5 h-5 text-black inline-block mr-2"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray="164"
                        strokeDashoffset="40"
                      />
                    </svg>
                  )}
                  Save and Exit
                </button>
              </div>
            </form>
          )}
        </div>
        <CustomModal
          header="Listing Submitted"
          content="Your listing has been successfully submitted! Approval typically takes 1–3 working days. Once approved, your reviews will be uploaded automatically."
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
      </div>
    </>
  );
};

export default AddListingPage;
