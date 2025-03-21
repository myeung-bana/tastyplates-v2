import Image from "next/image";
import Link from "next/link";
import { FiStar, FiClock, FiMapPin, FiMessageCircle } from "react-icons/fi";
import "@/styles/components/_restaurant-card.scss";
import { cuisines } from "@/data/dummyCuisines";
import { getRestaurantReviewsCount } from "@/utils/reviewUtils";

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
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const reviewsCount = getRestaurantReviewsCount(restaurant.id);
  const getCuisineNames = (cuisineIds: string[]) => {
    return cuisineIds
      .map((id) => {
        const cuisine = cuisines.find((c) => c.id === id);
        return cuisine ? cuisine.name : null; // Return the cuisine name or null if not found
      })
      .filter((name) => name); // Filter out any null values
  };
  const cuisineNames = getCuisineNames(restaurant.cuisineIds);
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="restaurant-card">
      <div className="restaurant-card__image">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={400}
          height={200}
          className="restaurant-card__img"
        />
        <span className="restaurant-card__price">{restaurant.priceRange}</span>
      </div>

      <div className="restaurant-card__content">
        <div className="restaurant-card__header">
          <h2 className="restaurant-card__name">{restaurant.name}</h2>
          <div className="restaurant-card__rating">
            <FiStar className="restaurant-card__icon" />
            <span>{restaurant.rating}</span>
          </div>
        </div>

        <div className="restaurant-card__tags">
          {cuisineNames.map((cuisineName, index) => (
            <span key={index} className="restaurant-card__tag">
              {cuisineName}
            </span> // Loop through cuisine names
          ))}
        </div>

        <div className="restaurant-card__info">
          <div className="restaurant-card__location">
            <FiMapPin className="restaurant-card__icon" />
            <span>{restaurant.location}</span>
          </div>
          <div className="restaurant-card__location">
            <FiMessageCircle className="restaurant-card__icon" />
            <span>{reviewsCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
