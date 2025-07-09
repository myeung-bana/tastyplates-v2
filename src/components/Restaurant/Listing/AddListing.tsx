// app/components/AddListing.tsx

"use client";
import React, { FormEvent, useEffect, useState, Suspense } from "react"; // Add Suspense here
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import Rating from "../Review/Rating";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation"; // Keep useSearchParams
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";
import { useSession } from "next-auth/react";
import Select, { components } from "react-select";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { ReviewService } from "@/services/Reviews/reviewService";
import CustomOption from "@/components/ui/Select/CustomOption";

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
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false); // Used for modal display
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

  const submitListing = async (e: FormEvent, action: "continue" | "saveDraft") => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    if (action === "continue") {
      setIsLoading(true);
      setTimeout(() => {
        setStep(2);
        setIsLoading(false);
      }, 300); // Simulate loading, or remove timeout if not needed
      return;
    }
    setIsLoadingDraft(true);
    try {
      const formData = new FormData();
      formData.append("name", listing.name);
      formData.append("listingStreet", listing.address || "");
      formData.append("priceRange", listing.priceRange);
      formData.append("streetAddress", listing.address);
      listing.listingCategories.forEach((cat) => {
        formData.append("categories[]", cat);
      });

      formData.append("latitude", String(listing.latitude));
      formData.append("longitude", String(listing.longitude));
      selectedPalates.forEach((p) => formData.append("palates[]", p.label));
      formData.append("status", "pending");

      const response = await RestaurantService.createRestaurantListing(
        formData,
        sess
      );
      const newListingId = response.id;
      setCurrentRestaurantDbId(newListingId);

      setIsSubmitted(true);
      router.push("/listing");
    } catch (err: any) {
      console.error("Error submitting listing as draft:", err);
      alert(err.message || "An error occurred during listing submission as draft.");
    } finally {
      setIsLoading(false);
      setIsLoadingDraft(false);
    }
  };


  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        const formattedAddress =
          data.results?.[0]?.formatted_address || "Unknown location";

        setListing((prev) => ({
          ...prev,
          address: formattedAddress,
          latitude: lat,
          longitude: lng,
        }));
      } catch (error) {
        console.error("Geocoding error:", error);
        alert("Failed to get address from Google Maps");
      }
    }, (error) => {
      alert("Unable to retrieve your location");
      console.error(error);
    });
  };

  const handleChange = (selected: any) => {
    if (selected.length <= 2) {
      setSelectedPalates(selected);
      setPalatesError("");
    } else {
      setPalatesError("You can select a maximum of 2 cuisines.");
      // Reset to previous valid selection
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
    { id: 1, name: "Must Revisit", icon: "/flag.svg" },
    { id: 2, name: "Insta-Worthy", icon: "/phone.svg" },
    { id: 3, name: "Value for Money", icon: "/cash.svg" },
    { id: 4, name: "Best Service", icon: "/helmet.svg" },
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
          console.log("Fetching draft details for ID:", currentResId);

          setIsLoading(true);
          try {
            const restaurantData = await RestaurantService.fetchRestaurantById(
              currentResId.toString(),
              "DATABASE_ID"
            );
            localStorage.setItem('restID', currentResId.toString());
            console.log("Fetched draft restaurant data:", restaurantData);

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

  console.log("Current restaurantDbId state:", currentRestaurantDbId);

  const submitReviewAndListing = async (e: FormEvent, reviewMode: "draft" | "publish", listingStatus: "pending" | "draft", isSaveAndExit = false) => {
    e.preventDefault();

    let hasError = false;

    if (reviewStars === 0) {
      setRatingError("Rating is required.");
      hasError = true;
    } else {
      setRatingError("");
    }

    if (content.trim() === "") {
      setDescriptionError("Description is required.");
      hasError = true;
    } else {
      setDescriptionError("");
    }

    if (hasError) return;

    if (isSaveAndExit) {
      setIsLoadingDraft(true);
    } else {
      setIsLoading(true);
    }
    try {
      let finalRestaurantId = currentRestaurantDbId;
      console.log("Restaurant ID for submission:", finalRestaurantId);

      if (finalRestaurantId === 0) {
        if (!validateStep1()) {
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", listing.name);
        formData.append("listingStreet", listing.address || "");
        formData.append("priceRange", listing.priceRange);
        formData.append("streetAddress", listing.address);
        formData.append("categories", listing.category);
        formData.append("latitude", String(listing.latitude));
        formData.append("longitude", String(listing.longitude));

        selectedPalates.forEach((p) => formData.append("palates[]", p.label));

        formData.append("status", listingStatus);
        const listingResponse = await RestaurantService.createRestaurantListing(formData, sess);
        finalRestaurantId = listingResponse.id;
        setCurrentRestaurantDbId(finalRestaurantId);
      } else {
        const listingUpdateData = {
          name: listing.name,
          listingStreet: listing.address || "",
          priceRange: listing.priceRange,
          streetAddress: listing.address,
          categories: listing.category,
          latitude: String(listing.latitude),
          longitude: String(listing.longitude),
          palates: selectedPalates.map(p => p.label),
          status: listingStatus,
        };

        console.log("Updating listing before review:", listingUpdateData);
        console.log("Final restaurant ID for update:", finalRestaurantId);
        console.log("Session token for update:", sess);

        await RestaurantService.updateRestaurantListing(finalRestaurantId, listingUpdateData, sess);
      }

      const reviewData = {
        restaurantId: finalRestaurantId,
        review_stars: reviewStars,
        review_main_title: reviewMainTitle,
        content,
        review_images_idz: selectedFiles,
        recognitions: selectedrecognition || [],
        mode: reviewMode,
      };
      await ReviewService.postReview(reviewData, sess);

      setIsSubmitted(true);
      if (reviewMode === "draft") {
        // router.push("/listing/draft");
      } else {
        router.push("/listing");
      }

      setReviewStars(0);
      setReviewMainTitle("");
      setContent("");
      setSelectedFiles([]);
      setIsDoneSelecting(false);
      setSelectedRecognition([]);

    } catch (error) {
      console.error("Failed to submit review and/or listing:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingDraft(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const maxFiles = 6;
      if (selectedFiles.length + files.length > maxFiles) {
        setUploadedImageError(`You can upload a maximum of ${maxFiles} photos in total.`);
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
                className="listing__form max-w-[672px] w-full my-6 md:my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
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
                      onChange={(e) => {
                        setListing({ ...listing, name: e.target.value });
                        setNameError("");
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
                  <div className="listing__input-group">
                    <input
                      type="text"
                      name="address"
                      className="listing__input"
                      placeholder="Enter address"
                      value={listing.address}
                      onChange={(e) => {
                        setListing({ ...listing, address: e.target.value });
                        setAddressError("");
                      }}
                    />
                    {addressError && (
                      <p className="text-red-500 text-sm mt-1">
                        {addressError}
                      </p>
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
                    href="/writing-guidelines"
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
                    onClick={(e) => submitListing(e, "continue")}
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
                    onClick={(e) => submitListing(e, "saveDraft")}
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
                    onChange={(e) => setReviewMainTitle(e.target.value)}
                    rows={2}
                  ></textarea>
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
                  Upload Photos(Max 6 Photos)
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
                      <Image
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
                        ? "bg-[#F1F1F1]"
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
                  href="/writing-guidelines"
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
                  onClick={(e) => submitReviewAndListing(e, "draft", "draft", false)}
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
                  onClick={(e) => submitReviewAndListing(e, "draft", "pending", true)}
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