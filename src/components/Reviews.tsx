'use client'
import { getAllReviews } from "@/utils/reviewUtils";
import ReviewCard from "./ReviewCard";
import "@/styles/pages/_reviews.scss";
import { Masonry, useInfiniteLoader } from "masonic";
import { useEffect, useState } from "react";
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
    const [width, setWidth] = useState(
      typeof window !== "undefined" ? window.innerWidth : 0
    );
  
    useEffect(() => {
      window.addEventListener("load", () => {
        if (typeof window !== "undefined") {
          handleResize();
        }
      });
      window.addEventListener("resize", () => {
        handleResize();
      });
  
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("load", handleResize);
      };
    }, [data]);
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

  const getColumns = () => {
    if (width >= 1024) {
      return 4
    }

    if (width >= 768) {
      return 3
    }

    return 2
  }
  return (
    <section className="!w-full reviews !bg-white z-30 rounded-t-6 sm:rounded-t-10">
      <div className="reviews__container">
        <h2 className="reviews__title">Latest Reviews</h2>
        <p className="reviews__subtitle">
          See what others are saying about their dining experiences
        </p>

        <Masonry items={reviews} render={ReviewCard} columnGutter={width > 767 ? 20 : 12} maxColumnWidth={304} columnCount={getColumns()} maxColumnCount={4} />
      </div>
    </section>
  );
};

export default Reviews;
