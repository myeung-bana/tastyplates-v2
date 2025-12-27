"use client";
import React, { FormEvent, useEffect, useState } from "react";
import "@/styles/pages/_submit-restaurants.scss";
import "@/styles/pages/_restaurants.scss";
import Rating from "./Rating";
import { MdClose } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone/ImageUploadDropzone";
import CustomModal from "@/components/ui/Modal/Modal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { useSearchParams, useRouter } from "next/navigation";
import ReviewSubmissionSkeleton from "@/components/ui/Skeleton/ReviewSubmissionSkeleton";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { useFirebaseSession } from '@/hooks/useFirebaseSession'
import toast from 'react-hot-toast';
import { transformWordPressImagesToReviewImages, getRestaurantUuidFromSlug } from "@/utils/reviewTransformers";
import { commentDuplicateError, commentDuplicateWeekError, commentFloodError, errorOccurred, maximumImageLimit, maximumReviewDescription, maximumReviewTitle, minimumImageLimit, requiredDescription, requiredRating, savedAsDraft } from "@/constants/messages";
import { maximumImage, minimumImage, reviewDescriptionLimit, reviewTitleLimit, reviewTitleMaxLimit, reviewDescriptionMaxLimit } from "@/constants/validation";
import { TASTYSTUDIO_ADD_REVIEW, TASTYSTUDIO_REVIEW_LISTING, WRITING_GUIDELINES } from "@/constants/pages";
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
  reviews: number;
  description: string;
  recognition?: string[];
}

const restaurantService = new RestaurantService();

const ReviewSubmissionCreatePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantSlug = searchParams?.get('slug') || undefined; // Get from query parameter
  const { user, firebaseUser } = useFirebaseSession();
  const [restaurantName, setRestaurantName] = useState(restaurantSlug ? 'Loading...' : '');
  const [restaurantImage, setRestaurantImage] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState(restaurantSlug ? 'Loading...' : '');
  const [googleMapUrl, setGoogleMapUrl] = useState<GoogleMapUrl | null>(null);
  const [review_main_title, setReviewMainTitle] = useState('');
  const [content, setContent] = useState('');
  const [review_stars, setReviewStars] = useState(0);
  const [loading, setLoading] = useState(!!restaurantSlug); // Only load if slug provided
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAsDraft, setIsSavingAsDraft] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [reviewTitleError, setReviewTitleError] = useState('');
  const [uploadedImageError, setUploadedImageError] = useState('');
  const [ratingError, setRatingError] = useState('');
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
  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // Preview URLs (base64)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // File objects for S3 upload
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

  // S3 Upload Functions
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl; // Returns S3 URL
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  useEffect(() => {
    // Redirect to search page if no slug provided
    if (!restaurantSlug) {
      router.push(TASTYSTUDIO_ADD_REVIEW);
      return;
    }

    const fetchRestaurantData = async () => {
      try {
        // Try V2 API first (Hasura)
        try {
          const v2Response = await restaurantV2Service.getRestaurantBySlug(restaurantSlug);
          
          if (v2Response && v2Response.data) {
            const v2Data = v2Response.data;
            setRestaurantName(v2Data.title || 'Restaurant');
            setRestaurantImage(v2Data.featured_image_url || '');
            setRestaurantLocation(v2Data.listing_street || v2Data.address?.street_address || 'Location not available');
            setGoogleMapUrl(v2Data.address as GoogleMapUrl || null);
            setRestaurantUuid(v2Data.uuid);
            
            // Set restaurant state
            setRestaurant(prev => ({
              ...prev,
              name: v2Data.title || 'Restaurant',
              image: v2Data.featured_image_url || '',
              location: v2Data.listing_street || v2Data.address?.street_address || 'Location not available',
              slug: v2Data.slug || restaurantSlug,
              address: v2Data.listing_street || v2Data.address?.street_address || '',
              phone: v2Data.phone || '',
              priceRange: v2Data.restaurant_price_range?.display_name || '',
              rating: v2Data.average_rating || 0,
            }));
          } else {
            // If v2Response or v2Response.data is null/undefined, set defaults
            setRestaurantName('Restaurant');
            setRestaurantLocation('Location not available');
          }
        } catch (v2Error) {
          console.log('V2 API failed, trying WordPress fallback:', v2Error);
          // Fallback to WordPress API
          if (firebaseUser) {
            try {
              // Get Firebase ID token for authentication
              const idToken = await firebaseUser.getIdToken();
              const data = await restaurantService.fetchRestaurantById(restaurantSlug, "SLUG", idToken);
              if (data) {
                setRestaurantName(data.title as string || 'Restaurant');
                setRestaurantImage((data.featuredImage as any)?.node?.sourceUrl || '');
                setRestaurantLocation((data.address as string) || 'Location not available');
                setGoogleMapUrl((data.googleMapUrl as GoogleMapUrl) || null);
                
                // Get UUID from slug for V2 API
                try {
                  const uuid = await getRestaurantUuidFromSlug(restaurantSlug);
                  if (uuid) {
                    setRestaurantUuid(uuid);
                  }
                } catch (uuidError) {
                  console.log('Failed to get UUID from slug:', uuidError);
                }
              } else {
                // If data is null/undefined, set defaults
                setRestaurantName('Restaurant');
                setRestaurantLocation('Location not available');
              }
            } catch (wpError) {
              console.error('WordPress API also failed:', wpError);
              // Set defaults even on error
              setRestaurantName('Restaurant');
              setRestaurantLocation('Location not available');
            }
          } else {
            console.warn('No access token available for WordPress fallback');
            // Set defaults if no firebaseUser
            setRestaurantName('Restaurant');
            setRestaurantLocation('Location not available');
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
        toast.error('Failed to load restaurant information');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantSlug, firebaseUser, router]);

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

    if (mode === 'publish') {
      setIsLoading(true);
    } else if (mode === 'draft') {
      setIsSavingAsDraft(true);
    }

    try {
      // Get user UUID (must be a string UUID for V2 API)
      const userId = user?.id;
      if (!userId) {
        toast.error('User not authenticated');
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }
      
      // Ensure userId is a string (UUID format)
      const userIdString = String(userId);
      
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userIdString)) {
        toast.error('Invalid user ID format. Please log in again.');
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }

      // Get restaurant UUID
      let uuid = restaurantUuid;

      // Fallback: Try to get UUID from slug if still not set
      if (!uuid && restaurantSlug) {
        uuid = await getRestaurantUuidFromSlug(restaurantSlug);
        if (!uuid) {
          toast.error('Failed to get restaurant information');
          setIsLoading(false);
          setIsSavingAsDraft(false);
          return;
        }
      }

      if (!uuid) {
        toast.error('Restaurant information is missing. Please select a restaurant.');
        setIsLoading(false);
        setIsSavingAsDraft(false);
        return;
      }

      // Upload pending files to S3 first
      let s3ImageUrls: string[] = [];
      if (pendingFiles.length > 0) {
        try {
          toast.loading(`Uploading ${pendingFiles.length} image(s)...`, { id: 'upload-images' });
          s3ImageUrls = await uploadAllFiles(pendingFiles);
          toast.success("All new images uploaded successfully!", { id: 'upload-images' });
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload images';
          toast.error(`Failed to upload images: ${errorMessage}`, { id: 'upload-images' });
          setIsLoading(false);
          setIsSavingAsDraft(false);
          return;
        }
      }

      // Filter out base64/blob URLs and only use S3 URLs
      const finalImageUrls = s3ImageUrls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('blob:') || url.startsWith('data:')) return false;
        return url.startsWith('http://') || url.startsWith('https://');
      });

      // Transform S3 URLs to ReviewImage format
      const reviewImages = transformWordPressImagesToReviewImages(finalImageUrls);

      // Transform recognitions to array format
      const recognitions = restaurant.recognition || [];

      // Create review using V2 API
      try {
        const reviewData = {
          restaurant_uuid: uuid,
          author_id: userIdString,
          title: review_main_title || undefined,
          content,
          rating: review_stars,
          images: reviewImages.length > 0 ? reviewImages : undefined,
          recognitions: recognitions.length > 0 ? recognitions : undefined,
          status: (mode === 'publish' ? 'approved' : 'draft') as 'draft' | 'pending' | 'approved', // 'approved' for publish, 'draft' for save
        };

        const createdReview = await reviewV2Service.createReview(reviewData);

        if (mode === 'publish') {
          setIsSubmitted(true);
          toast.success('Review submitted successfully!');
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

      // Reset form fields here:
      setReviewStars(0);
      setReviewMainTitle('');
      setContent('');
      setSelectedFiles([]);
      setPendingFiles([]);
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
  
  // If no slug, don't render (will redirect)
  if (!restaurantSlug) {
    return null;
  }

  return (
    <>
      <div className="submitRestaurants font-neusans">
        <div className="submitRestaurants__container max-w-[900px] mx-auto px-4 py-8 md:py-12">
          <div className="submitRestaurants__card">
            {/* Show restaurant header */}
            {restaurantSlug && (
              <>
                <RestaurantReviewHeader 
                  restaurantName={restaurantName}
                  restaurantImage={restaurantImage}
                  restaurantLocation={restaurantLocation}
                  googleMapUrl={googleMapUrl}
                />
              </>
            )}
            
            {/* Show form */}
            {restaurantSlug && (
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
                      onFilesAdd={(newFiles) => {
                        // Track File objects for later upload to S3
                        setPendingFiles([...pendingFiles, ...newFiles]);
                      }}
                      onImageRemove={(imageUrl) => {
                        // Remove from preview URLs
                        const removedIndex = selectedFiles.indexOf(imageUrl);
                        deleteSelectedFile(imageUrl);
                        
                        // Also remove corresponding File object
                        if (removedIndex !== -1 && removedIndex < pendingFiles.length) {
                          setPendingFiles(prev => prev.filter((_, idx) => idx !== removedIndex));
                        }
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
                  Create Review
                </Button>
                <Button
                  variant="secondary"
                  type="submit"
                  onClick={(e) => submitReview(e, 'draft')}
                  disabled={isLoading || isSavingAsDraft}
                  className="flex items-center gap-2"
                >
                  {isSavingAsDraft && (
                    <GridLoader color="#494D5D" size={5} />
                  )}
                  Save as Draft
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
      <CustomModal
        header="Review Posted"
        content={`Your review for ${restaurantName} is successfully posted.`}
        isOpen={isSubmitted}
        setIsOpen={() => setIsSubmitted(!isSubmitted)}
      />
    </>
  );
};

export default ReviewSubmissionCreatePage;

