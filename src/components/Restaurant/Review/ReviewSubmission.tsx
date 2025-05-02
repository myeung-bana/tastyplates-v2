"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import type { Restaurant } from "@/data/dummyRestaurants";
import { FiMail } from "react-icons/fi";
import { palates } from "@/data/dummyPalate";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdOutlineFileUpload } from "react-icons/md";
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
  });

  const [isDoneSelecting, setIsDoneSelecting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
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
    
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement | any>) => {
    if (event.target.files && event.target.files?.length > 0) {
      const selectedFile = event.target.files;
      setSelectedFiles([])
      console.log(selectedFile.length, 'length')
      let imageList: string[] = []
      for (let i = 0; i < selectedFile.length; i++) {
        let reader = new FileReader();
        const file = selectedFile[i];
        const length = selectedFile.length
        reader.onload = function (e) {
          console.log(length, 'length')
          // console.log(reader.result as string, 'hello')
          imageList.push(reader.result as string)
          console.log(imageList, 'image list 0', i, selectedFile.length, selectedFile.length - 1)
          if (length - 1 == i) {
            setSelectedFiles(imageList)
            
            setIsDoneSelecting(true)
          }
        }; // Would see a path?
        reader.readAsDataURL(file);
        // console.log(selectedFile.length, 'length', url)
      }
      console.log(imageList, 'image list')
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
    setRestaurant({...restaurant, cuisineIds: e})
  }

  const handleRating = (rate: number) => {
    console.log("User rated:", rate)
  }

  const submitReview = (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  useEffect(() => {
    console.log(selectedFiles, 'selectedFiles')
  }, [selectedFiles])

  return (
    <>
      <div className="submitRestaurants mt-20">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
            <h1 className="submitRestaurants__title">
              Chica Bonita Elegante - The Exchange TRX
            </h1>
            <form className="submitRestaurants__form" onSubmit={submitReview}>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Rating
                </label>
                <div className="submitRestaurants__input-group">
                  <Rating defaultRating={0} totalStars={5} onRating={handleRating} />
                  <span>
                    Rating should be solely based on taste of the food
                  </span>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Title
                </label>
                <div className="submitRestaurants__input-group">
                  <input
                    type="text"
                    name="name"
                    className="submitRestaurants__input"
                    placeholder="Title of your review"
                    value={restaurant.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Description
                </label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="name"
                    className="submitRestaurants__input resize-vertical"
                    placeholder="Restaurant Name"
                    defaultValue={'Write a review about the food, service or ambiance of the restaurant'}
                    rows={6}
                  >
                  </textarea>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Upload Photos(Max 6 Photos)</label>
                <div className="submitRestaurants__input-group">
                  <label className="flex gap-2 items-center rounded-xl py-3 px-6 border border-[#494D5D] w-fit cursor-pointer">
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
                    <span className="text-[#494D5D] font-semibold">Upload</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  {/* {selectedFiles} */}
                  {isDoneSelecting && selectedFiles.map((item: any, index: number) =>
                    <div key={index}>
                      {/* <p>{item}</p> */}
                      <img src={item} className="w-40 h-40 object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Give Recognition</label>
                <div className="submitRestaurants__cuisine-checkbox-grid">
                  {tags.map((tag, index) => (
                    <div key={tag.id} className="cuisine-checkbox-item">
                      <Image src={tag.icon} width={24} height={24} alt="icon" />
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
                <Link href="/writing-guidelines" className="underline" target="_blank">
                  Writing Guidelines
                </Link>
              </p>
              <div className="flex gap-4 items-center">
                <button className="submitRestaurants__button" type="submit">
                  Submit Listing
                </button>
                <button className="underline h-10 !text-[#494D5D] !bg-transparent font-semibold text-center" type="submit">
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
          setIsOpen={() => setIsSubmitted(!isSubmitted)} />
      </div>
      <Footer />
    </>
  );
};

export default ReviewSubmissionPage;
