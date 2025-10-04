"use client";
import React, { FormEvent, useEffect, useState } from "react";
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
  description: string;
  recognition?: string[];
}

const restaurantService = new RestaurantService();
const reviewService = new ReviewService();

const EditReviewSubmissionPage = () => {
  const params = useParams() as { slug: string; id: string };
  const restaurantId = params.id;
  const reviewId = parseInt(params.id); // For edit mode, the id is the review ID
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
  const [restaurantDatabaseId, setRestaurantDatabaseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!reviewId || !session?.accessToken) return;

      try {
        // Fetch the review data first
        const reviewData = await reviewService.getReviewById(reviewId, session?.accessToken);
        
        // Debug: Log the review data structure to understand what we're working with
        console.log('Review data received:', reviewData);
        console.log('Review data keys:', Object.keys(reviewData));
        console.log('Review data.post:', reviewData.post);
        console.log('Review data.post type:', typeof reviewData.post);
        console.log('Review data.restaurantId:', reviewData.restaurantId);
        console.log('Review data.restaurantId type:', typeof reviewData.restaurantId);
        
        // Extract restaurant ID from review data
        const restaurantIdFromReview = reviewData.post || reviewData.restaurantId;
        
        console.log('Review data post field:', reviewData.post);
        console.log('Review data restaurantId field:', reviewData.restaurantId);
        console.log('Extracted restaurant ID:', restaurantIdFromReview);
        console.log('Restaurant ID is valid number:', !isNaN(Number(restaurantIdFromReview)));
        console.log('Restaurant ID as number:', Number(restaurantIdFromReview));
        
        if (restaurantIdFromReview && !isNaN(Number(restaurantIdFromReview))) {
          // Set the restaurant database ID for the submit function
          setRestaurantDatabaseId(Number(restaurantIdFromReview));
          
          try {
            // Fetch restaurant data
            console.log('Attempting to fetch restaurant with ID:', restaurantIdFromReview);
            console.log('ID Type:', 'DATABASE_ID');
            console.log('Access Token exists:', !!session?.accessToken);
            
            let restaurantData = await restaurantService.fetchRestaurantById(
              restaurantIdFromReview.toString(), 
              "DATABASE_ID", 
              session?.accessToken
            );
            
            console.log('Restaurant data received (DATABASE_ID):', restaurantData);
            console.log('Restaurant data type:', typeof restaurantData);
            console.log('Restaurant data is null:', restaurantData === null);
            console.log('Restaurant data is undefined:', restaurantData === undefined);
            
            // If DATABASE_ID fails, try with SLUG as fallback
            if (!restaurantData || restaurantData === null) {
              console.log('Trying with SLUG as fallback...');
              try {
                restaurantData = await restaurantService.fetchRestaurantById(
                  restaurantIdFromReview.toString(), 
                  "SLUG", 
                  session?.accessToken
                );
                console.log('Restaurant data received (SLUG):', restaurantData);
              } catch (slugError) {
                console.error('SLUG fallback also failed:', slugError);
              }
            }
            
            if (restaurantData && typeof restaurantData === 'object') {
              setRestaurantName((restaurantData.title as string) || 'Restaurant Name Not Available');
              setRestaurantImage((restaurantData.featuredImage as any)?.node?.sourceUrl || '');
              setRestaurantLocation((restaurantData.address as string) || 'Location Not Available');
              setGoogleMapUrl((restaurantData.googleMapUrl as GoogleMapUrl) || null);
            } else {
              console.error('Restaurant data is null or invalid after all attempts:', restaurantData);
              setRestaurantName('Restaurant Name Not Available');
              setRestaurantLocation('Location Not Available');
              toast.error('Unable to load restaurant information. The restaurant may have been deleted or moved.');
            }
          } catch (restaurantError) {
            console.error('Failed to fetch restaurant data:', restaurantError);
            setRestaurantName('Restaurant Name Not Available');
            setRestaurantLocation('Location Not Available');
            toast.error('Unable to load restaurant information. Please try refreshing the page.');
          }
        } else {
          console.error('No restaurant ID found in review data');
          setRestaurantName('Restaurant Name Not Available');
          setRestaurantLocation('Location Not Available');
        }

        // Pre-populate form with existing review data
        setReviewMainTitle((reviewData.review_main_title as string) || (reviewData.reviewMainTitle as string) || '');
        
        // Handle content - check for both raw and rendered content
        const contentValue = (reviewData.content as any)?.raw || 
                           (reviewData.content as any)?.rendered || 
                           (reviewData.content as string) || '';
        setContent(contentValue);
        
        setReviewStars((reviewData.review_stars as number) || (reviewData.reviewStars as number) || 0);
        
        // Handle existing photos - check multiple possible field names
        let existingImages: string[] = [];
        
        if (reviewData.review_images_idz && Array.isArray(reviewData.review_images_idz)) {
          existingImages = reviewData.review_images_idz.map((img: any) => 
            img.sourceUrl || img.url || img
          ).filter(Boolean);
        } else if (reviewData.reviewImages && Array.isArray(reviewData.reviewImages)) {
          existingImages = reviewData.reviewImages.map((img: any) => 
            img.sourceUrl || img.url || img
          ).filter(Boolean);
        }
        
        if (existingImages.length > 0) {
          setSelectedFiles(existingImages);
          setIsDoneSelecting(true);
        }
        
        // Set recognition tags if available
        if (reviewData.recognitions && Array.isArray(reviewData.recognitions)) {
          setRestaurant(prev => ({
            ...prev,
            recognition: reviewData.recognitions as string[]
          }));
        }

      } catch (error) {
        console.error(error);
        toast.error('Failed to load review data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId, session]);

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
      name: "Insta Worthy",
      icon: HELMET,
    },
    {
      id: 3,
      name: "Value for Money",
      icon: CASH,
    },
    {
      id: 4,
      name: "Best Service",
      icon: PHONE,
    },
  ];

  const handleRating = (rating: number) => {
    setReviewStars(rating);
    if (rating > 0) {
      setRatingError('');
    }
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

    if (content.trim() === '') {
      setDescriptionError(requiredDescription);
      hasError = true;
    } else if (content.length > reviewDescriptionMaxLimit) {
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

    // Check if we have the restaurant database ID
    if (!restaurantDatabaseId) {
      toast.error('Restaurant information not loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    if (mode === 'draft') {
      setIsSavingAsDraft(true);
    }

    try {
      const reviewData = {
        restaurantId: restaurantDatabaseId, // Use the actual restaurant database ID
        authorId: session?.user?.userId,
        review_stars,
        review_main_title,
        content,
        review_images_idz: selectedFiles,
        recognitions: restaurant.recognition || [],
        mode,
      };

      console.log('Submitting review data:', reviewData);
      console.log('Review ID:', reviewId);
      console.log('Access token exists:', !!session?.accessToken);

      const res = await reviewService.updateReviewDraft(reviewId, reviewData, session?.accessToken ?? "");
      
      console.log('Update response:', res);
      
      if (mode === 'publish') {
        if (res.status === code.created || res.status === 200) {
          setIsSubmitted(true);
        } else if (res.status === code.conflict) {
          toast.error(commentDuplicateError);
          setIsLoading(false);
          return
        } else if (res.status === code.duplicate_week) {
          toast.error(commentDuplicateWeekError);
          setIsLoading(false);
          return;
        } else if ((res.data as any)?.code === 'comment_flood') {
          toast.error(commentFloodError);
          setIsLoading(false);
          return;
        } else {
          toast.error(errorOccurred);
          setIsLoading(false);
          return;
        }
      } else if (mode === 'draft') {
        if (res.status === code.created || res.status === 200) {
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
        } else if ((res.data as any)?.code === 'comment_flood') {
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
      setRestaurant(prev => ({ ...prev, recognition: [] }));
      setUploadedImageError('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      console.error('Error details:', error);
      toast.error('Failed to update review. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSavingAsDraft(false);
    }
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
                  <div className="submitRestaurants__upload-area">
                    <div className="submitRestaurants__upload-content">
                      <MdOutlineFileUpload className="submitRestaurants__upload-icon" />
                      <p className="submitRestaurants__upload-text">
                        Drag and drop your photos here, or click to browse
                      </p>
                      <p className="submitRestaurants__upload-subtext">
                        Supported formats: JPG, PNG, GIF (Max 5MB each)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="submitRestaurants__file-input"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length + selectedFiles.length > maximumImage) {
                          setUploadedImageError(maximumImageLimit);
                          return;
                        }
                        if (files.length < minimumImage) {
                          setUploadedImageError(minimumImageLimit);
                          return;
                        }
                        setUploadedImageError('');
                        setIsDoneSelecting(true);
                      }}
                    />
                  </div>
                  {uploadedImageError && (
                    <p className="text-red-600 text-sm mt-1">{uploadedImageError}</p>
                  )}
                  {(isDoneSelecting || selectedFiles.length > 0) && (
                    <div className="submitRestaurants__selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="submitRestaurants__file-item">
                          <Image
                            src={file}
                            alt={`Selected file ${index + 1}`}
                            width={80}
                            height={80}
                            className="rounded-2xl object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => deleteSelectedFile(file)}
                            className="submitRestaurants__delete-btn"
                          >
                            <MdClose className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  Update Review
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
          header="Review Updated"
          content={`Your review for ${restaurantName} has been successfully updated.`}
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
      </div>
    </>
  );
};

export default EditReviewSubmissionPage;
