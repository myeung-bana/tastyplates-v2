'use client'
import { ReviewService } from "@/services/Reviews/reviewService";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import ReviewCard from "./ReviewCard";
import "@/styles/pages/_reviews.scss";
import { Masonry, useInfiniteLoader } from "masonic";
import { useState, useEffect } from "react";
import ReviewDetailModal from "./ModalPopup2";

const MasonryCard = ({ index, data, width }: { index: number, data: any, width: number }) => (
  <div>
    <div>Index: {index}</div>
    <img src={data.images[0]} />
    <div>Column width: {width}</div>
  </div>
);
const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [data, setData] = useState<any>({})
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const loadMore = async () => {
    if (loading || !hasNextPage) return;
    setLoading(true);

    const { reviews: newReviews, pageInfo } = await ReviewService.fetchAllReviews(8, endCursor);
    setReviews(prev => [...prev, ...newReviews]);
    setEndCursor(pageInfo.endCursor);
    setHasNextPage(pageInfo.hasNextPage);

    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <section className="!w-full reviews !bg-white z-30 rounded-t-6 sm:rounded-t-10">
      <div className="reviews__container">
        <h2 className="reviews__title">Latest Reviews</h2>
        <p className="reviews__subtitle">
          See what others are saying about their dining experiences
        </p>

        <Masonry items={reviews} render={ReviewCard} columnGutter={width > 767 ? 20 : 12} maxColumnWidth={304} columnCount={getColumns()} maxColumnCount={4} />
        {hasNextPage && (
          <div className="flex justify-center text-center mt-6">
            <button
              onClick={loadMore}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-500 rounded shadow-md hover:text-gray-600 hover:shadow-lg transition"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="164" strokeDashoffset="40" />
                </svg>
              )}
              Load more content
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;
