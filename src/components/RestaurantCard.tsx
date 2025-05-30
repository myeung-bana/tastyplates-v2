import Image from "next/image";
import Link from "next/link";
import { FiStar, FiClock, FiMapPin, FiMessageCircle } from "react-icons/fi";
import { MdOutlineMessage } from "react-icons/md";
import { FaRegHeart, FaStar} from "react-icons/fa"
import "@/styles/components/_restaurant-card.scss";
import { cuisines } from "@/data/dummyCuisines";
import { getRestaurantReviewsCount } from "@/utils/reviewUtils";
import Photo from "../../public/images/Photos-Review-12.png";
import { useRouter } from "next/navigation";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames: string[];
  countries: string;
  priceRange: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const reviewsCount = getRestaurantReviewsCount(restaurant.id);
  // console.log(restaurant);
  const router = useRouter()
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
    router.push('/add-review')
  }


  return (
    <div className="restaurant-card">
      <div className="restaurant-card__image relative">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={304}
          height={228}
          className="restaurant-card__img"
        />
        {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
        <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
          <button className="rounded-full p-2 bg-white" onClick={(e) => e.stopPropagation()}>
            <FaRegHeart className="size-3 md:size-4" />
          </button>
          <button onClick={addReview} className="rounded-full p-2 bg-white">
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
