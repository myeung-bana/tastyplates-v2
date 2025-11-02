import { MdOutlineMessage } from "react-icons/md";
import { FaRegHeart, FaStar, FaHeart } from "react-icons/fa"
import "@/styles/components/_restaurant-card.scss";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomModal from "@/components/ui/Modal/Modal";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import RestaurantReviewsModal from "./RestaurantReviewsModal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { PAGE } from "@/lib/utils";
import { ADD_REVIEW, RESTAURANTS } from "@/constants/pages";
import toast from "react-hot-toast";
import { favoriteStatusError, removedFromWishlistSuccess, savedToWishlistSuccess } from "@/constants/messages";
import FallbackImage from "./ui/Image/FallbackImage";
import { responseStatusCode as code } from "@/constants/response";
import { getCityCountry } from "@/utils/addressUtils";

export interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames?: string[];
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

const restaurantService = new RestaurantService();

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
  const { data: session } = useSession();
  const [saved, setSaved] = useState<boolean | null>(initialSavedStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [localRatingsCount, setLocalRatingsCount] = useState<number | null>(null);
  // const hasFetched = useRef(false);
  const palateParam = searchParams?.get("ethnic");

  useEffect(() => {
    setSaved(initialSavedStatus ?? false);
  }, [initialSavedStatus]);

  const displayRating = typeof restaurant?.averageRating === 'number' ? restaurant.averageRating : (restaurant?.rating || 0);
  const displayRatingsCount = typeof restaurant?.ratingsCount === 'number' ? restaurant.ratingsCount : 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      setShowSignin(true);
      return;
    }
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(!saved);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: !saved } }));
    const action = prevSaved ? "unsave" : "save";
    try {
      let res: Record<string, unknown>;
      if (action === "save") {
        res = await restaurantService.saveFavoriteListing(restaurant.slug, session?.accessToken);
      } else {
        res = await restaurantService.unsaveFavoriteListing(restaurant.slug, session?.accessToken);
      }
      
      if (res.status === "saved" || res.status === "unsaved") {
        toast.success(prevSaved ? removedFromWishlistSuccess : savedToWishlistSuccess);
        setSaved((res.status as unknown as string) === "saved");
        onWishlistChange?.(restaurant, (res.status as unknown as string) === "saved");
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: (res.status as unknown as string) === "saved" } }));
      } else {
        toast.error(favoriteStatusError);
        setSaved(prevSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
        setError(favoriteStatusError);
      }
    } catch {
      toast.error(favoriteStatusError);
      setSaved(prevSaved);
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      setError(favoriteStatusError);
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
    if (!session) {
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
      const res: Record<string, unknown> = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurant.slug, action: "unsave" },
        session?.accessToken // can be undefined
      );

      if (res.status == code.success) {
        toast.success(saved ? removedFromWishlistSuccess : savedToWishlistSuccess);
        setSaved((res.status as unknown as string) === "saved");
        onWishlistChange?.(restaurant, (res.status as unknown as string) === "saved");
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: (res.status as unknown as string) === "saved" } }));
      } else {
        toast.error(favoriteStatusError);
        setSaved(prevSaved); // Revert on error
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
        setError(favoriteStatusError);
      }
    } catch {
      toast.error(favoriteStatusError);
      setSaved(prevSaved); // Revert on error
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      setError(favoriteStatusError);
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
          className="flex-1 py-3 px-6 bg-[#E36B00] text-[#FCFCFC] rounded-xl text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
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
              if (pathname === "/review-listing" && clickedElement.dataset.role === "image") {
                router.push(PAGE(ADD_REVIEW, [restaurant.slug, String(restaurant.databaseId)], palateParam ? { ethnic: palateParam } : {}));
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
                  <FaHeart className="size-3 md:size-4 text-[#E36B00]" />
                ) : (
                  <FaRegHeart className="size-3 md:size-4" />
                )}
              </button>
              {error && (
                <span className="text-xs text-red-500 ml-2">{error}</span>
              )}
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
            if (pathname === "/review-listing") {
              router.push(PAGE(ADD_REVIEW, [restaurant.slug, String(restaurant.databaseId)], palateParam ? { ethnic: palateParam } : {}));
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
                <FaStar className="restaurant-card__icon -mt-1" />
                {displayRating > 0 ? displayRating : 0}
                <span className="restaurant-card__rating-count">({displayRatingsCount})</span>
              </div>
            </div>

            <div className="restaurant-card__info w-full">
              <div className="restaurant-card__location">
                <span className="block w-full text-[11px] md:text-[0.9rem] mt-1 whitespace-normal break-words line-clamp-2 overflow-hidden leading-[1.4]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{address}</span>
              </div>
            </div>

            <div className="restaurant-card__tags mt-1 text-[11px] md:text-[0.9rem] leading-[1.4]">
              {(() => {
                const tags = [...cuisineNames];
                if (restaurant.priceRange) tags.push(restaurant.priceRange);
                return (
                  <span className="restaurant-card__tag">
                    {tags.filter(Boolean).join(' · ')}
                  </span>
                );
              })()}
            </div>

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
      {isReviewModalOpen && (
        <RestaurantReviewsModal
          isOpen={isReviewModalOpen}
          setIsOpen={setIsReviewModalOpen}
          restaurant={{
            ...restaurant,
            countries: restaurant.countries ?? '',
          }}
        />
      )}
    </>
  );
};

export default RestaurantCard;
