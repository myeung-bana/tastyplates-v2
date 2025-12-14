"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdClose, MdOutlineFileUpload } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import CustomModal from "@/components/ui/Modal/Modal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { useParams } from "next/navigation";
import ReviewSubmissionSkeleton from "@/components/ui/Skeleton/ReviewSubmissionSkeleton";
import { ReviewService } from "@/services/Reviews/reviewService";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { transformWordPressImagesToReviewImages, transformReviewImagesToUrls } from "@/utils/reviewTransformers";
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
  const restaurantSlug = params.slug;
  const reviewId = params.id; // UUID of the review
  const { user, firebaseUser } = useFirebaseSession();
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
  const [restaurantUuid, setRestaurantUuid] = useState<string | null>(null);
  const [reviewUuid, setReviewUuid] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!reviewId || !restaurantSlug) return;

      try {
        // Get user ID for fetching review with like status
        const userId = session?.user?.id || session?.user?.userId;

        // Fetch review using V2 API (UUID)
        try {
          const reviewData = await reviewV2Service.getReviewById(reviewId, userId);
          setReviewUuid(reviewData.id);

          // Pre-populate form with existing review data
          setReviewMainTitle(reviewData.title || '');
          setContent(reviewData.content || '');
          setReviewStars(reviewData.rating || 0);

          // Handle images - transform from ReviewImage[] to URL array
          if (reviewData.images && Array.isArray(reviewData.images) && reviewData.images.length > 0) {
            const imageUrls = transformReviewImagesToUrls(reviewData.images);
            setSelectedFiles(imageUrls);
            setIsDoneSelecting(true);
          }

          // Handle recognitions
          if (reviewData.recognitions && Array.isArray(reviewData.recognitions)) {
            setRestaurant(prev => ({
              ...prev,
              recognition: reviewData.recognitions || [],
            }));
          }

          // Get restaurant UUID from review
          const restaurantUuidFromReview = reviewData.restaurant_uuid;
          if (restaurantUuidFromReview) {
            setRestaurantUuid(restaurantUuidFromReview);
          }

          // Fetch restaurant data using slug
          try {
            const restaurantData = await restaurantV2Service.getRestaurantBySlug(restaurantSlug);
            setRestaurantName(restaurantData.title || '');
            setRestaurantImage(restaurantData.featured_image_url || '');
            setRestaurantLocation(restaurantData.listing_street || restaurantData.address?.street_address || '');
            setGoogleMapUrl(restaurantData.address as GoogleMapUrl || null);
            
            setRestaurant(prev => ({
              ...prev,
              name: restaurantData.title || '',
              image: restaurantData.featured_image_url || '',
              location: restaurantData.listing_street || restaurantData.address?.street_address || '',
              slug: restaurantData.slug || restaurantSlug,
              address: restaurantData.listing_street || restaurantData.address?.street_address || '',
              phone: restaurantData.phone || '',
              priceRange: restaurantData.restaurant_price_range?.display_name || '',
              rating: restaurantData.average_rating || 0,
            }));
          } catch (restaurantError) {
            console.error('Failed to fetch restaurant from V2 API, trying WordPress fallback:', restaurantError);
            // Fallback to WordPress API
            if (firebaseUser) {
              try {
                // Get Firebase ID token for authentication
                const idToken = await firebaseUser.getIdToken();
                const wpData = await restaurantService.fetchRestaurantById(restaurantSlug, "SLUG", idToken);
                setRestaurantName((wpData.title as string) || '');
                setRestaurantImage((wpData.featuredImage as any)?.node?.sourceUrl || '');
                setRestaurantLocation((wpData.address as string) || '');
                setGoogleMapUrl((wpData.googleMapUrl as GoogleMapUrl) || null);
              } catch (wpError) {
                console.error('WordPress fallback also failed:', wpError);
                toast.error('Unable to load restaurant information');
              }
            }
          }
        } catch (reviewError) {
          console.error('Failed to fetch review from V2 API, trying WordPress fallback:', reviewError);
          // Fallback to WordPress API
          if (firebaseUser) {
            try {
              // Get Firebase ID token for authentication
              const idToken = await firebaseUser.getIdToken();
              // Try to parse reviewId as number for WordPress
              const numericReviewId = parseInt(reviewId);
              if (!isNaN(numericReviewId)) {
                const reviewData = await reviewService.getReviewById(numericReviewId, idToken);
                
                // Extract restaurant ID and fetch restaurant
                const restaurantIdFromReview = reviewData.post || reviewData.restaurantId;
                if (restaurantIdFromReview && !isNaN(Number(restaurantIdFromReview))) {
                  const restaurantData = await restaurantService.fetchRestaurantById(
                    restaurantIdFromReview.toString(),
                    "DATABASE_ID",
                    idToken
                  );
                  
                  setRestaurantName((restaurantData.title as string) || '');
                  setRestaurantImage((restaurantData.featuredImage as any)?.node?.sourceUrl || '');
                  setRestaurantLocation((restaurantData.address as string) || '');
                  
                  // Pre-populate form
                  setReviewMainTitle((reviewData.review_main_title as string) || '');
                  const contentValue = (reviewData.content as any)?.raw || (reviewData.content as string) || '';
        setContent(contentValue);
        const starsValue = typeof reviewData.review_stars === 'string' 
          ? parseFloat(reviewData.review_stars) 
                    : (reviewData.review_stars as number) || 0;
        setReviewStars(isNaN(starsValue) ? 0 : starsValue);
        
                  // Handle images
                  if (reviewData.review_images && Array.isArray(reviewData.review_images)) {
                    const imageUrls = reviewData.review_images
                      .map((img: any) => img?.sourceUrl || img?.url || (typeof img === 'string' ? img : null))
                      .filter(Boolean);
                    if (imageUrls.length > 0) {
                      setSelectedFiles(imageUrls);
                      setIsDoneSelecting(true);
                    }
                  }
                }
              }
            } catch (wpError) {
              console.error('WordPress fallback also failed:', wpError);
              toast.error('Failed to load review');
            }
          }
        }
        
        // Set recognition tags if available - keep original names for saving, normalize only for comparison
        if (reviewData.recognitions && Array.isArray(reviewData.recognitions)) {
          // Store original tag names as received from backend (preserve case)
          const recognitions = (reviewData.recognitions as string[])
            .map(rec => rec.trim())
            .filter(Boolean);
          
          setRestaurant(prev => ({
            ...prev,
            recognition: recognitions
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

    // Check if we have the review UUID
    if (!reviewUuid && !reviewId) {
      toast.error('Review information not loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    if (mode === 'draft') {
      setIsSavingAsDraft(true);
    }

    try {
      // Get user UUID
      const userId = session?.user?.id || session?.user?.userId;
      if (!userId) {
        toast.error('User not authenticated');
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }

      // Use review UUID (from V2 API) or reviewId (fallback)
      const currentReviewId = reviewUuid || reviewId;
      if (!currentReviewId) {
        toast.error('Review ID is missing');
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }

      // Transform images to ReviewImage format
      const reviewImages = transformWordPressImagesToReviewImages(selectedFiles);

      // Transform recognitions to array format
      const recognitions = restaurant.recognition || [];

      // Update review using V2 API
      try {
        const updateData = {
          title: review_main_title || null,
        content,
          rating: review_stars,
          images: reviewImages.length > 0 ? reviewImages : null,
          recognitions: recognitions.length > 0 ? recognitions : null,
          status: mode === 'publish' ? 'pending' : 'draft', // 'pending' for publish, 'draft' for save
        };

        const updatedReview = await reviewV2Service.updateReview(currentReviewId, updateData);
        
        if (mode === 'publish') {
            setIsSubmitted(true);
          toast.success('Review updated and submitted successfully!');
        } else if (mode === 'draft') {
          toast.success(savedAsDraft);
            router.push(LISTING);
        }
      } catch (apiError: any) {
        // Handle specific error messages
        const errorMessage = apiError.message || errorOccurred;
        
        // Check for duplicate errors
        if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
          toast.error(commentDuplicateError);
        } else if (errorMessage.includes('flood') || errorMessage.includes('rate limit')) {
          toast.error(commentFloodError);
        } else {
          toast.error(errorMessage);
        }
        
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }

      // Reset form fields
      setDescriptionError('');
      setUploadedImageError('');

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
    setRestaurant((prev) => {
      // Normalize both arrays for comparison (case-insensitive)
      const normalizedTagName = tagName.trim().toLowerCase();
      const normalizedRecognitions = prev.recognition?.map(r => r.trim().toLowerCase()) || [];
      const isSelected = normalizedRecognitions.includes(normalizedTagName);
      
      return {
        ...prev,
        recognition: isSelected
          ? prev.recognition?.filter(name => name.trim().toLowerCase() !== normalizedTagName) || []
          : [...(prev.recognition || []), tagName], // Use original tagName for saving
      };
    });
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
                <div className="flex flex-wrap gap-2">
                  {(isDoneSelecting || selectedFiles.length > 0) &&
                    selectedFiles.map((item: string, index: number) => (
                      <div className="rounded-2xl relative" key={`image-${index}-${item.substring(0, 20)}`}>
                        <button
                          type="button"
                          onClick={() => deleteSelectedFile(item)}
                          className="absolute top-3 right-3 rounded-full bg-[#FCFCFC] p-2 z-10 hover:bg-[#E0E0E0] transition-colors"
                          aria-label="Remove image"
                        >
                          <MdClose className="size-3 md:size-4" />
                        </button>
                        <Image
                          src={item}
                          alt={`Review image ${index + 1}`}
                          width={187}
                          height={140}
                          className="rounded-2xl object-cover"
                          unoptimized={item.startsWith('data:')}
                        />
                      </div>
                    ))}
                </div>
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  How would you recognise your experience?
                </label>
                <div className="submitRestaurants__cuisine-checkbox-grid">
                  {tags.map((tag) => {
                    // Normalize both saved recognitions and tag names for case-insensitive comparison
                    const normalizedTagName = tag.name.trim().toLowerCase();
                    const normalizedRecognitions = restaurant.recognition?.map(r => r.trim().toLowerCase()) || [];
                    const isSelected = normalizedRecognitions.includes(normalizedTagName);
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
                  Update Review
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
