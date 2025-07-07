import Image from "next/image";
import Link from "next/link";
import { MdOutlineMessage } from "react-icons/md";
import { FaRegHeart, FaStar, FaHeart } from "react-icons/fa"
import "@/styles/components/_restaurant-card.scss";
import { cuisines } from "@/data/dummyCuisines";
import Photo from "../../public/images/Photos-Review-12.png";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomModal from "@/components/ui/Modal/Modal";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import RestaurantReviewsModal from "./RestaurantReviewsModal";
import { RestaurantService } from "@/services/restaurant/restaurantService";

export interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames?: string[];
  streetAddress?: string;
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
  onClick?: () => void;
}

const RestaurantCard = ({ restaurant, profileTablist, initialSavedStatus, ratingsCount, onClick }: RestaurantCardProps) => {
  const pathname = usePathname();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState<boolean | null>(initialSavedStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRatingsCount, setLocalRatingsCount] = useState<number | null>(null);
  const hasFetched = useRef(false);
  const palateParam = searchParams?.get("ethnic");

  useEffect(() => {
    setSaved(initialSavedStatus ?? false);
  }, [initialSavedStatus]);

  const displayRating = typeof restaurant.averageRating === 'number' ? restaurant.averageRating : restaurant.rating;
  const displayRatingsCount = typeof restaurant.ratingsCount === 'number' ? restaurant.ratingsCount : 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      setShowSignup(true);
      return;
    }
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(!saved);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: !saved } }));
    const action = prevSaved ? "unsave" : "save";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
        },
        body: JSON.stringify({ restaurant_slug: restaurant.slug, action }),
        credentials: "include",
      });
      const data = await res.json();
      setSaved(data.status === "saved");
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: data.status === "saved" } }));
    } catch (err) {
      setSaved(prevSaved);
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      setError("Could not update favorite status");
    } finally {
      setLoading(false);
    }
  }

  const getCuisineNames = (cuisineIds: string[]) => {
    return cuisineIds
      .map((id) => {
        const cuisine = cuisines.find((c) => c.id === id);
        return cuisine ? cuisine.name : null;
      })
      .filter((name) => name);
  };
  const cuisineNames = restaurant.palatesNames ?? [];


  const handleDeleteWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileTablist === 'wishlists') {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!session) {
      setShowSignup(true);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
        },
        body: JSON.stringify({ restaurant_slug: restaurant.slug, action: "unsave" }),
        credentials: "include",
      });
      const data = await res.json();
      setSaved(data.status === "saved");
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: data.status === "saved" } }));
    } catch (err) {
      setSaved(prevSaved); // Revert on error
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: prevSaved } }));
      setError("Could not update favorite status");
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
      setShowSignup(true);
      return;
    }
    handleToggle(e);
  };

  const handleCommentButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReviewModalOpen(true);
  };

  const address = restaurant.streetAddress?.trim() || 'Default Location';

  return (
    <>
      <div className="restaurant-card">
        <div className="restaurant-card__image relative">
          <a
            href={`/restaurants/${restaurant.slug}${palateParam ? `?ethnic=${encodeURIComponent(palateParam)}` : ""}`}
            onClick={async (e) => {
              e.preventDefault();
              const clickedElement = e.target as HTMLElement;
              // Detect if the image was clicked and you're on the /listing page
              if (pathname === "/listing" && clickedElement.dataset.role === "image") {
                router.push(`/add-review/${restaurant.slug}/${restaurant.databaseId}`); 
                return;
              }
              if (onClick) await onClick(); // Wait for mutation to complete
              router.push(`/restaurants/${restaurant.slug}${palateParam ? `?ethnic=${encodeURIComponent(palateParam)}` : ""}`);
            }}>
            {restaurant.status === 'draft' && ( // Added condition for "Pending for Approval"
              <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 shadow">
                Pending for Approval
              </div>
            )}
            <Image
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
                onClick={profileTablist === 'wishlists' ? handleDeleteWishlist : handleHeartClick}
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
        href={`/restaurants/${restaurant.slug}${palateParam ? `?ethnic=${encodeURIComponent(palateParam)}` : ""}`}
        onClick={async (e) => {
          e.preventDefault();
          if (onClick) await onClick(); // Wait for mutation to complete
          router.push(`/restaurants/${restaurant.slug}${palateParam ? `?ethnic=${encodeURIComponent(palateParam)}` : ""}`);
        }}
        >
          <div className="restaurant-card__content">
            <div className="restaurant-card__header">
              <h2 className="restaurant-card__name truncate w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">{restaurant.name}</h2>
              <div className="restaurant-card__rating">
                {displayRating > 0 ? (
                  <>
                    <FaStar className="restaurant-card__icon -mt-1" />
                    {displayRating}
                    <span className="restaurant-card__rating-count">({displayRatingsCount})</span>
                  </>
                ) : null}
              </div>
            </div>

              <div className="restaurant-card__info w-full">
                <div className="restaurant-card__location">
                  <span className="block w-full text-[10px] md:text-[0.9rem] mt-1 whitespace-normal break-words line-clamp-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{address}</span>
                </div>
              </div>

              <div className="restaurant-card__tags mt-1">
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
