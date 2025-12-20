"use client";
import React, { FormEvent, useEffect, useState, useCallback } from "react";
import Footer from "@/components/layout/Footer";
import "@/styles/pages/_submit-restaurants.scss";
import "@/styles/pages/_restaurants.scss";
import Rating from "./Rating";
import RestaurantCard from "@/components/Restaurant/RestaurantCard";
import SkeletonCard from "@/components/ui/Skeleton/SkeletonCard";
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
import { useFirebaseSession } from '@/hooks/useFirebaseSession'
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { transformWordPressImagesToReviewImages, getRestaurantUuidFromSlug } from "@/utils/reviewTransformers";
import { commentDuplicateError, commentDuplicateWeekError, commentFloodError, errorOccurred, maximumImageLimit, maximumReviewDescription, maximumReviewTitle, minimumImageLimit, requiredDescription, requiredRating, savedAsDraft } from "@/constants/messages";
import { maximumImage, minimumImage, reviewDescriptionLimit, reviewTitleLimit, reviewTitleMaxLimit, reviewDescriptionMaxLimit } from "@/constants/validation";
import { LISTING, WRITING_GUIDELINES } from "@/constants/pages";
import { responseStatusCode as code } from "@/constants/response";
import { CASH, FLAG, HELMET, PHONE } from "@/constants/images";
import { getCityCountry } from "@/utils/addressUtils";
import { GoogleMapUrl } from "@/utils/addressUtils";
import RestaurantReviewHeader from "./RestaurantReviewHeader";
import { RestaurantSelection } from "@/components/reviews/RestaurantSearch";
import { GooglePlacesAutocomplete } from "@/components/ui/GooglePlacesAutocomplete";
import { RestaurantMatchDialog } from "@/components/reviews/RestaurantMatchDialog";
import { RestaurantPlaceData, formatAddressComponents, getPhotoUrl, fetchPlaceDetails } from "@/lib/google-places-utils";
import { RestaurantV2 } from "@/app/api/v1/services/restaurantV2Service";
import RecentlyVisitedRestaurants from "@/components/Restaurant/RecentlyVisitedRestaurants";
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
  const params = useParams() as { slug?: string };
  const restaurantSlug = params.slug; // Optional - undefined for /add-review route
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
  // Restaurant selection state (for /add-review route)
  const [restaurantSelection, setRestaurantSelection] = useState<RestaurantSelection | null>(null);
  const [isRestaurantSelected, setIsRestaurantSelected] = useState(!!restaurantSlug);
  // Google Places Autocomplete and match dialog state
  const [searchValue, setSearchValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<RestaurantPlaceData | null>(null);
  const [existingRestaurant, setExistingRestaurant] = useState<RestaurantV2 | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!restaurantSlug) {
        setLoading(false);
        return;
      }

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
  }, [restaurantSlug, firebaseUser]);


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

      // If restaurant was selected via search (not slug), handle creation
      if (!uuid && restaurantSelection) {
        if (restaurantSelection.type === 'existing' && restaurantSelection.restaurantUuid) {
          uuid = restaurantSelection.restaurantUuid;
        } else if (restaurantSelection.type === 'new' && restaurantSelection.placeData) {
          // Create restaurant from Google Places data
          try {
            const placeData = restaurantSelection.placeData;
            const addressComponents = placeData.address_components || [];
            const formattedAddress = placeData.formatted_address || '';
            
            const createResponse = await fetch('/api/v1/restaurants-v2/create-restaurant', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: placeData.name,
                place_id: placeData.place_id,
                formatted_address: formattedAddress,
                address_components: addressComponents,
                latitude: placeData.geometry?.location?.lat(),
                longitude: placeData.geometry?.location?.lng(),
                phone: placeData.phone,
                website: placeData.website,
                status: 'draft', // User-created restaurants start as draft
              }),
            });

            if (!createResponse.ok) {
              const errorData = await createResponse.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to create restaurant');
            }

            const createData = await createResponse.json();
            
            if (createData.success && createData.data?.uuid) {
              uuid = createData.data.uuid;
            } else {
              throw new Error('Failed to create restaurant - no UUID returned');
            }
          } catch (createError: any) {
            console.error('Error creating restaurant:', createError);
            toast.error(createError.message || 'Failed to create restaurant. Please try again.');
            setIsLoading(false);
            setIsSavingAsDraft(false);
            return;
          }
        }
      }

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

      // Transform images to ReviewImage format
      const reviewImages = transformWordPressImagesToReviewImages(selectedFiles);

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
          status: (mode === 'publish' ? 'pending' : 'draft') as 'draft' | 'pending', // 'pending' for publish, 'draft' for save
        };

        const createdReview = await reviewV2Service.createReview(reviewData);

        if (mode === 'publish') {
          setIsSubmitted(true);
          toast.success('Review submitted successfully!');
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

  // Handle place selection from GooglePlacesAutocomplete
  const handlePlaceSelect = async (place: { place_id: string; description: string }) => {
    if (!place.place_id) {
      toast.error('Invalid place selection');
      return;
    }

    setIsMatching(true);
    setSearchValue(place.description);

    try {
      const placeData = await fetchPlaceDetails(place.place_id);
      if (!placeData) {
        toast.error('Failed to fetch restaurant details. Please try again.');
        setIsMatching(false);
        return;
      }

      setSelectedPlace(placeData);

      try {
        const matchResponse = await fetch('/api/v1/restaurants-v2/match-restaurant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: placeData.place_id,
            name: placeData.name,
            address: placeData.formatted_address,
            latitude: placeData.geometry?.location?.lat(),
            longitude: placeData.geometry?.location?.lng(),
          }),
        });

        if (!matchResponse.ok) {
          throw new Error('Failed to check for existing restaurant');
        }

        const matchData = await matchResponse.json();

        if (matchData.match && matchData.restaurant) {
          setExistingRestaurant(matchData.restaurant);
        } else {
          setExistingRestaurant(null);
        }

        setShowMatchDialog(true);
      } catch (matchError) {
        console.error('Error matching restaurant:', matchError);
        toast.error('Failed to check for existing restaurant. Please try again.');
        setExistingRestaurant(null);
        setShowMatchDialog(true);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      toast.error('Failed to fetch restaurant details. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectExisting = (restaurant: RestaurantV2) => {
    handleRestaurantSelect({
      type: 'existing',
      restaurantUuid: restaurant.uuid,
    });
    setSearchValue(restaurant.title);
    setSelectedPlace(null);
    setExistingRestaurant(null);
  };

  const handleCreateNew = (placeData: RestaurantPlaceData) => {
    handleRestaurantSelect({
      type: 'new',
      placeData: placeData,
    });
    setSearchValue(placeData.name);
    setSelectedPlace(null);
    setExistingRestaurant(null);
  };

  // Handle restaurant selection from search
  const handleRestaurantSelect = (selection: RestaurantSelection) => {
    setRestaurantSelection(selection);
    
    if (selection.type === 'existing' && selection.restaurantUuid) {
      // Fetch restaurant details to display
      restaurantV2Service.getRestaurantByUuid(selection.restaurantUuid)
        .then((response: any) => {
          if (response && response.data) {
            const v2Data = response.data;
            setRestaurantName(v2Data.title || 'Restaurant');
            setRestaurantImage(v2Data.featured_image_url || '');
            setRestaurantLocation(v2Data.listing_street || v2Data.address?.street_address || 'Location not available');
            setGoogleMapUrl(v2Data.address as GoogleMapUrl || null);
            setRestaurantUuid(v2Data.uuid);
            
            setRestaurant(prev => ({
              ...prev,
              name: v2Data.title || 'Restaurant',
              image: v2Data.featured_image_url || '',
              location: v2Data.listing_street || v2Data.address?.street_address || 'Location not available',
              slug: v2Data.slug || '',
              address: v2Data.listing_street || v2Data.address?.street_address || '',
              phone: v2Data.phone || '',
              priceRange: v2Data.restaurant_price_range?.display_name || '',
              rating: v2Data.average_rating || 0,
            }));
          }
        })
        .catch((error: any) => {
          console.error('Error fetching selected restaurant:', error);
          toast.error('Failed to load restaurant details');
        });
    } else if (selection.type === 'new' && selection.placeData) {
      // Use Google Places data to display
      const placeData = selection.placeData;
      const address = formatAddressComponents(placeData.address_components || []);
      const firstPhoto = placeData.photos && placeData.photos.length > 0 ? placeData.photos[0] : null;
      const photoUrl = firstPhoto ? getPhotoUrl(firstPhoto, 400) : null;
      
      setRestaurantName(placeData.name);
      setRestaurantImage(photoUrl || '');
      setRestaurantLocation(placeData.formatted_address || 'Location not available');
      setGoogleMapUrl(address);
      
      setRestaurant(prev => ({
        ...prev,
        name: placeData.name,
        image: photoUrl || '',
        location: placeData.formatted_address || 'Location not available',
        slug: '',
        address: placeData.formatted_address || '',
        phone: placeData.phone || '',
        priceRange: '',
        rating: placeData.rating || 0,
      }));
    }
    
    setIsRestaurantSelected(true);
  };

  if (loading) return <ReviewSubmissionSkeleton />;
  return (
    <>
      <div className="submitRestaurants mt-16 md:mt-20 font-neusans">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
          {/* Show restaurant search if no slug and restaurant not selected */}
          {!restaurantSlug && !isRestaurantSelected ? (
            <div className="mb-6">
              <h1 className="text-lg md:text-2xl text-[#31343F] text text-center font-neusans mb-6">Find a listing to review</h1>
              <div className="flex justify-center">
                <div className="w-full max-w-[525px]">
                  <GooglePlacesAutocomplete
                    value={searchValue}
                    onChange={setSearchValue}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search by Listing Name"
                    searchType="restaurant"
                    disabled={isMatching}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <RestaurantReviewHeader 
                restaurantName={restaurantName}
                restaurantImage={restaurantImage}
                restaurantLocation={restaurantLocation}
                googleMapUrl={googleMapUrl}
              />
            </>
          )}
          
          {/* Only show form if restaurant is selected */}
          {isRestaurantSelected && (
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
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
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
          )}
          </div>
        </div>
        <CustomModal
          header="Review Posted"
          content={`Your review for ${restaurantName} is successfully posted.`}
          isOpen={isSubmitted}
          setIsOpen={() => setIsSubmitted(!isSubmitted)}
        />
        {selectedPlace && (
          <RestaurantMatchDialog
            open={showMatchDialog}
            onOpenChange={setShowMatchDialog}
            googlePlaceData={selectedPlace}
            existingRestaurant={existingRestaurant}
            onSelectExisting={handleSelectExisting}
            onCreateNew={handleCreateNew}
          />
        )}
      </div>
      {/* Recently Visited Restaurants Section */}
      <RecentlyVisitedRestaurants />
    </>
  );
};

export default ReviewSubmissionPage;
