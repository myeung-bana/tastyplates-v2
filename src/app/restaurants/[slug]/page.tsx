"use client";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { FiStar, FiMapPin, FiPhone, FiDollarSign } from "react-icons/fi";
import { getRestaurantReviews } from "@/utils/reviewUtils";
import RestaurantReviews from "@/components/RestaurantReviews";
import { restaurants } from "@/data/dummyRestaurants";
import "@/styles/pages/_restaurant-details.scss";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { Review } from "@/data/dummyReviews";
import { cuisines } from "@/data/dummyCuisines";
import ReviewModal from "@/components/ReviewModal";
import { useState } from "react";
import { DollarSign } from "lucide-react";

type tParams = { slug: string };

const calculateAverageRating = (reviews: Review[]) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

const filterReviewsByPalate = (reviews: Review[], targetPalates: string[]) => {
  return reviews.filter((review) => {
    // Find the user who wrote the review
    const user = users.find((user) => user.id === review.authorId);
    if (!user) return false;

    // Check if any of the user's palates match the target palates
    return user.palateIds.some((palateId) => {
      const palate = palates.find((p) => p.id === palateId);
      return palate && targetPalates.includes(palate.name);
    });
  });
};

export default function RestaurantDetail() {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const params = useParams();
  const slug = params?.slug;

  const restaurant = restaurants.find((r) => r.id.toString() === slug);

  if (!restaurant) {
    notFound();
  }

  const restaurantId = restaurant?.id;

  const restaurantReviews = {
    reviews: getRestaurantReviews(restaurantId).map((review) => ({
      ...review,
      id: review.id, // keep existing id mapping
      content: review.comment,
      likes: 0,
      comments: [],
      user: review.authorId,
      userImage: users.find((u) => u.id === review.authorId)?.image || "",
      timestamp: review.date,
    })),
  };

  const allReviews = restaurantReviews.reviews;
  const japanesePalateReviews = filterReviewsByPalate(allReviews, ["Japanese"]);
  const italianMexicanPalateReviews = filterReviewsByPalate(allReviews, [
    "Italian",
    "Mexican",
  ]);

  const japaneseAvgRating = calculateAverageRating(japanesePalateReviews);
  const overallAvgRating = calculateAverageRating(allReviews);
  const italianMexicanAvgRating = calculateAverageRating(
    italianMexicanPalateReviews
  );

  const handleReviewSubmit = (review: {
    rating: number;
    comment: string;
    date: string;
  }) => {
    // Here you would typically send the review to your backend
    console.log("New review:", review);
  };

  return (
    <div className="restaurant-detail mt-10">
      <div className="restaurant-detail__container">
        <div className="restaurant-detail__header">
          <div className="restaurant-detail__info">
            <div className="flex justify-between">
              <div>
                <h1 className="restaurant-detail__name">{restaurant.name}</h1>
                <div className="restaurant-detail__meta">
                  <div className="restaurant-detail__cuisine">
                    {restaurant.cuisineIds.map((cuisineId) => {
                      const cuisine = cuisines.find((c) => c.id === cuisineId);
                      return cuisine ? (
                        <span key={cuisine.id} className="cuisine-tag">
                          &#8226; {cuisine.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className="restaurant-detail__price">
                    <span>{restaurant.priceRange}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-row flex-nowrap gap-4">
                <button
                  className="restaurant-detail__review-button"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Write a Review
                </button>
              </div>
            </div>
            <div className="flex flex-row gap-6">
              <div className="rounded-l-[24px] relative restaurant-detail__hero w-2/3">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="restaurant-detail__image rounded-[24px] w-full h-[307px]"
                  priority
                />
              </div>
              <div className="flex items-center justify-center rounded-[24px] text-center w-1/3">
                <div className="restaurant-detail__details">
                  <div className="restaurant-detail__detail-item">
                    <FiMapPin />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="restaurant-detail__detail-item">
                    <FiPhone />
                    <span>{restaurant.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 mt-10">
              <div className="flex flex-col justify-center items-center border border-[#CACACA] rounded-l-3xl pt-4 pb-2">
                <h1 className="font-bold">Rating</h1>
                <div className="rating-summary w-full">
                  <div className="rating-column">
                    <h3>Chinese Palate</h3>
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-[#E36B00] text-2xl font-medium">{japaneseAvgRating}</span>
                    </div>
                    <span className="review-count">
                      ({japanesePalateReviews.length} reviews)
                    </span>
                  </div>
                  <div className="h-[85%] border-l border-[#CACACA]"></div>
                  <div className="rating-column">
                    <h3>Overall Rating</h3>
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-[#E36B00] text-2xl font-medium">{overallAvgRating}</span>
                    </div>
                    <span className="review-count">
                      ({allReviews.length} reviews)
                    </span>
                  </div>
                  <div className="h-[85%] border-l border-[#CACACA]"></div>
                  <div className="rating-column">
                    <h3>Restaurant Palate</h3>
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-[#E36B00] text-2xl font-medium">{italianMexicanAvgRating}</span>
                    </div>
                    <span className="review-count">
                      ({italianMexicanPalateReviews.length} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center border border-[#CACACA] rounded-r-3xl pt-4 pb-2">
                <h1 className="font-bold">Community Recognition</h1>
                <div className="rating-summary w-full">
                  <div className="rating-column">
                    <Image src='/flag.svg' height={40} width={40} alt="Flag icon" />
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-xl font-medium">{japaneseAvgRating}</span>
                    </div>
                    <span className="text-sm">
                      Must Revisit
                    </span>
                  </div>

                  <div className="rating-column">
                    <Image src='/phone.svg' height={40} width={40} alt="Flag icon" />
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-xl font-medium">{overallAvgRating}</span>
                    </div>
                    <span className="text-sm">
                      Insta-Worthy
                    </span>
                  </div>

                  <div className="rating-column">
                    <Image src='/cash.svg' height={40} width={40} alt="Flag icon" />
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-xl font-medium">{italianMexicanAvgRating}</span>
                    </div>
                    <span className="text-sm">
                      Value for Money
                    </span>
                  </div>
                  <div className="rating-column">
                    <Image src='/helmet.svg' height={40} width={40} alt="Flag icon" />
                    <div className="rating-value">
                      {/* <FiStar className="fill-yellow-500" /> */}
                      <span className="text-xl font-medium">{italianMexicanAvgRating}</span>
                    </div>
                    <span className="text-sm">
                      Best Service
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="restaurant-detail__content">
          {/* <div className="restaurant-detail__description">
            <h2>About</h2>
            <p>{restaurant.description}</p>
          </div>

          <div className="restaurant-detail__menu">
            <h2>Menu</h2>
            {restaurant.menu.map((category) => (
              <div key={category.category} className="menu-category">
                <h3 className="menu-category__title">{category.category}</h3>
                <div className="menu-category__items">
                  {category.items.map((item) => (
                    <div key={item.name} className="menu-item">
                      <div className="menu-item__image">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={120}
                          height={120}
                          className="menu-item__img"
                        />
                      </div>
                      <div className="menu-item__content">
                        <h4 className="menu-item__name">{item.name}</h4>
                        <p className="menu-item__description">
                          {item.description}
                        </p>
                        <span className="menu-item__price">${item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div> */}
          <div className="restaurant-detail__reviews">
            <RestaurantReviews reviewlist={[restaurantReviews]} />
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        restaurantId={restaurant.id}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}
