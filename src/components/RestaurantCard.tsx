import Image from "next/image";
import Link from "next/link";
import { FiStar, FiClock, FiMapPin, FiMessageCircle } from "react-icons/fi";
import { MdOutlineMessage } from "react-icons/md";
import { FaRegHeart, FaStar, FaHeart } from "react-icons/fa"
import "@/styles/components/_restaurant-card.scss";
import { cuisines } from "@/data/dummyCuisines";
import { getRestaurantReviewsCount } from "@/utils/reviewUtils";
import Photo from "../../public/images/Photos-Review-12.png";
import { useRouter } from "next/navigation";
import CustomModal from "@/components/ui/Modal/Modal";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";

export interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames?: string[];
  countries: string;
  priceRange: string;
}

export interface RestaurantCardProps {
  restaurant: Restaurant;
  profileTablist?: 'listings' | 'wishlists' | 'checkin';
  initialSavedStatus?: boolean | null; // Add this line
}

const RestaurantCard = ({ restaurant, profileTablist, initialSavedStatus }: RestaurantCardProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const reviewsCount = getRestaurantReviewsCount(restaurant.id);
  const router = useRouter();
  const { data: session } = useSession();
  const [saved, setSaved] = useState<boolean | null>(initialSavedStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (initialSavedStatus !== undefined && initialSavedStatus !== null) {
      setSaved(initialSavedStatus);
      hasFetched.current = true;
    }
  }, [initialSavedStatus]);

  useEffect(() => {
    if (initialSavedStatus !== undefined && initialSavedStatus !== null) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    let isMounted = true;
    if (!session) {
      setSaved(false);
      return;
    }
    setSaved(null);
    fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      },
      body: JSON.stringify({ restaurant_slug: restaurant.slug, action: "check" }),
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) setSaved(data.status === "saved");
      })
      .catch(() => {
        if (isMounted) setSaved(false);
      });
    return () => { isMounted = false; };
  }, [restaurant.slug, session, initialSavedStatus]);

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
      // Broadcast the confirmed status
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurant.slug, status: data.status === "saved" } }));
    } catch (err) {
      setSaved(prevSaved); // Revert on error
      // Broadcast the reverted status
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
      .filter((name) => name); // Filter out any null values
  };
  // const cuisineNames = getCuisineNames(restaurant.cuisineIds);
  const cuisineNames = restaurant.palatesNames ?? [];

  const addReview = () => {
    router.push(`/add-review/${restaurant.slug}/${restaurant.databaseId}`);
  }

  const handleDeleteWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileTablist === 'wishlists') {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    // Add your delete logic here
    setIsDeleteModalOpen(false);
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

  return (
    <>
      <div className="restaurant-card">
        <div className="restaurant-card__image relative">
          <Link href={`/restaurants/${restaurant.slug}`}>
            <Image
              src={restaurant.image}
              alt={restaurant.name}
              width={304}
              height={228}
              className="restaurant-card__img cursor-pointer"
            />
          </Link>
          {profileTablist !== 'listings' && (
            <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
              <button
                className="rounded-full p-2 bg-white"
                onClick={profileTablist === 'wishlists' ? handleDeleteWishlist : handleHeartClick}
                disabled={loading || saved === null}
                aria-label={saved ? "Unfollow restaurant" : "Follow restaurant"}
              >
                {saved === null ? (
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
              <button className="rounded-full p-2 bg-white">
                <MdOutlineMessage className="size-3 md:size-4" />
              </button>
            </div>
          )}
        </div>
        <Link href={`/restaurants/${restaurant.slug}`}>
          <div className="restaurant-card__content">
            <div className="restaurant-card__header">
              <h2 className="restaurant-card__name line-clamp-1 w-[220px]">{restaurant.name}</h2>
              <div className="restaurant-card__rating">
                <FaStar className="restaurant-card__icon -mt-1" />
                <span>{restaurant.rating}</span>
                {/* <span>({restaurant.reviews})</span> */}
              </div>
            </div>

            <div className="restaurant-card__info">
              <div className="restaurant-card__location">
                {/* <FiMapPin className="restaurant-card__icon" /> */}
                <span className="line-clamp-2 text-[10px] md:text-base">{restaurant.countries}</span>
              </div>
              {/* <div className="restaurant-card__location">
                <FiMessageCircle className="restaurant-card__icon" />
                <span>{reviewsCount}</span>
              </div> */}
            </div>

            <div className="restaurant-card__tags">
              {cuisineNames.map((cuisineName, index) => (
                <span key={index} className="restaurant-card__tag">
                  &#8226; {cuisineName}
                </span>
              ))}
            </div>

          </div>
        </Link>
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
      {/* Signup/Signin Modals for not-logged-in users */}
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
    </>
  );
};

export default RestaurantCard;
