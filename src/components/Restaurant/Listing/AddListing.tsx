"use client";
import React, { FormEvent, useState } from "react";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_add-listing.scss";
import Link from "next/link";
import Rating from "../Review/Rating";
import CustomSelect from "@/components/ui/Select/Select";
import { CiLocationOn } from "react-icons/ci";
import CustomModal from "@/components/ui/Modal/Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";

const AddListingPage = (props: any) => {
  const [listing, setListing] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(props.step ?? 0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter()
  const categories = [
    { key: "no-category", label: "Select a Category" },
    { key: "category-1", label: "Category 1" },
    { key: "category-2", label: "Category 2" },
  ];

  const tags = [
    {
      id: 1,
      name: 'Must Revisit',
      icon: '/flag.svg',
    },
    {
      id: 2,
      name: 'Insta-Worthy',
      icon: '/phone.svg',
    },
    {
      id: 3,
      name: 'Value for Money',
      icon: '/cash.svg',
    },
    {
      id: 4,
      name: 'Best Service',
      icon: '/helmet.svg',
    },
  ]

  const prices = [
    {
        name: '$',
        value: '$'
    },
    {
        name: '$$',
        value: '$$'
    },
    {
        name: '$$$',
        value: '$$$'
    },
  ]

  const changeStep = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (step == 1) {
        router.push('/listing/step-2')
      } else {
        setStep(step + 1);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleChangeCheckbox = (e: any) => {
    setListing({ ...listing, cuisineIds: e });
  };

  const handleRating = (rate: number) => {
    console.log("User rated:", rate);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <>
      <div className="font-inter mt-20">
        {!isLoading ? (
          <div className="flex flex-col justify-center items-center">
            {step == 0 && (
              <div className="flex flex-col gap-8 justify-center items-start h-[663px] w-full pl-16 bg-[url('/images/listing-backdrop.png')] bg-cover bg-center bg-no-repeat">
                <h1 className="text-[32px] leading-9 text-[#31343F] text-left font-medium">
                  Add Listing
                </h1>
                <p className="text-xl text-left font-medium text-wrap max-w-[624px]">
                  Anyone can add records for a listing to contribute useful
                  information. However, if you are the rightful owner of a
                  listing, you can claim ownership to gain full control and
                  manage its details.
                </p>
                <button
                  onClick={changeStep}
                  className="rounded-xl text-[#FCFCFC] font-semibold w-fit px-6 py-3 text-center bg-[#E36B00]"
                  disabled={isLoading}
                >
                  Acknowledge and Continue
                </button>
              </div>
            )}
            {step == 1 && (
              <form
                className="listing__form max-w-[672px] w-full my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
                onSubmit={submitReview}
              >
                <div className="text-center">
                  <p className="text-[#494D5D] text-sm font-medium">
                    Step 1 of 2
                  </p>
                  <h1 className="text-[#31343F] text-xl font-medium mt-2">
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
                      onChange={(e) => {}}
                    />
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Category</label>
                  <div className="listing__input-group">
                    <CustomSelect
                      className=""
                      placeholder="Select a category"
                      items={categories}
                    />
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Palate (Select up to 2 palates)
                  </label>
                  <div className="listing__input-group">
                    <CustomSelect
                      mode="multiple"
                      max={2}
                      placeholder="Select a category"
                      items={categories}
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
                      onChange={(e) => {}}
                    />
                  </div>
                  <div className="flex flex-nowrap gap-2 items-center">
                    <CiLocationOn className="size-5" />
                    <button className="cursor-pointer underline font-semibold text-[#494D5D]">
                      Use my Current Location
                    </button>
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Price</label>
                  <div className="listing__listing-checkbox-grid border-1.5 border-[#797979] rounded-xl">
                    {prices.map((price, index) =>  (
                        <div key={index} className="listing-checkbox-item w-[192px]">
                            <input
                            type="checkbox"
                            name="price"
                            value={price.value}
                            onChange={handleChangeCheckbox}
                            className="listing-checkbox"
                            />
                            <label
                            htmlFor={`listing-${index}`}
                            className="listing-checkbox-label"
                            >
                            {price.name}
                            </label>
                        </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#31343F]">
                  By posting review, you agree to TastyPlates'&nbsp;
                  <Link
                    href="/writing-guidelines"
                    className="underline"
                    target="_blank"
                  >
                    Writing Guidelines
                  </Link>
                </p>
                <div className="flex gap-4 items-center">
                  <button className="listing__button" onClick={changeStep}>
                    Continue
                  </button>
                  <button
                    className="underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center"
                    type="submit"
                  >
                    Save and exit
                  </button>
                </div>
              </form>
            )}
            {step == 2 && (
              <form
                className="listing__form max-w-[672px] w-full my-10 py-8 px-6 rounded-3xl border border-[#CACACA] bg-[#FCFCFC]"
                onSubmit={submitReview}
              >
                <div className="text-center">
                  <p className="text-[#494D5D] text-sm font-medium">
                    Step 2 of 2
                  </p>
                  <h1 className="text-[#31343F] text-xl font-medium mt-2">
                    Listing Details
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
                    <span>
                      Rating should be solely based on taste of the food
                    </span>
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">Title</label>
                  <div className="listing__input-group">
                    <input
                      type="text"
                      name="name"
                      className="listing__input"
                      placeholder="Title of your review"
                      value={""}
                      onChange={(e) => {}}
                    />
                  </div>
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Description
                  </label>
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
                </div>
                <div className="listing__form-group">
                  <label className="listing__label">
                    Give Recognition
                  </label>
                  <div className="listing__cuisine-checkbox-grid">
                    {tags.map((tag, index) => (
                      <div key={tag.id} className="cuisine-checkbox-item">
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
                          onChange={handleChangeCheckbox}
                          className="cuisine-checkbox"
                        />
                        <label
                          htmlFor={`cuisine-${tag.id}`}
                          className="cuisine-checkbox-label"
                        >
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#31343F]">
                  By posting review, you agree to TastyPlates'&nbsp;
                  <Link
                    href="/writing-guidelines"
                    className="underline"
                    target="_blank"
                  >
                    Writing Guidelines
                  </Link>
                </p>
                <div className="flex gap-4 items-center">
                  <button className="listing__button" type="submit">
                    Submit Listing
                  </button>
                  <button
                    className="underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center"
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
