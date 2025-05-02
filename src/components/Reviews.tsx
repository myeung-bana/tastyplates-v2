'use client'
import { getAllReviews } from "@/utils/reviewUtils";
import ReviewCard from "./ReviewCard";
import "@/styles/pages/_reviews.scss";
import { Masonry, useInfiniteLoader } from "masonic";
import { useState } from "react";
import ReviewDetailModal from "./ModalPopup2";

const MasonryCard = ({ index, data, width } : {index: number, data: any, width: number} ) => (
  <div>
    <div>Index: {index}</div>
    <img src={data.images[0]} />
    <div>Column width: {width}</div>
  </div>
);
const Reviews = () => {
  const reviews = getAllReviews();
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [data, setData] = useState<any>({})
  return (
    <section className="!w-full reviews !bg-white z-30 !rounded-t-[40px]">
      <div className="reviews__container">
        <h2 className="reviews__title">Latest Reviews</h2>
        <p className="reviews__subtitle">
          See what others are saying about their dining experiences
        </p>

        <Masonry items={reviews} render={ReviewCard} columnGutter={20} columnWidth={304} maxColumnCount={4} />
      </div>
    </section>
  );
};

export default Reviews;
