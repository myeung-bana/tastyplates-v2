"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import type { Restaurant } from "@/data/dummyRestaurants";
import { FiMail } from "react-icons/fi";
import { palates } from "@/data/dummyPalate";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import { image } from "@heroui/theme";
import Link from "next/link";
import Image from "next/image";
import CustomModal from "@/components/ui/Modal/Modal";

const ReviewSubmissionPage = () => {
  const [restaurant, setRestaurant] = useState<
    Omit<Restaurant, "id" | "reviews">
  >({
    name: "",
    image: "",
    cuisineIds: [],
    rating: 0,
    priceRange: "",
    location: "",
    slug: "",
    address: "",
    phone: "",
    description: "",
    recognition: []
  });

  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
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
        reader.onload = function (e) {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "cuisineIds" && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );
      setRestaurant((prev) => ({
        ...prev,
        cuisineIds: selectedOptions,
      }));
    } else {
      setRestaurant((prev) => ({
        ...prev,
        [name]:
          name === "rating" || name === "deliveryTime" ? Number(value) : value,
      }));
    }
  };

  const handleChangeCheckbox = (e: any) => {
    setRestaurant({ ...restaurant, cuisineIds: e });
  };

  const handleRating = (rate: number) => {
    console.log("User rated:", rate);
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleChangeRecognition = (e: any) => {
    console.log("listing", restaurant);
    setRestaurant({
      ...restaurant,
      recognition: [
        e.target.value == 1,
        e.target.value == 2,
        e.target.value == 3,
        e.target.value == 4,
      ],
    });
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
      <div className="submitRestaurants mt-16 md:mt-20">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
            <h1 className="submitRestaurants__title">
              Chica Bonita Elegante - The Exchange TRX
            </h1>
            <form className="submitRestaurants__form" onSubmit={submitReview}>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Rating</label>
                <div className="submitRestaurants__input-group">
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
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Title</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="title"
                    className="listing__input resize-vertical"
                    placeholder="Title of your review"
                    defaultValue="Title of your review"
                    rows={2}
                  ></textarea>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Description</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="name"
                    className="submitRestaurants__input resize-vertical"
                    placeholder="Restaurant Name"
                    defaultValue={
                      "Write a review about the food, service or ambiance of the restaurant"
                    }
                    rows={6}
                  ></textarea>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Upload Photos(Max 6 Photos)
                </label>
                <div className="submitRestaurants__input-group">
                  <label className="flex gap-2 items-center rounded-xl py-2 px-4 md;py-3 md:px-6 border border-[#494D5D] w-fit cursor-pointer">
                    <MdOutlineFileUpload className="size-5" />
                    <input
                      type="file"
                      name="image"
                      className="submitRestaurants__input hidden"
                      placeholder="Image URL"
                      value={restaurant.image}
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
                        <img
                          src={item}
                          className="rounded-2xl h-[140px] w-[187px] object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Give Recognition
                </label>
                <div className="submitRestaurants__cuisine-checkbox-grid">
                  {tags.map((tag, index) => (
                    <div key={tag.id} className={`cuisine-checkbox-item flex items-center gap-2 !w-fit !rounded-[50px] !px-4 !py-2 border-[1.5px] border-[#494D5D] ${
                          restaurant?.recognition?.length && restaurant.recognition[index]
                            ? "bg-[#F1F1F1]"
                            : "bg-transparent"
                        }`}>
                      <Image src={tag.icon} width={24} height={24} alt="icon" />
                      <input
                        type="checkbox"
                        id={`cuisine-${tag.id}`}
                        name="cuisineIds"
                        value={tag.id}
                        onChange={handleChangeRecognition}
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
              <div className="flex gap-3 md:gap-4 items-center justify-center">
                <button className="submitRestaurants__button" type="submit">
                  Submit Listing
                </button>
                <button
                  className="underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                  type="submit"
                >
                  Save and exit
                </button>
              </div>
            </form>
          </div>
        </div>
        <CustomModal
          header="Review Posted"
          content="Your review for Chica Bonita Elegante - The Exchange TRX is successfully posted."
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
      </div>
      <Footer />
    </>
  );
};

export default ReviewSubmissionPage;
