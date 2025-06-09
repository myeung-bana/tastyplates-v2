"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import Rating from "../Review/Rating";
import CustomSelect from "@/components/ui/Select/Select"; // Not used, can be removed
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

const AddListingPage = (props: any) => {
  const [listing, setListing] = useState({
    address: "",
    latitude: 0,
    longitude: 0,
    category: "",
    name: "",
    priceRange: "", 
    palates: [], // This state is not directly used for palates in submitListing, consider removing or re-evaluating its purpose
    image: "", // This state is not directly used for images in submitListing, consider removing or re-evaluating its purpose
    recognition: [], // This state is not directly used for recognition, consider removing or re-evaluating its purpose
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
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
  const sess = session?.accessToken || ""; // Renamed to accessToken for clarity
  const [reviewMainTitle, setReviewMainTitle] = useState(""); // Corrected casing
  const [content, setContent] = useState("");
  const [reviewStars, setReviewStars] = useState(0); // Corrected casing
  const [isSavingAsDraft, setIsSavingAsDraft] = useState(false); // Not used in the current logic, consider removing if not needed
  const searchParams = useSearchParams();
  const [restaurantId, setResId] = useState(0); // Corrected casing
  const [descriptionError, setDescriptionError] = useState("");
  const [uploadedImageError, setUploadedImageError] = useState(""); // Not used, can be removed
  const [ratingError, setRatingError] = useState(""); // Added for rating validation
  const [nameError, setNameError] = useState(""); // Added for name validation
  const [categoryError, setCategoryError] = useState(""); // Added for category validation
  const [palatesError, setPalatesError] = useState(""); // Added for palates validation
  const [addressError, setAddressError] = useState(""); // Added for address validation
  const [priceRangeError, setPriceRangeError] = useState(""); // Added for price range validation

  // Bold region group headings (like "East Asian")
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
    if (!listing.category) {
      setCategoryError("Category is required.");
      isValid = false;
    } else {
      setCategoryError("");
    }
    if (selectedPalates.length === 0) {
      setPalatesError("At least one palate must be selected.");
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

  const submitListing = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setIsSubmitted(true); // This might be confusing, as it's also used for review submission success. Consider renaming or using a separate state.

    if (!validateStep1()) {
      setIsSubmitted(false); // Reset if validation fails
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", listing.name);
      formData.append("listingStreet", listing.address || "");
      formData.append("priceRange", listing.priceRange);
      formData.append("streetAddress", listing.address);
      formData.append("categories", listing.category);
      formData.append("latitude", String(listing.latitude));
      formData.append("longitude", String(listing.longitude));

      // Append palate labels directly
      selectedPalates.forEach((p) => formData.append("palates[]", p.label));

      // If you intend to upload images with the initial listing, you'll need to
      // convert selectedFiles (base64 strings) back to File objects or handle
      // image uploads separately. For now, assuming images are for the review step.
      // images.forEach((file) => {
      //   formData.append("gallery[]", file);
      // });

      console.log("Form Data to be sent:", Object.fromEntries(formData.entries())); // Log formData for debugging

      const response = await RestaurantService.createRestaurantListing(
        formData,
        sess
      );
      const newListingId = response.id;
      setResId(newListingId);

      router.push(`/listing/step-2?resId=${newListingId}`);// Programmatically move to step 2
    } catch (err: any) {
      console.error("Error submitting listing:", err);
      alert(err.message || "An error occurred during listing submission.");
    } finally {
      setIsSubmitted(false); // Reset submission state
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
          latitude: lat,  // Convert to string if needed
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

  console.log("resID:", restaurantId); // Debugging line to check resID
   
  const handleChange = (selected: any) => {
    // Allows up to 2 palates to be selected
    if (selected.length <= 2) {
      setSelectedPalates(selected);
      setPalatesError(""); // Clear palates error on selection
    } else {
      alert("You can select up to 2 palates only.");
    }
  };

  useEffect(() => {
    // Fetch categories
    CategoryService.fetchCategories()
      .then(setCategories)
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoading(false)); // Set to false after initial fetches
  }, []);

  useEffect(() => {
    // Fetch palates
    PalatesService.fetchPalates()
      .then(setPalates)
      .catch((error) => console.error("Error fetching palates:", error))
      .finally(() => setIsLoading(false)); // Set to false after initial fetches
  }, []);

  // Removed console.log for selectedPalateIds as it's for debugging

  const tags = [
    {
      id: 1,
      name: "Must Revisit",
      icon: "/flag.svg",
    },
    {
      id: 2,
      name: "Insta-Worthy",
      icon: "/phone.svg",
    },
    {
      id: 3,
      name: "Value for Money",
      icon: "/cash.svg",
    },
    {
      id: 4,
      name: "Best Service",
      icon: "/helmet.svg",
    },
  ];

  const prices = [
    {
      name: "$",
      value: "$",
    },
    {
      name: "$$",
      value: "$$",
    },
    {
      name: "$$$",
      value: "$$$",
    },
  ];

  // This `changeStep` function seems redundant if you are directly routing to step 2 after submission
  // If you want a separate "next step" button without submission, you'd need to adjust logic.
  // const changeStep = (event: React.MouseEvent<HTMLButtonElement>) => {
  //   event.preventDefault();
  //   setIsLoading(true);

  //   setTimeout(() => {
  //     if (step === 1) {
  //       router.push("/listing/step-2");
  //     } else {
  //       setStep(step + 1);
  //     }
  //     setIsLoading(false);
  //   }, 500);
  // };

  const handleChangePrice = (value: string) => {
    setListing({
      ...listing,
      priceRange: value,
    });
    setPriceRangeError(""); // Clear error on selection
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
    setRatingError(""); // Clear error on rating
  };

    useEffect(() => {
    if (step === 2) {
      const idFromUrl = searchParams?.get('resId');
      if (idFromUrl) {
        setResId(Number(idFromUrl));
      }
    }
  }, [step, searchParams]);

  const submitReview = async (e: FormEvent, mode: "publish" | "draft") => {
    e.preventDefault(); // Prevent default form submission

    let hasError = false;

    if (reviewStars === 0) {
      setRatingError("Rating is required.");
      hasError = true;
    } else {
      setRatingError("");
    }

    // You have two textarea elements for content/description. Ensure you are updating `content` state.
    // The current code has `defaultValue` and no `onChange` for the description textarea.
    // I've added an `onChange` for `content` for the description textarea below in the JSX.
    if (content.trim() === "") {
      setDescriptionError("Description is required.");
      hasError = true;
    } else {
      setDescriptionError("");
    }

    if (hasError) return;

    if (mode === "publish") {
      setIsLoading(true); // Indicate loading for publishing
    } else if (mode === "draft") {
      setIsSavingAsDraft(true); // Indicate saving as draft
    }

    try {
      // You'll need to handle actual file uploads for `review_images_idz`.
      // `selectedFiles` currently holds base64 strings. You'll need to send
      // these to an API endpoint that can receive base64 or upload them as File objects.
      // For now, I'm assuming your `ReviewService.postReview` can handle base64 array.
      const reviewData = {
        restaurantId, // Ensure resID is correctly set from the previous step's listing submission
        review_stars: reviewStars,
        review_main_title: reviewMainTitle, // Ensure this state is being updated by a textarea
        content,
        review_images_idz: selectedFiles, // This will send base64 strings, ensure your backend handles this.
        recognitions: selectedrecognition || [],
        mode,
      };
      console.log("Review Data to be sent:", reviewData); // Log reviewData for debugging
      await ReviewService.postReview(reviewData, sess);

      if (mode === "publish") {
        setIsSubmitted(true); // Show success modal for published reviews
      } else if (mode === "draft") {
        router.push("/listing"); // Redirect after saving as draft
      }

      // Reset form fields here:
      setReviewStars(0);
      setReviewMainTitle("");
      setContent("");
      setSelectedFiles([]);
      setIsDoneSelecting(false);
      setSelectedRecognition([]); // Also reset recognition
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false); // End loading regardless of success/failure
      setIsSavingAsDraft(false); // End saving as draft regardless of success/failure
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const maxFiles = 6;
      if (files.length > maxFiles) {
        setUploadedImageError(`You can upload a maximum of ${maxFiles} photos.`);
        event.target.value = ''; // Clear the input
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
            setSelectedFiles((prevFiles) => [...prevFiles, ...imageList]); // Append new files
            setIsDoneSelecting(true);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };


  const deleteSelectedFile = (fileToDelete: string) => {
    setSelectedFiles(selectedFiles.filter((item: string) => item !== fileToDelete));
    if (selectedFiles.length - 1 === 0) { // If no files left after deletion
      setIsDoneSelecting(false);
    }
  };

  return (
    <>
      <div className="font-inter mt-16 md:mt-20 max-w-[82rem] mx-auto px-3 md:px-6 lg:p-0">
        <div className="flex flex-col justify-center items-center">
          {step == 1 && (
            <>
              <h1 className="mt-8 text-lg md:text-2xl text-[#31343F] text font-medium">
                Add Listing
              </h1>
              <form
                className="listing__form max-w-[672px] w-full my-6 md:my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
                onSubmit={submitListing} // Attach onSubmit to the form
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
                        setNameError(""); // Clear error on change
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
                  <label className="listing__label">Category</label>
                  <div className="listing__input-group">
                    <select
                      className="listing__input"
                      disabled={isLoading}
                      value={listing.category}
                      onChange={(e) => {
                        setListing({ ...listing, category: e.target.value });
                        setCategoryError(""); // Clear error on change
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category: any, index) => (
                        <option value={category.name} key={index}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoryError && (
                      <p className="text-red-500 text-sm mt-1">
                        {categoryError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Palate (Select up to 2 palates)
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
                      components={{
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
                  <label className="listing__label">Address</label>
                  <div className="listing__input-group">
                    <input
                      type="text"
                      name="address" // Changed name to 'address' for semantic clarity
                      className="listing__input"
                      placeholder="Enter address"
                      value={listing.address}
                      onChange={(e) => {
                        setListing({ ...listing, address: e.target.value });
                        setAddressError(""); // Clear error on change
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
                          className={`listing-checkbox-item ${
                            listing?.priceRange === price.value
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
                            readOnly // Ensure readOnly if onClick handles state
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
                <div className="flex gap-3 md:gap-4 items-center">
                  <button type="submit" className="listing__button">
                    Continue
                  </button>
                  <button
                    className="underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                    type="button" // Change to button to prevent default form submission
                    onClick={(e) => submitListing(e)} // Explicitly call with event
                  >
                    Save and Exit
                  </button>
                </div>
              </form>
            </>
          )}
          {step == 2 && (
            <form
              className="listing__form max-w-[672px] w-full my-10 px-4 py-6 md:py-8 md:px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
              onSubmit={(e) => submitReview(e, "draft")} // Default submission is publish
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
                    name="reviewTitle" // Changed name for clarity
                    className="listing__input resize-vertical"
                    placeholder="Title of your review"
                    value={reviewMainTitle} // Controlled component
                    onChange={(e) => setReviewMainTitle(e.target.value)}
                    rows={2}
                  ></textarea>
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Description</label>
                <div className="listing__input-group">
                  <textarea
                    name="reviewDescription" // Changed name for clarity
                    className="listing__input resize-vertical"
                    placeholder="Write a review about the food, service or ambiance of the restaurant"
                    value={content} // Controlled component
                    onChange={(e) => {
                      setContent(e.target.value);
                      setDescriptionError(""); // Clear error on change
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
                      accept="image/*" // Restrict to image files
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
                      {/* Using Next.js Image component for optimization */}
                      <Image
                        src={item}
                        alt={`Uploaded image ${index}`}
                        className="rounded-2xl object-cover"
                        width={187} // Set appropriate width
                        height={140} // Set appropriate height
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
                      className={`listing-checkbox-item flex items-center gap-2 !w-fit !rounded-[50px] !px-4 !py-2 border-[1.5px] border-[#494D5D] ${
                        selectedrecognition.includes(tag.name)
                          ? "bg-[#F1F1F1]"
                          : "bg-transparent"
                      }`}
                      onClick={() => handleChangeRecognition(tag.name)} // Handle click for checkbox
                    >
                      <Image src={tag.icon} width={24} height={24} alt="icon" />
                      <input
                        type="checkbox"
                        id={`recognition-${tag.id}`}
                        value={tag.name}
                        checked={selectedrecognition.includes(tag.name)}
                        onChange={() => handleChangeRecognition(tag.name)} // Still keep onChange for accessibility
                        className="listing-checkbox hidden" // Hide default checkbox if using custom styling
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
                  type="submit"
                  className="listing__button"
                  // onClick handled by form onSubmit
                >
                  Submit Listing
                </button>
                <button
                  type="button" // Change to button to prevent default form submission
                  onClick={(e) => submitReview(e, "draft")}
                  className="underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                >
                  Save and exit
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