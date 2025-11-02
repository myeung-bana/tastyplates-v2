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
        
        // Extract restaurant ID from review data
        const restaurantIdFromReview = reviewData.post || reviewData.restaurantId;
        
        if (restaurantIdFromReview && !isNaN(Number(restaurantIdFromReview))) {
          // Set the restaurant database ID for the submit function
          setRestaurantDatabaseId(Number(restaurantIdFromReview));
          
          try {
            
            let restaurantData = await restaurantService.fetchRestaurantById(
              restaurantIdFromReview.toString(), 
              "DATABASE_ID", 
              session?.accessToken
            );

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
              
              // Populate full restaurant object state to match ReviewSubmission structure
              setRestaurant(prev => ({
                ...prev,
                name: (restaurantData.title as string) || '',
                image: (restaurantData.featuredImage as any)?.node?.sourceUrl || '',
                location: (restaurantData.address as string) || '',
                slug: (restaurantData.slug as string) || '',
                address: (restaurantData.address as string) || '',
                phone: (restaurantData.phone as string) || '',
                priceRange: (restaurantData.priceRange as string) || '',
                rating: parseFloat((restaurantData.averageRating as string) || '0') || 0,
                cuisineIds: ((restaurantData.palates as any)?.nodes || []).map((p: any) => p.id || '').filter(Boolean),
              }));
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
        
        // Parse review_stars from string to number (backend returns as string)
        const starsValue = typeof reviewData.review_stars === 'string' 
          ? parseFloat(reviewData.review_stars) 
          : (typeof reviewData.review_stars === 'number' 
              ? reviewData.review_stars 
              : (typeof reviewData.reviewStars === 'string' 
                  ? parseFloat(reviewData.reviewStars) 
                  : (typeof reviewData.reviewStars === 'number' ? reviewData.reviewStars : 0)));
        setReviewStars(isNaN(starsValue) ? 0 : starsValue);
        
        // Handle existing photos - backend returns review_images with sourceUrl and id
        let existingImages: string[] = [];
        
        console.log('Loading draft images from reviewData:', {
          review_images: reviewData.review_images,
          review_images_idz: reviewData.review_images_idz,
          reviewImages: reviewData.reviewImages
        });
        
        // Priority: review_images (from GET endpoint with URLs), then review_images_idz (IDs), then reviewImages (fallback)
        if (reviewData.review_images && Array.isArray(reviewData.review_images) && reviewData.review_images.length > 0) {
          // Backend returns review_images as array of { id, sourceUrl }
          existingImages = reviewData.review_images
            .map((img: any) => {
              // Handle object with sourceUrl property
              if (img && typeof img === 'object') {
                return img.sourceUrl || img.url || null;
              }
              // Handle string URL
              if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:'))) {
                return img;
              }
              return null;
            })
            .filter((url: string | null): url is string => Boolean(url) && url.length > 0);
        } else if (reviewData.review_images_idz && Array.isArray(reviewData.review_images_idz) && reviewData.review_images_idz.length > 0) {
          // If we have IDs, try to extract URLs from objects
          existingImages = reviewData.review_images_idz
            .map((img: any) => {
              // If it's already a URL string, use it
              if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:'))) {
                return img;
              }
              // If it's an object with sourceUrl, use that
              if (img && typeof img === 'object' && img.sourceUrl) {
                return img.sourceUrl;
              }
              // If it's an object with url, use that
              if (img && typeof img === 'object' && img.url) {
                return img.url;
              }
              // IDs without URLs can't be displayed - return null
              return null;
            })
            .filter((url: string | null): url is string => Boolean(url) && url.length > 0);
        } else if (reviewData.reviewImages && Array.isArray(reviewData.reviewImages) && reviewData.reviewImages.length > 0) {
          // Fallback: try reviewImages field
          existingImages = reviewData.reviewImages
            .map((img: any) => {
              if (img && typeof img === 'object') {
                return img.sourceUrl || img.url || null;
              }
              if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:'))) {
                return img;
              }
              return null;
            })
            .filter((url: string | null): url is string => Boolean(url) && url.length > 0);
        }
        
        console.log('Extracted existing images:', existingImages);
        
        if (existingImages.length > 0) {
          setSelectedFiles(existingImages);
          setIsDoneSelecting(true);
          console.log('Successfully loaded', existingImages.length, 'images for display');
        } else {
          console.log('No valid image URLs found in review data');
          setSelectedFiles([]);
          setIsDoneSelecting(false);
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
      // Prepare image data - convert URLs back to IDs if needed, or keep existing format
      let imageData = selectedFiles;
      
      // If selectedFiles contains URLs, we need to extract IDs or let backend handle
      // Backend PUT endpoint can handle URLs and convert them back to IDs
      // For now, send as-is and let backend handle the conversion
      
      const reviewData = {
        restaurantId: restaurantDatabaseId, // Use the actual restaurant database ID
        authorId: session?.user?.userId,
        review_stars,
        review_main_title,
        content,
        review_images: imageData, // Backend will handle URL to ID conversion
        recognitions: restaurant.recognition || [],
        mode,
      };

      console.log('Submitting review data:', reviewData);
      console.log('Review ID:', reviewId);
      console.log('Is editing draft:', !!reviewId);
      console.log('Access token exists:', !!session?.accessToken);

      // If editing an existing draft (reviewId exists), use updateReviewDraft
      if (reviewId && !isNaN(reviewId)) {
        const res = await reviewService.updateReviewDraft(reviewId, reviewData, session?.accessToken ?? "");
      
        console.log('Update response:', res);
        
        // Handle response - updateReviewDraft returns { status, message, data }
        const responseStatus = res.status || (res as any)?.data?.status || 200;
        
        if (mode === 'publish') {
          if (responseStatus === code.created || responseStatus === 200) {
            setIsSubmitted(true);
            toast.success('Review published successfully');
            router.push(LISTING);
          } else if (responseStatus === code.conflict) {
            toast.error(commentDuplicateError);
            setIsLoading(false);
            return;
          } else if (responseStatus === code.duplicate_week) {
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
          if (responseStatus === code.created || responseStatus === 200) {
            toast.success(savedAsDraft);
            router.push(LISTING);
          } else if (responseStatus === code.duplicate_week) {
            toast.error(commentDuplicateWeekError);
            setIsSavingAsDraft(false);
            return;
          } else if (responseStatus === code.conflict) {
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
      } else {
        // This shouldn't happen in EditReviewSubmission, but handle gracefully
        toast.error('Review ID not found. Cannot update review.');
        setIsLoading(false);
        return;
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
