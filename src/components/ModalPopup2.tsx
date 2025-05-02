"use client";
import React, { useEffect, useState } from "react";
import { FiX, FiStar, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { restaurants } from "@/data/dummyRestaurants";
import Link from "next/link";
import SignupModal from "./SignupModal";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import Slider from "react-slick";

//styles
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const ReviewDetailModal: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
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
  const NextArrow = (props: any) => {
    const { className, style, onClick, length } = props;
    const display = activeSlide === length - 1 ? "none" : "block";

    return (
      <div
        className={`absolute !right-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretRight className="h-11 w-11 stroke-black" />
      </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    const display = activeSlide === 0 ? "none" : "block";

    return (
      <div
        className={`absolute !left-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretLeft className="h-11 w-11 stroke-black" />
      </div>
    );
  };

  type settings = {
    accessiblity: boolean;
    dots: boolean;
    arrows: boolean;
    infinite: boolean;
    speed: number;
    slidesToShow: number;
    slidesToScroll: number;
    centerMode: boolean;
    initialSlide: number;
    lazyLoad: boolean;
    responsive: any;
    variableWidth: boolean;
    swipeToSlide: boolean;
  };

  const settings: settings = {
    accessiblity: true,
    dots: true,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: false,
    initialSlide: 0,
    lazyLoad: false,
    variableWidth: false,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 375,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          centerMode: false,
        },
      },
    ],
  };
  const author = users.find((user) => user.id === data.authorId);
  const restaurant = restaurants.find(
    (restaurant: any) => restaurant.id === data.restaurantId
  );
  const palateNames = author?.palateIds
    .map((id) => {
      const palate = palates.find((p) => p.id === id);
      return palate ? palate.name : null; // Return the name or null if not found
    })
    .filter((name) => name); // Filter out any null values

  const restaurantPalateNames = restaurant?.cuisineIds
    .map((rid) => {
      const palate = palates.find((p) => p.cuisineId === rid);
      return palate ? palate.name : null; // Return the name or null if not found
    })
    .filter((name) => name); // Filter out any null values

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="review-modal !max-w-[1060px] h-[520px] lg:h-[640px] xl:h-[720px] !p-0 !rounded-3xl overflow-hidden font-inter">
        <button className="review-modal__close !top-6" onClick={onClose}>
          <FiX />
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 !h-[520px] lg:h-[640px]  xl:!h-[720px] w-full">
          <div className="review-card__image-container overflow-hidden">
            <Slider
              {...settings}
              nextArrow={<NextArrow length={data.images.length} />}
              prevArrow={<PrevArrow />}
              beforeChange={(current: any) => {
                setActiveSlide(current + 1);
              }}
              // afterChange={(current: any) => {
              //   setActiveSlide(current);
              // }}
              lazyLoad="progressive"
            >
              {data.images.map((image: string, index: any) => (
                <Image
                  key={index}
                  src={image}
                  alt="Review"
                  width={400}
                  height={400}
                  className="review-card__image !h-[520px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover !rounded-t-3xl sm:!rounded-l-3xl sm:rounded-t-none"
                />
              ))}
            </Slider>
          </div>
          <div className="review-card__content !m-2 sm:!m-0 !pb-10">
            <div className="flex justify-between pr-10 items-center">
              <div className="review-card__user">
                <Image
                  src={author?.image || "/profile-icon.svg"} // Fallback image if author is not found
                  alt={author?.name || "User"} // Fallback name if author is not found
                  width={32}
                  height={32}
                  className="review-card__user-image !rounded-2xl"
                />
                <div className="review-card__user-info">
                  <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                    {author?.name || "Unknown User"}
                  </h3>
                  <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                    {palateNames?.map((tag: any, index: number) => (
                      <span
                        key={index}
                        className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]"
                      >
                        {tag}{" "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsShowSignup(true)}
                className="px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit"
              >
                Follow
              </button>
              <SignupModal
                isOpen={isShowSignup}
                onClose={() => setIsShowSignup(false)}
              />
            </div>

            <br></br>
            <div className="overflow-y-auto max-h-[200px] sm:max-h-full">
              <p className="text-sm font-semibold">
                Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
                vulputate libero et velit interdum, ac aliquet odio mattis.
              </p>
              <p className="review-card__text text-sm font-normal">
                Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
                vulputate libero et velit interdum, ac aliquet odio mattis.
              </p>
              <div className="review-card__rating pb-4 border-b border-[#CACACA]">
                {Array.from({ length: data.rating }, (_, i) => (
                  <FiStar
                    key={i}
                    className="review-card__star !fill-[#31343F] stroke-[#31343F]"
                  />
                ))}
                <span className="review-card__timestamp">{data.date}</span>
              </div>
              {/* <div className="review-card__header">
              <div className="review-card__user-info">
                <h3>{restaurant?.name}</h3>
                <Link
                  href={`/restaurants/${data.id}`}
                  className="review-card__restaurant"
                >
                  {restaurant?.address}
                </Link>
              </div>
              </div> */}
              <div className="mt-20 lg:mt-40 xl:mt-[340px] border-t-[1px] border-[#CACACA] py-4">
                <div className="flex flex-row justify-start items-center gap-10">
                  <textarea
                    rows={1}
                    cols={30}
                    placeholder="Add a comment"
                    className="p-2 border border-[#CACACA] resize-none"
                  ></textarea>
                  <div className="flex gap-2 flex-row items-center">
                    <div className="realative text-center">
                      <button className="mt-2">
                        <FiThumbsUp className="shrink-0 stroke-[#31343F]" />
                      </button>
                      <span className="ml-2">13</span>
                    </div>
                    <div className="relative text-center">
                      <button className="mt-2">
                        <FiMessageSquare className="shrink-0 stroke-[#31343F]" />
                      </button>
                      <span className="ml-2">10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
