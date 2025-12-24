import { MdOutlineMessage } from "react-icons/md";
import { FiHeart, FiStar } from "react-icons/fi"
import "@/styles/components/_restaurant-card.scss";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomModal from "@/components/ui/Modal/Modal";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useState, useEffect } from "react";
import SignupModal from "@/components/auth/SignupModal";
import SigninModal from "@/components/auth/SigninModal";
import RestaurantCommentsQuickView from "./RestaurantCommentsQuickView";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";
import { PAGE } from "@/lib/utils";
import { TASTYSTUDIO_ADD_REVIEW_CREATE, RESTAURANTS } from "@/constants/pages";
import toast from "react-hot-toast";
import { favoriteStatusError, removedFromWishlistSuccess, savedToWishlistSuccess } from "@/constants/messages";
import FallbackImage from "../ui/Image/FallbackImage";
import { getCityCountry } from "@/utils/addressUtils";
import { useRestaurantOverallRating } from "@/hooks/useRestaurantOverallRating";

export interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames?: string[];
  listingCategories?: { id: number; name: string; slug: string }[];
  categories?: { id: number; name: string; slug: string; parent_id?: number | null }[];
  streetAddress?: string;
  googleMapUrl?: {
    city?: string;
    country?: string;
    countryShort?: string;
    streetAddress?: string;
    streetNumber?: string;
    streetName?: string;
    state?: string;
    stateShort?: string;
    postCode?: string;
    latitude?: string;
    longitude?: string;
    placeId?: string;
    zoom?: number;
  };
  countries: string;
  priceRange: string;
  averageRating?: number;
  ratingsCount?: number;
  status?: string;
}

export interface RestaurantCardProps {
  restaurant: Restaurant;
  profileTablist?: 'listings' | 'wishlists' | 'checkin';
  initialSavedStatus?: boolean | null;
  ratingsCount?: number;
  onWishlistChange?: (restaurant: Restaurant, isSaved: boolean) => void;
  onClick?: () => void;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to get user UUID from session
const getUserUuid = async (sessionUserId: string | number | undefined): Promise<string | null> => {
  if (!sessionUserId) return null;
  
  const userIdStr = String(sessionUserId);
  
  // Check if it's already a UUID
  if (UUID_REGEX.test(userIdStr)) {
    return userIdStr;
  }
  
  // If not a UUID, assume it's firebase_uuid and fetch the user
  try {
    const response = await restaurantUserService.getUserByFirebaseUuid(userIdStr);
    if (response.success && response.data) {
      return response.data.id;
    }
  } catch (error) {
    console.error("Error fetching user UUID:", error);
  }
  
  return null;
};

const RestaurantCard = ({ restaurant, profileTablist, initialSavedStatus, onWishlistChange, onClick }: RestaurantCardProps) => {
  // Safety check for restaurant object
  if (!restaurant) {
    console.warn('RestaurantCard: restaurant object is undefined or null');
    return null;
  }

  const pathname = usePathname();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useFirebaseSession();
  const [saved, setSaved] = useState<boolean | null>(initialSavedStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [localRatingsCount, setLocalRatingsCount] = useState<number | null>(null);
  // const hasFetched = useRef(false);
  const palateParam = searchParams?.get("ethnic");

  useEffect(() => {
    setSaved(initialSavedStatus ?? false);
  }, [initialSavedStatus]);

  // Check favorite status on mount if user is logged in and status is not provided
  useEffect(() => {
    if (!user || !restaurant.slug || initialSavedStatus !== null) return;
    
    const checkStatus = async () => {
      try {
        const userUuid = await getUserUuid(user.id);
        if (!userUuid) return;
        
        const response = await restaurantUserService.checkFavoriteStatus({
          user_id: userUuid,
          restaurant_slug: restaurant.slug
        });
        
        if (response.success) {
          setSaved(response.data.status === "saved");
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    
    checkStatus();
  }, [user, restaurant.slug, initialSavedStatus]);

  // Fetch overall rating using the same calculation as restaurant detail page
  // Only fetch if restaurant.id is a UUID (starts with valid UUID pattern)
  const isUuid = Boolean(restaurant.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurant.id));
  const { rating: calculatedRating, count: calculatedCount, loading: ratingLoading } = useRestaurantOverallRating(
    isUuid ? restaurant.id : undefined,
    restaurant.databaseId,
    isUuid // Only fetch if we have a valid UUID
  );

  // Use calculated rating if available, otherwise fall back to restaurant data
  const displayRating = ratingLoading 
    ? (typeof restaurant?.averageRating === 'number' ? restaurant.averageRating : (restaurant?.rating || 0))
    : (calculatedRating > 0 ? calculatedRating : (typeof restaurant?.averageRating === 'number' ? restaurant.averageRating : (restaurant?.rating || 0)));
  
  const displayRatingsCount = ratingLoading
    ? (typeof restaurant?.ratingsCount === 'number' ? restaurant.ratingsCount : 0)
    : (calculatedCount > 0 ? calculatedCount : (typeof restaurant?.ratingsCount === 'number' ? restaurant.ratingsCount : 0));

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firebaseUser) {
      setShowSignin(true);
      return;
    }
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(!saved);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: !saved } }));
    
    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        throw new Error("Unable to get user ID");
      }

      const response = await restaurantUserService.toggleFavorite({
        user_id: userUuid,
        restaurant_slug: restaurant.slug
      });

      if (response.success) {
        const isSaved = response.data.status === "saved";
        setSaved(isSaved);
        toast.success(isSaved ? savedToWishlistSuccess : removedFromWishlistSuccess);
        onWishlistChange?.(restaurant, isSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: isSaved } }));
      } else {
        throw new Error(response.error || favoriteStatusError);
      }
    } catch (error: any) {
      // Check if it's an authentication error or JSON parsing error
      const errorMessage = error?.message || '';
      const isAuthError = 
        errorMessage.includes('auth') || 
        errorMessage.includes('permission') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('token') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('Invalid JSON') ||
        errorMessage.includes('<!DOCTYPE') ||
        error?.code === 'auth/requires-recent-login' ||
        error?.code === 'rest_forbidden' ||
        error?.code === 'rest_unauthorized' ||
        error?.status === 401 ||
        error?.status === 403 ||
        !firebaseUser;

      if (isAuthError) {
        // Show signin modal instead of error toast and don't set error state
        setShowSignin(true);
        setSaved(prevSaved);
        setError(null); // Clear error state so it doesn't display
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      } else {
        toast.error(favoriteStatusError);
        setSaved(prevSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
        setError(favoriteStatusError);
      }
    } finally {
      setLoading(false);
    }
  }

  // Removed unused function
  const cuisineNames = restaurant.palatesNames ?? [];


  const handleDeleteWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileTablist === 'wishlists' || profileTablist === 'checkin') {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !firebaseUser) {
      setShowSignin(true);
      setIsDeleteModalOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(false);
    setIsDeleteModalOpen(false);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: false } }));
    
    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        throw new Error("Unable to get user ID");
      }

      const response = await restaurantUserService.toggleFavorite({
        user_id: userUuid,
        restaurant_slug: restaurant.slug
      });

      if (response.success) {
        const isSaved = response.data.status === "saved";
        setSaved(isSaved);
        toast.success(isSaved ? savedToWishlistSuccess : removedFromWishlistSuccess);
        onWishlistChange?.(restaurant, isSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: isSaved } }));
      } else {
        throw new Error(response.error || favoriteStatusError);
      }
    } catch (error: any) {
      // Check if it's an authentication error
      const errorMessage = error?.message || '';
      const isAuthError = 
        errorMessage.includes('auth') || 
        errorMessage.includes('permission') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('token') ||
        errorMessage.includes('forbidden') ||
        error?.status === 401 ||
        error?.status === 403 ||
        !firebaseUser;

      if (isAuthError) {
        setShowSignin(true);
        setSaved(prevSaved);
        setError(null);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      } else {
        toast.error(favoriteStatusError);
        setSaved(prevSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
        setError(favoriteStatusError);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteModalContent = (
    <div className="text-center">
      <p className="text-sm text-[#494D5D]">
        {restaurant.name} will be removed from this wishlist.
      </p>
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setIsDeleteModalOpen(false)}
          className="flex-1 py-3 px-6 bg-[#FCFCFC] text-[#494D5D] rounded-xl border border-[#494D5D] text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          className="flex-1 py-3 px-6 bg-[#ff7c0a] text-[#FCFCFC] rounded-xl text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firebaseUser) {
      setShowSignin(true);
      return;
    }
    handleToggle(e);
  };

  const handleCommentButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReviewModalOpen(true);
  };


  const address = getCityCountry(restaurant.googleMapUrl, 'Location not available');

  return (
    <>
      <div className="restaurant-card font-neusans">
        <div className="restaurant-card__image relative">
          <a
            href={PAGE(RESTAURANTS, [restaurant.slug], palateParam ? { ethnic: palateParam } : {})}
            onClick={async (e) => {
              e.preventDefault();
              const clickedElement = e.target as HTMLElement;
              // Detect if the image was clicked and you're on the /review-listing page
              if ((pathname === "/review-listing" || pathname === "/tastystudio/review-listing") && clickedElement.dataset.role === "image") {
                const slug = restaurant.slug || "";
                if (slug) {
                  const queryParams = palateParam ? `?slug=${encodeURIComponent(slug)}&ethnic=${encodeURIComponent(palateParam)}` : `?slug=${encodeURIComponent(slug)}`;
                  router.push(`${TASTYSTUDIO_ADD_REVIEW_CREATE}${queryParams}`);
                }
                return;
              }
              if (onClick) await onClick(); // Wait for mutation to complete
              router.push(PAGE(RESTAURANTS, [restaurant.slug], palateParam ? { ethnic: palateParam } : {}));
            }}>
            {restaurant.status === 'draft' && ( // Added condition for "Pending for Approval"
              <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 shadow">
                Pending for Approval
              </div>
            )}
            <FallbackImage
              data-role="image"
              src={restaurant.image}
              alt={restaurant.name}
              width={304}
              height={228}
              className="restaurant-card__img cursor-pointer"
              style={{ cursor: "pointer" }}
            />
          </a>
          {profileTablist !== 'listings' && (
            <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
              <button
                className="rounded-full p-2 bg-white"
                onClick={(e) => {
                  if (profileTablist === 'wishlists') {
                    handleDeleteWishlist(e);
                  } else if (profileTablist === 'checkin') {
                    if (saved) {
                      handleDeleteWishlist(e);
                    } else {
                      handleHeartClick(e);
                    }
                  } else {
                    handleHeartClick(e);
                  }
                }}
                disabled={loading || saved === null}
                aria-label={saved ? "Unfollow restaurant" : "Follow restaurant"}
              >
                {saved === null && loading ? (
                  <span className="w-4 h-4 rounded-full bg-gray-200 animate-pulse block" />
                ) : saved ? (
                  <FiHeart className="size-3 md:size-4 text-[#ff7c0a]" fill="currentColor" />
                ) : (
                  <FiHeart className="size-3 md:size-4" />
                )}
              </button>
              <button className="rounded-full p-2 bg-white" onClick={handleCommentButtonClick}>
                <MdOutlineMessage className="size-3 md:size-4" />
              </button>
            </div>
          )}
        </div>
        <a
          href={PAGE(RESTAURANTS, [restaurant.slug], palateParam ? { ethnic: decodeURIComponent(palateParam) } : {})}
          onClick={async (e) => {
            e.preventDefault();
            if (pathname === "/review-listing" || pathname === "/tastystudio/review-listing") {
              const slug = restaurant.slug || "";
              if (slug) {
                const queryParams = palateParam ? `?slug=${encodeURIComponent(slug)}&ethnic=${encodeURIComponent(palateParam)}` : `?slug=${encodeURIComponent(slug)}`;
                router.push(`${TASTYSTUDIO_ADD_REVIEW_CREATE}${queryParams}`);
              }
              return;
            }
            if (onClick) await onClick(); // Wait for mutation to complete
            router.push(PAGE(RESTAURANTS, [restaurant.slug], palateParam ? { ethnic: decodeURIComponent(palateParam) } : {}));
          }}
        >
          <div className="restaurant-card__content">
            <div className="restaurant-card__header">
              <h2 className="restaurant-card__name truncate w-[220px] text-[1rem] whitespace-nowrap overflow-hidden text-ellipsis">{restaurant.name}</h2>
              <div className="restaurant-card__rating text-[1rem]">
                <FiStar className="restaurant-card__icon -mt-1" />
                {displayRating > 0 ? displayRating : 0}
                <span className="restaurant-card__rating-count">({displayRatingsCount})</span>
              </div>
            </div>

            <div className="restaurant-card__info w-full">
              <div className="restaurant-card__location">
                <span className="block w-full text-[11px] md:text-[0.9rem] mt-1 whitespace-normal break-words line-clamp-2 overflow-hidden leading-[1.4]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{address}</span>
              </div>
            </div>

            {/* Cuisine Categories (shows first 3, then "+X" if more) */}
            {restaurant.listingCategories && restaurant.listingCategories.length > 0 && (
              <div className="restaurant-card__tags mt-1 text-[11px] md:text-[0.9rem] leading-[1.4]">
                <span className="restaurant-card__tag">
                  {(() => {
                    const cuisines = restaurant.listingCategories || [];
                    if (cuisines.length <= 3) {
                      return cuisines.map(c => c.name).join(' / ');
                    } else {
                      const firstThree = cuisines.slice(0, 3).map(c => c.name).join(' / ');
                      const remaining = cuisines.length - 3;
                      return `${firstThree} +${remaining}`;
                    }
                  })()}
                </span>
              </div>
            )}
            
            {/* Establishment Categories (only parent categories) */}
            {restaurant.categories && restaurant.categories.length > 0 && (() => {
              const parentCategories = restaurant.categories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
              if (parentCategories.length > 0) {
                return (
                  <div className="restaurant-card__tags mt-1 text-[11px] md:text-[0.9rem] leading-[1.4]">
                    <span className="restaurant-card__tag truncate">
                      {parentCategories.map(cat => cat.name).join(' / ')}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

          </div>
        </a>
      </div>

      <CustomModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        header="Delete this Wishlist?"
        content={deleteModalContent}
        hasFooter
        headerClass="!text-[#31343F]"
        contentClass="!pb-[2px]"
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onOpenSignin={() => {
          setShowSignup(false);
          setShowSignin(true);
        }}
      />
      <SigninModal
        isOpen={showSignin}
        onClose={() => setShowSignin(false)}
        onOpenSignup={() => {
          setShowSignin(false);
          setShowSignup(true);
        }}
      />
      <RestaurantCommentsQuickView
        restaurantId={restaurant.databaseId}
        restaurantName={restaurant.name}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </>
  );
};

export default RestaurantCard;
