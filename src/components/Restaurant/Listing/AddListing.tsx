"use client";
import React, { FormEvent, useEffect, useState } from "react";
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

const AddListingPage = (props: any) => {
  const [listing, setListing] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 1);
  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    CategoryService.fetchCategories()
      .then(setCategories)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading categories...</p>;

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

  const handleChangePrice = (e: any) => {
    console.log("listing", listing);
    setListing({
      ...listing,
      prices: [
        e.target.value == "$",
        e.target.value == "$$",
        e.target.value == "$$$",
      ],
    });
  };

  const handleChangeRecognition = (e: any) => {
    console.log("listing", listing);
    setListing({
      ...listing,
      recogniton: [
        e.target.value == 1,
        e.target.value == 2,
        e.target.value == 3,
        e.target.value == 4,
      ],
    });
  };

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
    console.log('selected files', selectedFiles.splice(1, 1))
    // let files = selectedFiles
    // files = files.splice(selectedFiles.splice(1))
    setSelectedFiles(selectedFiles.filter((item: string) => item != index))
  }

  return (
    <>
      <div className="font-inter mt-16 md:mt-20 max-w-[82rem] mx-auto px-3 md:px-6 lg:p-0">
        {!isLoading ? (
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
                        onChange={(e) => { }}
                      />
                    </div>
                  </div>
                  <div className="listing__form-group">
                    <label className="listing__label">Category</label>
                    <div className="listing__input-group">
                      <select className="listing__input">
                        {categories.map((category: any, index) => (
                          <option value={category.id} key={index}>
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
                      <select className="listing__input">
                        {categories.map((category: any, index) => (
                          <option value={category.key} key={index}>
                            {category.label}
                          </option>
                        ))}
                      </select>
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
                        onChange={(e) => { }}
                      />
                    </div>
                    <div className="flex flex-nowrap gap-2 items-center">
                      <CiLocationOn className="size-4 md:size-5" />
                      <button
                        type="button"
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
                            className={`listing-checkbox-item ${listing?.prices?.length && listing.prices[index]
                                ? "bg-[#F1F1F1]"
                                : "bg-transparent"
                              }`}
                          >
                            <input
                              id={`price-${index}`}
                              type="checkbox"
                              name="price"
                              value={price.value}
                              checked={
                                listing?.prices?.length &&
                                listing?.prices[index]
                              }
                              onChange={handleChangePrice}
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
                            <div
                              className={`${index < prices.length - 1 ? "block" : "hidden"
                                } my-auto border-r-[1.5px] h-4/5 border-[#797979] w-fit`}
                            ></div>
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
                <div className="listing__form-group">
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
        ) : (
          <></>
        )}
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
