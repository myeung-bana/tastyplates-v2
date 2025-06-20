"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { FiMail } from "react-icons/fi";
import { palates } from "@/data/dummyPalate";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import { image } from "@heroui/theme";
import Link from "next/link";
import Image from "next/image";
import CustomModal from "@/components/ui/Modal/Modal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { useParams, useSearchParams } from "next/navigation";
import ReviewSubmissionSkeleton from "@/components/ui/ReviewSubmissionSkeleton";
import { ReviewService } from "@/services/Reviews/reviewService";
import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { maximumImageLimit, requiredDescription, savedAsDraft } from "@/constants/messages";
import { maximumImage } from "@/constants/validation";
interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineIds: string[];
  location: string;
  priceRange: string;
  address: string;
  phone: string;
  reviews: number;
  description: string;
  recognition?: string[];
}

const ReviewSubmissionPage = () => {
  const params = useParams() as { slug: string; id: string };
  const restaurantId = params.id;
  const { data: session } = useSession();
  const [restaurantName, setRestaurantName] = useState('');
  const [review_main_title, setReviewMainTitle] = useState('');
  const [content, setContent] = useState('');
  const [review_stars, setReviewStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAsDraft, setIsSavingAsDraft] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [uploadedImageError, setUploadedImageError] = useState('');
  const router = useRouter();
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

  useEffect(() => {
    const fetchName = async () => {
      if (!restaurantId || !session?.accessToken) return;

      try {
        const data = await RestaurantService.fetchRestaurantById(restaurantId, "DATABASE_ID", session?.accessToken);
        setRestaurantName(data.title);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchName();
  }, [restaurantId, session]);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const totalImages = selectedFiles.length + files.length;

      if (totalImages > 6) {
        setUploadedImageError(maximumImageLimit(maximumImage));
        return;
      } else {
        setUploadedImageError('');
      }

      const imageList: string[] = [...selectedFiles];
      let loadedImages = 0;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (reader.result) {
            imageList.push(reader.result as string);
          }

          loadedImages++;
          if (loadedImages === files.length) {
            setSelectedFiles(imageList);
            setIsDoneSelecting(true);
          }
        };
        reader.readAsDataURL(file);
      });
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
      setRestaurant((prev: any) => ({
        ...prev,
        cuisineIds: selectedOptions,
      }));
    } else {
      setRestaurant((prev: any) => ({
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
    setReviewStars(rate);
  };

  const submitReview = async (e: FormEvent, mode: 'publish' | 'draft') => {
    e.preventDefault();
    let hasError = false;

    if (content.trim() === '') {
      setDescriptionError(requiredDescription);
      hasError = true;
    } else {
      setDescriptionError('');
    }

    if (hasError) return;

    if (mode === 'publish') {
      setIsLoading(true);
    } else if (mode === 'draft') {
      setIsSavingAsDraft(true);
    }


    try {
      const reviewData = {
        restaurantId,
        authorId: session?.user?.userId,
        review_stars,
        review_main_title,
        content,
        review_images_idz: selectedFiles,
        recognitions: restaurant.recognition || [],
        mode,
      };

      await ReviewService.postReview(reviewData, session?.accessToken ?? "");
      if (mode === 'publish') {
        setIsSubmitted(true);
      } else if (mode === 'draft') {
        toast.success(savedAsDraft);
        router.push('/listing');
      }

      // Reset form fields here:
      setReviewStars(0);
      setReviewMainTitle('');
      setContent('');
      setSelectedFiles([]);
      setIsDoneSelecting(false);
      setRestaurant({
        ...restaurant,
        recognition: [],
      });
      setDescriptionError('');
      setUploadedImageError('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
    setIsLoading(false);
  };

  const handleChangeRecognition = (tagName: string) => {
    setRestaurant((prev) => ({
      ...prev,
      recognition: prev.recognition?.includes(tagName)
        ? prev.recognition.filter((name) => name !== tagName)
        : [...(prev.recognition || []), tagName],
    }));
  };

  const deleteSelectedFile = (index: string) => {
    setSelectedFiles(selectedFiles.filter((item: string) => item != index))
  }

  if (loading) return <ReviewSubmissionSkeleton />;
  return (
    <>
      <div className="submitRestaurants mt-16 md:mt-20">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
            <h1 className="submitRestaurants__title">
              {restaurantName}
            </h1>
            <form className="submitRestaurants__form">
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Rating</label>
                <div className="submitRestaurants__input-group">
                  <Rating
                    totalStars={5}
                    defaultRating={review_stars}
                    onRating={handleRating}
                  />
                  <span className="text-[10px] leading-3 md:text-base">
                    Rating should be solely based on taste of the food
                  </span>
                  {/* {ratingError && (
                    <p className="text-red-600 text-sm mt-1">{ratingError}</p>
                  )} */}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Title</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="title"
                    className="submitRestaurants__input resize-vertical"
                    placeholder="Title of your review"
                    value={review_main_title}
                    onChange={(e) => setReviewMainTitle(e.target.value)}
                    rows={2}
                  ></textarea>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Description</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="content"
                    className="submitRestaurants__input resize-vertical"
                    placeholder="Write a review about the food, service or ambiance of the restaurant"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setDescriptionError('');
                      }
                    }}
                    rows={6}
                  ></textarea>
                  {descriptionError && (
                    <p className="text-red-600 text-sm mt-1">{descriptionError}</p>
                  )}
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
                  {uploadedImageError && (
                    <p className="text-red-600 text-sm mt-1">{uploadedImageError}</p>
                  )}
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
                  {tags.map((tag) => {
                    const isSelected = restaurant.recognition?.includes(tag.name);
                    return (
                      <div
                        key={tag.name}
                        onClick={() => handleChangeRecognition(tag.name)}
                        className={`cuisine-checkbox-item flex items-center cursor-pointer gap-2 !w-fit !rounded-[50px] !px-4 !py-2 border-[1.5px] border-[#494D5D] ${isSelected ? "bg-[#cac9c9]" : "bg-transparent"
                          }`}
                      >
                        <Image src={tag.icon} width={24} height={24} alt="icon" />
                        <span>{tag.name}</span>
                      </div>
                    );
                  })}
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
                <button
                  className="submitRestaurants__button flex items-center gap-2"
                  type="submit"
                  onClick={(e) => submitReview(e, 'publish')}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin w-5 h-5 text-white"
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
                  Post Review
                </button>
                <button
                  className="flex items-center gap-2 underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center"
                  type="submit"
                  onClick={(e) => submitReview(e, 'draft')}
                >
                  {isSavingAsDraft && (
                    <svg
                      className="animate-spin w-5 h-5 text-[#494D5D]"
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
                  Save and exit
                </button>
              </div>
            </form>
          </div>
        </div>
        <CustomModal
          header="Review Posted"
          content={`Your review for ${restaurantName} is successfully posted.`}
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
      </div>
      <Footer />
    </>
  );
};

export default ReviewSubmissionPage;
