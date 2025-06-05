"use client";
import Image from "next/image";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import "@/styles/components/_listing-card.scss";
// import { cuisines } from "@/data/dummyCuisines";
import { getRestaurantReviewsCount } from "@/utils/reviewUtils";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { formatDateT, stripTags } from "@/lib/utils";
import { BsStarFill, BsStarHalf, BsStar } from 'react-icons/bs';

export interface ReviewDraft {
  author: number;
  authorName: string;
  content: {
    rendered: string;
    raw: string;
  }
  date: string;
  id: number;
  link: string;
  post: number;
  recognitions: string[];
  reviewImages: {
    databaseId: number;
    id: string;
    sourceUrl: string;
  }[];
  reviewMainTitle: string;
  reviewStars: string;
  status: string;
  type: string;
}

interface ListingCardProps {
  reviewDraft: ReviewDraft;
  onDelete: () => void;
}

const ListingCard = ({ reviewDraft, onDelete }: ListingCardProps) => {
  // const reviewsCount = getRestaurantReviewsCount(restaurant.id);
  // const getCuisineNames = (cuisineIds: string[]) => {
  //   return cuisineIds
  //     .map((id) => {
  //       const cuisine = cuisines.find((c) => c.id === id);
  //       return cuisine ? cuisine.name : null; // Return the cuisine name or null if not found
  //     })
  //     .filter((name) => name); // Filter out any null values
  // };

  return (
    <div className="relative overflow-hidden rounded-md">
      <div className="restaurant-card__image relative">
        <Image
          src={reviewDraft.reviewImages?.[0]?.sourceUrl || "http://localhost/wordpress/wp-content/uploads/2024/07/default-image.png"}
          alt="Review Draft"
          width={304}
          height={228}
          className="restaurant-card__img"
        />
        {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
        <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
          <button
            className="rounded-full p-2 bg-white"
            onClick={() => onDelete()}
          >
            <IoMdClose />
          </button>
        </div>
      </div>
      <div className="restaurant-card__content">
        <div className="restaurant-card__header">
          {/* <h2 className="restaurant-card__name line-clamp-1 w-[220px]">
              {restaurant.name}
            </h2> */}
          <div className="restaurant-card__rating">
            {Array.from({ length: 5 }, (_, i) => {
              const full = i < Math.floor(Number(reviewDraft.reviewStars));
              const half = i < Math.ceil(Number(reviewDraft.reviewStars)) && i >= Math.floor(Number(reviewDraft.reviewStars));
              return full ? (
                <BsStarFill key={i} className="text-[#31343F]" />
              ) : half ? (
                <BsStarHalf key={i} className="text-[#31343F]" />
              ) : (
                <BsStar key={i} className="text-[#31343F]" />
              );
            })}
          </div>
        </div>
        <p className="text-[10px] sm:text-sm font-semibold w-[304px] line-clamp-1">{stripTags(reviewDraft?.reviewMainTitle || "") || "Dorem ipsum dolor title."}</p>
        <p className="review-card__text w-[304] text-[10px] sm:text-sm font-normal line-clamp-2 mb-3">{stripTags(reviewDraft?.content?.rendered || "")}</p>
        <span className="review-card__timestamp">{formatDateT(reviewDraft.date)}</span>
        {/* <div className="restaurant-card__info">
            <div className="restaurant-card__location">
              <FiMapPin className="restaurant-card__icon" />
              <span className="line-clamp-2 text-[10px] md:text-base">{restaurant.countries}</span>
            </div>
          </div> */}

        {/* <div className="restaurant-card__tags">
            {cuisineNames.map((cuisineName, index) => (
              <span key={index} className="restaurant-card__tag">
                &#8226; {cuisineName}
              </span>
            ))}
            &nbsp;&#8226; $
          </div> */}
      </div>
    </div>
  );
};

export default ListingCard;
