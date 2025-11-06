"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Footer from "@/components/layout/Footer";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import CustomModal from "@/components/ui/Modal/Modal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { useParams } from "next/navigation";
import ReviewSubmissionSkeleton from "@/components/ui/Skeleton/ReviewSubmissionSkeleton";
import { ReviewService } from "@/services/Reviews/reviewService";
import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { commentDuplicateError, commentDuplicateWeekError, commentFloodError, errorOccurred, maximumImageLimit, maximumReviewDescription, maximumReviewTitle, minimumImageLimit, requiredDescription, requiredRating, savedAsDraft } from "@/constants/messages";
import { maximumImage, minimumImage, reviewDescriptionLimit, reviewTitleLimit, reviewTitleMaxLimit, reviewDescriptionMaxLimit } from "@/constants/validation";
import { LISTING, WRITING_GUIDELINES } from "@/constants/pages";
import { responseStatusCode as code } from "@/constants/response";
import { CASH, FLAG, HELMET, PHONE } from "@/constants/images";
import { getCityCountry } from "@/utils/addressUtils";
import { GoogleMapUrl } from "@/utils/addressUtils";
import RestaurantReviewHeader from "./RestaurantReviewHeader";
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

const restaurantService = new RestaurantService();
const reviewService = new ReviewService();

const ReviewSubmissionPage = () => {
  const params = useParams() as { slug: string; id: string };
  const restaurantId = params.id;
  const { data: session } = useSession();
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantImage, setRestaurantImage] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState<GoogleMapUrl | null>(null);
  const [review_main_title, setReviewMainTitle] = useState('');
  const [content, setContent] = useState('');
  const [review_stars, setReviewStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAsDraft, setIsSavingAsDraft] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [reviewTitleError, setReviewTitleError] = useState('');
  const [uploadedImageError, setUploadedImageError] = useState('');
  const [ratingError, setRatingError] = useState('');
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
    const fetchRestaurantData = async () => {
      if (!restaurantId || !session?.accessToken) return;

      try {
        const data = await restaurantService.fetchRestaurantById(restaurantId, "DATABASE_ID", session?.accessToken);
        setRestaurantName(data.title as string);
        setRestaurantImage((data.featuredImage as any)?.node?.sourceUrl || '');
        setRestaurantLocation((data.address as string) || '');
        setGoogleMapUrl((data.googleMapUrl as GoogleMapUrl) || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId, session]);

  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const tags = [
    {
      id: 1,
      name: "Must Revisit",
      icon: FLAG,
    },
    {
      id: 2,
      name: "Insta-Worthy",
      icon: PHONE,
    },
    {
      id: 3,
      name: "Value for Money",
      icon: CASH,
    },
    {
      id: 4,
      name: "Best Service",
      icon: HELMET,
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
        reader.onload = () => {
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



  const handleRating = (rate: number) => {
    setReviewStars(rate);
    setRatingError('');
  };

  const submitReview = async (e: FormEvent, mode: 'publish' | 'draft') => {
    e.preventDefault();
    let hasError = false;

    if (review_stars === 0) {
      setRatingError(requiredRating);
      hasError = true;
    } else {
      setRatingError('');
    }

    if (selectedFiles.length < minimumImage) {
      setUploadedImageError(minimumImageLimit(minimumImage));
      hasError = true;
    } else if (selectedFiles.length > maximumImage) {
      setUploadedImageError(maximumImageLimit(maximumImage));
      hasError = true;
    } else {
      setUploadedImageError('');
    }

    if (content.trim() === '') {
      setDescriptionError(requiredDescription);
      hasError = true;
    } else     if (content.length > reviewDescriptionMaxLimit) {
      setDescriptionError(maximumReviewDescription(reviewDescriptionMaxLimit));
      hasError = true;
    } else {
      setDescriptionError('');
    }

    if (review_main_title.length > reviewTitleMaxLimit) {
      setReviewTitleError(maximumReviewTitle(reviewTitleMaxLimit));
      hasError = true;
    } else {
      setReviewTitleError('');
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
        review_images: selectedFiles,
        recognitions: restaurant.recognition || [],
        mode,
      };

      const res = await reviewService.postReview(reviewData, session?.accessToken ?? "");
      if (mode === 'publish') {
        if (res.status === code.created || res.status === code.success) {
          setIsSubmitted(true);
        } else if (res.status === code.conflict) {
          toast.error(commentDuplicateError);
          setIsLoading(false);
          return
        } else if (res.status === code.duplicate_week) {
          toast.error(commentDuplicateWeekError);
          setIsLoading(false);
          return;
        } else if (res.data?.code === 'comment_flood') {
          toast.error(commentFloodError);
          setIsLoading(false);
          return;
        } else {
          toast.error(errorOccurred);
          setIsLoading(false);
          return;
        }
      } else if (mode === 'draft') {
        if (res.status === code.created || res.status === code.success) {
          toast.success(savedAsDraft);
          router.push(LISTING);
        } else if (res.status === code.duplicate_week) {
          toast.error(commentDuplicateWeekError);
          setIsSavingAsDraft(false);
          return;
        } else if (res.status === code.conflict) {
          toast.error(commentDuplicateError);
          setIsSavingAsDraft(false);
          return;
        } else if (res.data?.code === 'comment_flood') {
          toast.error(commentFloodError);
          setIsLoading(false);
          return;
        } else {
          toast.error(errorOccurred);
          setIsSavingAsDraft(false);
          return;
        }
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
      <div className="submitRestaurants mt-16 md:mt-20 font-neusans">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
          <RestaurantReviewHeader 
            restaurantName={restaurantName}
            restaurantImage={restaurantImage}
            restaurantLocation={restaurantLocation}
            googleMapUrl={googleMapUrl}
          />
          <form className="submitRestaurants__form">
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">How would you rate your experience?</label>
                <div className="submitRestaurants__input-group">
                  <Rating
                    totalStars={5}
                    defaultRating={review_stars}
                    onRating={handleRating}
                  />
                  <span className="text-[10px] mt-2 leading-3 md:text-sm">
                    Rating should be solely based on taste of the food
                  </span>
                  {ratingError && (
                    <p className="text-red-600 text-sm mt-1">{ratingError}</p>
                  )}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Review Title</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="title"
                    className="submitRestaurants__input resize-vertical"
                    placeholder="Start with a review title..."
                    value={review_main_title}
                    maxLength={reviewTitleMaxLimit}
                    onChange={(e) => {
                      setReviewMainTitle(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setReviewTitleError('');
                      }
                    }}
                    rows={2}
                  ></textarea>
                  <div className="character-counter">
                    <span className={review_main_title.length > 40 ? 'text-red-500' : 'text-gray-500'}>
                      {review_main_title.length}/{reviewTitleMaxLimit}
                    </span>
                  </div>
                  {reviewTitleError && (
                    <p className="text-red-600 text-sm mt-1">{reviewTitleError}</p>
                  )}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Tell us about your experience</label>
                <div className="submitRestaurants__input-group">
                  <textarea
                    name="content"
                    className="submitRestaurants__input resize-vertical md:!h-full"
                    placeholder="Write a review about the food, service or ambiance of the restaurant"
                    value={content}
                    maxLength={reviewDescriptionMaxLimit}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setDescriptionError('');
                      }
                    }}
                    rows={6}
                  ></textarea>
                  <div className="character-counter">
                    <span className={content.length > 1000 ? 'text-red-500' : 'text-gray-500'}>
                      {content.length}/{reviewDescriptionMaxLimit}
                    </span>
                  </div>
                  {descriptionError && (
                    <p className="text-red-600 text-sm mt-1">{descriptionError}</p>
                  )}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Upload Photos (Max 6 Photos)
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
                    selectedFiles.map((item: string, index: number) => (
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
                          alt="Review image"
                          width={187}
                          height={140}
                          className="rounded-2xl object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  How would you recognise your experience?
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
                        <span className="text-sm md:text-base">{tag.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-sm md:text-sm text-[#31343F]">
                By posting a review, you agree that you are above 13 years old and agree to TastyPlates'&nbsp;
                <Link
                  href={WRITING_GUIDELINES}
                  className="underline"
                  target="_blank"
                >
                  Writing Guidelines
                </Link>
              </p>
              <div className="flex gap-3 md:gap-4 items-center justify-center">
                <button
                  className={`submitRestaurants__button flex items-center gap-2 ${isLoading || isSavingAsDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
                  type="submit"
                  onClick={(e) => submitReview(e, 'publish')}
                  disabled={isLoading || isSavingAsDraft}
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
                  className={`flex items-center gap-2 underline h-5 md:h-10 text-sm md:text-base !text-[#494D5D] !bg-transparent font-semibold text-center ${isLoading || isSavingAsDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
                  type="submit"
                  onClick={(e) => submitReview(e, 'draft')}
                  disabled={isLoading || isSavingAsDraft}
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
    </>
  );
};

export default ReviewSubmissionPage;
