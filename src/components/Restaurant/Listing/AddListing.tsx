"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Select from "react-select";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import Rating from "../Review/Rating";
import CustomSelect from "@/components/ui/Select/Select";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";
import { useSession } from "next-auth/react";

const AddListingPage = (props: any) => {
  const [listing, setListing] = useState({
    address: "",
    latitude: 0,
    longitude: 0,
    category: "",
    name: "",
    priceRange: "",
    palates: [],
    // recognition: true,
    image: "",
    // other fields...
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [step, setStep] = useState<number>(props.step ?? 1);
  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [palates, setPalates] = useState([]);
  const [selectedPalates, setSelectedPalates] = useState<{ label: string; value: string }[]>([]);
  const { data: session, status } = useSession();
  const sess = session?.accessToken || "";
  // console.log("Session Access Token:", sess);

  const palateOptions = palates.map((palate: any) => ({
    value: palate.databaseId,
    label: palate.name,
  }));



  const submitListing = async () => {
    setIsSubmitted(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/custom/v1/listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess}`, // ⬅️ Send token here
        },
        body: JSON.stringify({
          name: listing.name,
          category: listing.category,
          priceRange: listing.priceRange,
          latitude: listing.latitude,
          longitude: listing.longitude,
          streetAddress: listing.address,
          palates: selectedPalates.map((p) => p.label),
        }),
      });
      console.log("Response:", res);

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit listing.");

      alert("Listing submitted successfully!");
      // router.push("/thank-you"); // Or navigate to listings
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred.");
    } finally {
      setIsSubmitted(false);
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


  const handleChange = (selected: any) => {
    if (selected.length <= 2) {
      setSelectedPalates(selected);
    }
  };

  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    CategoryService.fetchCategories()
      .then(setCategories)
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);


  useEffect(() => {
    PalatesService.fetchPalates()
      .then(setPalates)
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedPalateIds = selectedPalates.map(p => p.label);
  console.log("Selected Palate IDs:", selectedPalateIds);

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

  const changeStep = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (step == 1) {
        router.push("/listing/step-2");
      } else {
        setStep(step + 1);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleChangePrice = (value: string) => {
    setListing({
      ...listing,
      priceRange: value, // singular value
    });
  };


  console.log("listing", listing);
  // const handleChangeRecognition = (e: any) => {
  //   setListing({
  //     ...listing,
  //     recognition: [
  //       e.target.value == 1,
  //       e.target.value == 2,
  //       e.target.value == 3,
  //       e.target.value == 4,
  //     ],
  //   });
  // };

  const handleRating = (rate: number) => {
    console.log("User rated:", rate);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement | any>
  ) => {
    if (event.target.files && event.target.files?.length > 0) {
      const selectedFile = event.target.files;
      setSelectedFiles([]);
      console.log(selectedFile.length, "length");
      let imageList: string[] = [];
      for (let i = 0; i < selectedFile.length; i++) {
        let reader = new FileReader();
        const file = selectedFile[i];
        const length = selectedFile.length;
        reader.onloadend = function (e) {
          console.log(length, "length");
          // console.log(reader.result as string, 'hello')
          imageList.push(reader.result as string);
          console.log(
            imageList,
            "image list 0",
            i,
            selectedFile.length,
            selectedFile.length - 1
          );
          if (length - 1 == i) {
            setSelectedFiles(imageList);

            setIsDoneSelecting(true);
          }
        }; // Would see a path?
        reader.readAsDataURL(file);
        // console.log(selectedFile.length, 'length', url)
      }
      console.log(imageList, "image list");
    }
  };

  const deleteSelectedFile = (index: string) => {
    console.log('selected', index)
    setSelectedFiles(selectedFiles.filter((item: string) => item != index))
  }

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
                onSubmit={submitReview}
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
                      onChange={(e) => setListing({ ...listing, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Category</label>
                  <div className="listing__input-group">
                    <select className="listing__input"
                      disabled={isLoading}
                      value={listing.category}
                      onChange={(e) => setListing({ ...listing, category: e.target.value })}>
                      <option value="">Select Category</option>
                      {categories.map((category: any, index) => (
                        <option value={category.name} key={index}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
                    />
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Address</label>
                  <div className="listing__input-group">
                    <input
                      type="text"
                      name="name"
                      className="listing__input"
                      placeholder="Enter address"
                      value={listing.address}
                      onChange={(e) =>
                        setListing({ ...listing, address: e.target.value })
                      }
                    />
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
                      <div key={index} className="flex flex-nowrap items-center gap-2">
                        <div
                          className={`listing-checkbox-item ${listing?.priceRange === price.value ? "bg-[#F1F1F1]" : "bg-transparent"
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
                          <label htmlFor={`price-${index}`} className="block listing-checkbox-label">
                            {price.name}
                          </label>
                        </div>

                        {index < prices.length - 1 && (
                          <div className="my-auto border-r-[1.5px] h-4/5 border-[#797979] w-fit"></div>
                        )}
                      </div>
                    ))}
                  </div>
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
                  <button className="listing__button" onClick={changeStep}>
                    Continue
                  </button>
                  <button
                    className="underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                    type="submit"
                    onClick={() => submitListing()}                  >
                    Save and Exit
                  </button>
                </div>
              </form>
            </>
          )}
          {step == 2 && (
            <form
              className="listing__form max-w-[672px] w-full my-10 px-4 py-6 md:py-8 md:px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
              onSubmit={submitReview}
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
                    defaultRating={0}
                    totalStars={5}
                    onRating={handleRating}
                  />
                  <span className="text-[10px] leading-3 md:text-base">
                    Rating should be solely based on taste of the food
                  </span>
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Title</label>
                <div className="listing__input-group">
                  <textarea
                    name="title"
                    className="listing__input resize-vertical"
                    placeholder="Title of your review"
                    defaultValue="Title of your review"
                    rows={2}
                  ></textarea>
                </div>
              </div>
              <div className="listing__form-group">
                <label className="listing__label">Description</label>
                <div className="listing__input-group">
                  <textarea
                    name="name"
                    className="listing__input resize-vertical"
                    placeholder="Restaurant Name"
                    defaultValue={
                      "Write a review about the food, service or ambiance of the restaurant"
                    }
                    rows={6}
                  ></textarea>
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
                      placeholder="Image URL"
                      value={listing.image}
                      onChange={handleFileChange}
                      multiple
                      max={6}
                    />
                    <span className="text-sm md:text-base text-[#494D5D] font-semibold">
                      Upload
                    </span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* {selectedFiles} */}
                  {isDoneSelecting &&
                    selectedFiles.map((item: any, index: number) => (
                      <div className="rounded-2xl relative" key={index}>
                        <button
                          type="button"
                          onClick={() => deleteSelectedFile(item)}
                          className="absolute top-3 right-3 rounded-full bg-[#FCFCFC] p-2"
                        >
                          <MdClose className="size-3 md:size-4" />
                        </button>
                        <img src={item} className="rounded-2xl h-[140px] w-[187px] object-cover" />
                      </div>
                    ))}
                </div>
              </div>
              {/* <div className="listing__form-group">
                <label className="listing__label">Give Recognition</label>
                <div className="listing__listing-checkbox-grid !flex flex-wrap items-center">
                  {tags.map((tag, index) => (
                    <div
                      key={tag.id}
                      className={`listing-checkbox-item flex items-center gap-2 !w-fit !rounded-[50px] !px-4 !py-2 border-[1.5px] border-[#494D5D] ${listing?.recognition?.length && listing.recognition[index]
                        ? "bg-[#F1F1F1]"
                        : "bg-transparent"
                        }`}
                    >
                      <Image
                        src={tag.icon}
                        width={24}
                        height={24}
                        alt="icon"
                      />
                      <input
                        type="checkbox"
                        id={`cuisine-${tag.id}`}
                        name="cuisineIds"
                        value={tag.id}
                        onChange={handleChangeRecognition}
                        className="listing-checkbox"
                      />
                      <label
                        htmlFor={`cuisine-${tag.id}`}
                        className="listing-checkbox-label"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div> */}
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
                <button type="submit" className="listing__button">
                  Submit Listing
                </button>
                <button
                  type="button"
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
