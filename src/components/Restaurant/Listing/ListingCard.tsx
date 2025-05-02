"use client";
import Image from "next/image";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import "@/styles/components/_listing-card.scss";
import { cuisines } from "@/data/dummyCuisines";
import { getRestaurantReviewsCount } from "@/utils/reviewUtils";
import { useState } from "react";

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

interface ListingCardProps {
  restaurant: Restaurant;
  onDelete: () => void;
}

const ListingCard = ({ restaurant, onDelete }: ListingCardProps) => {
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
    <div className="relative overflow-hidden rounded-md">
      <div className="restaurant-card__image !h-[222px] relative">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={304}
          height={228}
          className="restaurant-card__img"
        />
        {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
        <div className="flex flex-col gap-2 absolute top-4 right-4 text-[#31343F]">
          <button
            className="rounded-full p-2 bg-white"
            onClick={() => onDelete()}
          >
            <IoMdClose />
          </button>
        </div>
      </div>
      <Link href={`/restaurants/${restaurant.id}`}>
        <div className="restaurant-card__content">
          <div className="restaurant-card__header">
            <h2 className="restaurant-card__name line-clamp-1 w-[220px]">
              {restaurant.name}
            </h2>
          </div>

          <div className="restaurant-card__info">
            <div className="restaurant-card__location">
              {/* <FiMapPin className="restaurant-card__icon" /> */}
              <span className="line-clamp-2">{restaurant.location}</span>
            </div>
          </div>

          <div className="restaurant-card__tags">
            {cuisineNames.map((cuisineName, index) => (
              <span key={index} className="restaurant-card__tag">
                &#8226; {cuisineName}
              </span> // Loop through cuisine names
            ))}
            &nbsp;&#8226; $
          </div>
          <h6 className="text-xs font-medium text-[#31343F]">12/2/25</h6>
        </div>
      </Link>
    </div>
  );
};

export default ListingCard;
