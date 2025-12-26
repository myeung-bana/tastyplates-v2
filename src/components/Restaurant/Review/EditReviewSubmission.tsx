"use client";
import React, { FormEvent, useEffect, useState, useRef } from "react";
import "@/styles/pages/_submit-restaurants.scss";
import Rating from "./Rating";
import { MdClose } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone/ImageUploadDropzone";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { useParams } from "next/navigation";
import ReviewSubmissionSkeleton from "@/components/ui/Skeleton/ReviewSubmissionSkeleton";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { transformWordPressImagesToReviewImages, transformReviewImagesToUrls } from "@/utils/reviewTransformers";
import { commentDuplicateError, commentDuplicateWeekError, commentFloodError, errorOccurred, maximumImageLimit, maximumReviewDescription, maximumReviewTitle, minimumImageLimit, requiredDescription, requiredRating, savedAsDraft } from "@/constants/messages";
import { maximumImage, minimumImage, reviewDescriptionLimit, reviewTitleLimit, reviewTitleMaxLimit, reviewDescriptionMaxLimit } from "@/constants/validation";
import { TASTYSTUDIO_REVIEW_LISTING, WRITING_GUIDELINES } from "@/constants/pages";
import { generateProfileUrl } from "@/lib/utils";
import { CASH, FLAG, HELMET, PHONE } from "@/constants/images";
import { GoogleMapUrl } from "@/utils/addressUtils";
import RestaurantReviewHeader from "./RestaurantReviewHeader";
import { Button } from "@/components/ui/button";
import { GridLoader } from 'react-spinners';

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

const EditReviewSubmissionPage = () => {
  const params = useParams() as { slug?: string; id: string };
  const restaurantSlug = params.slug; // Optional: may not exist in new route
  const reviewId = params.id; // UUID of the review
  const { user, firebaseUser, loading: sessionLoading } = useFirebaseSession();
  const hasAttemptedFetch = useRef(false);
  const userDataLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
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
    // Reset fetch attempt flag when reviewId changes
    hasAttemptedFetch.current = false;
    
    // Clear any existing timeout
    if (userDataLoadingTimeout.current) {
      clearTimeout(userDataLoadingTimeout.current);
      userDataLoadingTimeout.current = null;
    }

    // Wait for session to finish loading
    if (sessionLoading) {
      return;
    }

    // If session has loaded and no firebaseUser, redirect (but only once)
    if (!firebaseUser) {
      if (!hasAttemptedFetch.current) {
        setLoading(false);
        toast.error('Please log in to edit reviews');
        router.push(TASTYSTUDIO_REVIEW_LISTING);
        hasAttemptedFetch.current = true;
      }
      return;
    }

    // If firebaseUser exists but Hasura user data is still loading, wait a bit
    if (!user?.id) {
      // Set a timeout to wait for Hasura user data (max 3 seconds)
      userDataLoadingTimeout.current = setTimeout(() => {
        if (!user?.id) {
          console.error('User data loading timeout - Hasura user not available');
          setLoading(false);
          toast.error('User information not available. Please try again.');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
          hasAttemptedFetch.current = true;
        }
      }, 3000);
      return;
    }

    // Clear timeout since we have user data
    if (userDataLoadingTimeout.current) {
      clearTimeout(userDataLoadingTimeout.current);
      userDataLoadingTimeout.current = null;
    }

    // Prevent multiple fetch attempts
    if (hasAttemptedFetch.current) {
      return;
    }

    const fetchData = async () => {
      if (!reviewId) {
        setLoading(false);
        hasAttemptedFetch.current = true;
        return;
      }

      // Get user ID for validation
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        toast.error('User information not available');
        router.push(TASTYSTUDIO_REVIEW_LISTING);
        hasAttemptedFetch.current = true;
        return;
      }

      try {
        // Fetch review using V2 API (UUID) - no fallback to prevent logout
        const reviewData = await reviewV2Service.getReviewById(reviewId, userId);
        
        // Validate author - ensure user can only edit their own reviews
        if (!reviewData.author_id) {
          console.error('Review author information is missing');
          toast.error('Unable to verify review ownership. This review may not be editable.');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
          setLoading(false);
          return;
        }

        if (reviewData.author_id !== userId) {
          console.error('User is not the author of this review', {
            reviewAuthorId: reviewData.author_id,
            currentUserId: userId
          });
          toast.error('You can only edit your own reviews');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
          setLoading(false);
          return;
        }

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

        // Get restaurant UUID from review (optional - don't block editing if missing)
        const restaurantUuidFromReview = reviewData.restaurant_uuid;
        if (restaurantUuidFromReview) {
          setRestaurantUuid(restaurantUuidFromReview);

          // Fetch restaurant data using UUID (non-blocking - allow editing even if this fails)
          try {
            console.log('Fetching restaurant with UUID:', restaurantUuidFromReview);
            const restaurantResponse = await restaurantV2Service.getRestaurantByUuid(restaurantUuidFromReview);
            
            if (restaurantResponse && restaurantResponse.data) {
              const restaurantData = restaurantResponse.data;

              setRestaurantName(restaurantData.title || '');
              setRestaurantImage(restaurantData.featured_image_url || '');
              setRestaurantLocation(restaurantData.listing_street || restaurantData.address?.street_address || '');
              setGoogleMapUrl(restaurantData.address as GoogleMapUrl || null);
              
              setRestaurant(prev => ({
                ...prev,
                name: restaurantData.title || '',
                image: restaurantData.featured_image_url || '',
                location: restaurantData.listing_street || restaurantData.address?.street_address || '',
                slug: restaurantData.slug || '',
                address: restaurantData.listing_street || restaurantData.address?.street_address || '',
                phone: restaurantData.phone || '',
                priceRange: restaurantData.restaurant_price_range?.display_name || '',
                rating: restaurantData.average_rating || 0,
              }));
            } else {
              console.warn('Restaurant response is missing data, continuing with review edit');
              toast.error('Restaurant information unavailable, but you can still edit your review');
            }
          } catch (restaurantError: any) {
            console.error('Failed to fetch restaurant from V2 API:', restaurantError);
            console.error('Restaurant UUID:', restaurantUuidFromReview);
            console.error('Error details:', {
              message: restaurantError?.message,
              status: restaurantError?.status,
              data: restaurantError?.data
            });
            
            // Show warning but don't block editing - restaurant data is optional for editing
            if (restaurantError?.status === 404) {
              toast.error('Restaurant not found, but you can still edit your review');
            } else if (restaurantError?.status === 400) {
              toast.error('Invalid restaurant ID format, but you can still edit your review');
            } else {
              console.warn('Restaurant fetch failed, continuing with review edit:', restaurantError?.message || 'Unknown error');
              toast.error('Restaurant information unavailable, but you can still edit your review');
            }
            
            // Set default/empty values so the form can still be used
            setRestaurantName('Restaurant information unavailable');
            setRestaurantImage('');
            setRestaurantLocation('');
            setGoogleMapUrl(null);
          }
        } else {
          console.warn('Restaurant UUID not found in review, continuing with review edit');
          toast.error('Restaurant information not available, but you can still edit your review');
          
          // Set default values
          setRestaurantName('Restaurant information unavailable');
          setRestaurantImage('');
          setRestaurantLocation('');
          setGoogleMapUrl(null);
        }

      } catch (error: any) {
        console.error('Failed to fetch review:', error);
        hasAttemptedFetch.current = true;
        
        // Handle specific error cases without triggering logout
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          toast.error('Review not found');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          // Don't trigger logout - just show error and redirect
          toast.error('You do not have permission to edit this review');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
        } else {
          toast.error('Failed to load review. Please try again later.');
          router.push(TASTYSTUDIO_REVIEW_LISTING);
        }
      } finally {
        setLoading(false);
        hasAttemptedFetch.current = true;
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (userDataLoadingTimeout.current) {
        clearTimeout(userDataLoadingTimeout.current);
        userDataLoadingTimeout.current = null;
      }
    };
  }, [reviewId, user?.id, firebaseUser, sessionLoading, router]); // Added sessionLoading to dependencies

  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
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
      const userId = user?.id;
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
          status: (mode === 'publish' ? 'approved' : 'draft') as 'draft' | 'pending' | 'approved', // 'approved' for publish, 'draft' for save
        };

        const updatedReview = await reviewV2Service.updateReview(currentReviewId, updateData);
        
        if (mode === 'publish') {
          toast.success('Review updated and submitted successfully!');
          // Redirect to user's profile page (reviews tab)
          if (user?.username) {
            const profileUrl = generateProfileUrl(user.id, user.username);
            router.push(profileUrl);
          } else if (user?.id) {
            // Fallback to UUID if username not available
            const profileUrl = generateProfileUrl(user.id);
            router.push(profileUrl);
          } else {
            // Final fallback to listing page
            router.push(TASTYSTUDIO_REVIEW_LISTING);
          }
        } else if (mode === 'draft') {
          toast.success(savedAsDraft);
          router.push(TASTYSTUDIO_REVIEW_LISTING);
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
                  <ImageUploadDropzone
                    images={selectedFiles}
                    onImagesAdd={(newImageUrls) => {
                      const totalImages = selectedFiles.length + newImageUrls.length;
                      if (totalImages > maximumImage) {
                        setUploadedImageError(maximumImageLimit(maximumImage));
                        return;
                      }
                      setSelectedFiles([...selectedFiles, ...newImageUrls]);
                      setIsDoneSelecting(true);
                      setUploadedImageError('');
                    }}
                    onImageRemove={(imageUrl) => {
                      deleteSelectedFile(imageUrl);
                    }}
                    maxImages={maximumImage}
                    minImages={minimumImage}
                    error={uploadedImageError}
                    disabled={isLoading || isSavingAsDraft}
                    maxFileSizeMB={5}
                  />
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
                  className="underline text-sm md:text-sm font-neusans"
                  target="_blank"
                >
                  Writing Guidelines
                </Link>
              </p>
              <div className="flex gap-3 md:gap-4 items-center justify-center">
                <Button
                  variant="primary"
                  type="submit"
                  onClick={(e) => submitReview(e, 'publish')}
                  disabled={isLoading || isSavingAsDraft}
                  className="flex items-center gap-2"
                >
                  {isLoading && (
                    <GridLoader color="#ffffff" size={5} />
                  )}
                  Update
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push(TASTYSTUDIO_REVIEW_LISTING)}
                  disabled={isLoading || isSavingAsDraft}
                  className="flex items-center gap-2"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditReviewSubmissionPage;
