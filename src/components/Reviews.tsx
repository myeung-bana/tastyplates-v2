'use client'
import { getAllReviews } from "@/utils/reviewUtils";
import ReviewCard from "./ReviewCard";
import "@/styles/pages/_reviews.scss";
// import Masonry from "react-responsive-masonry"
import { Masonry, useInfiniteLoader } from "masonic";
import { useState } from "react";
import ReviewDetailModal from "./ModalPopup2";

const InfiniteMasonry = (props: any) => {
  const [items, setItems] = useState([
    []
  ]);
  const fetchMoreItems = async (startIndex: any, stopIndex: any, currentItems: any) => {
    const nextItems = await fetch(
      `/api/get-more?after=${startIndex}&limit=${startIndex + stopIndex}`
    ) as any;

    setItems((current: any) => [...current, ...nextItems]);
  };
  const maybeLoadMore = useInfiniteLoader(fetchMoreItems, {
    isItemLoaded: (index, items) => !!items[index],
  });

  return <Masonry {...props} items={items} onRender={maybeLoadMore} />;
};

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

        <Masonry items={reviews} render={ReviewCard} columnGutter={20} columnWidth={304} maxColumnCount={4}>
          {/* {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))} */}
        </Masonry>
        {/* <div className="reviews__grid">
        </div> */}
        {/* <div className="grid-container">
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>

          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
          <div className="grid-item">
            <img src="/images/food001.jpg" alt="Food Image" className="h-20 w-auto" />
            <div className="content">
              <h4>Dish Name</h4>
              <p>Short description of the food item.</p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default Reviews;
