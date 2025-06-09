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
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const reviewsCount = getRestaurantReviewsCount(restaurant.id);
  const router = useRouter()
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!session || !restaurant.slug || initialized) return;
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
      .finally(() => {
        if (isMounted) setInitialized(true);
      });
    return () => { isMounted = false; };
  }, [restaurant.slug, session]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    setLoading(true);
    setSaved(prev => !prev);
    const action = saved ? "unsave" : "save";
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
    setLoading(false);
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
  const cuisineNames = restaurant.cuisineNames ?? [];

  const addReview = () => {
    router.push(`/add-review/${restaurant.slug}/${restaurant.databaseId}`);
  }

  return (
    <div className="restaurant-card">
      <div className="restaurant-card__image relative">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={304}
          height={228}
          className="restaurant-card__img cursor-pointer"
          onClick={addReview}
        />
        {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
        <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
          <button className="rounded-full p-2 bg-white" onClick={handleToggle} disabled={loading || !session} aria-pressed={saved}>
            {saved ? <FaHeart className="size-3 md:size-4 text-red-500" /> : <FaRegHeart className="size-3 md:size-4" />}
          </button>
          <button className="rounded-full p-2 bg-white">
            <MdOutlineMessage className="size-3 md:size-4" />
          </button>
        </div>
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
  );
};

export default RestaurantCard;
