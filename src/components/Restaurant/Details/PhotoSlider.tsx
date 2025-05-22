import Image from "next/image";
import Link from "next/link";
import Slider from "react-slick";
import "@/styles/pages/_restaurant-details.scss";
import { PiCaretCircleLeft, PiCaretCircleRight } from "react-icons/pi";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import { useEffect, useState } from "react";

export default function PhotoSlider({
  reviewPhotos,
}: {
  reviewPhotos: string[];
}) {
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
  }, [reviewPhotos]);
  const handleResize = () => {
    setWidth(window.innerWidth);
  };
  const NextArrow = (props: any) => {
    const { className, style, onClick, length } = props;
    const slides = width > 1435 ? 4 : width > 1100 ? 3 : 2;
    const display = activeSlide === length - slides ? "none" : "block";

    return (
        <div
            className={`absolute !right-0 z-10 top-[92px] h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
            onClick={onClick}
            style={{ display: display }}
        >
            <RxCaretRight className="h-11 w-11 stroke-black"/>
        </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    const display = activeSlide === 0 ? "none" : "block";

    return (
        <div
            className={`absolute !left-0 z-10 top-[92px] h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
            onClick={onClick}
            style={{ display: display }}
        >
            <RxCaretLeft className="h-11 w-11 stroke-black"/>
        </div>
    );
  };

  type settings = {
    accessiblity: boolean
    dots: boolean
    arrows: boolean
    infinite: boolean
    speed: number
    slidesToShow: number
    slidesToScroll: number
    centerMode: boolean
    initialSlide: number
    lazyLoad: boolean
    responsive: any
    variableWidth: boolean
    swipeToSlide: boolean

  }

  const settings: settings = {
    accessiblity: true,
    dots: false,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    centerMode: false,
    initialSlide: 0,
    lazyLoad: false,
    variableWidth: true,
    swipeToSlide: true,
    responsive: [
        {
            breakpoint: 1435,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
              centerMode: false,
            },
        },
        {
            breakpoint: 1100,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              centerMode: false,
            },
        },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          centerMode: false,
        },
      },
      {
        breakpoint: 375,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
          centerMode: false,
        },
      },
    ],
  };

  return (
    <>
      {
        <div className={"w-full"}>
          <Slider
            {...settings}
            nextArrow={<NextArrow length={reviewPhotos.length} />}
            prevArrow={<PrevArrow />}
            beforeChange={(current: any) => {
              setActiveSlide(current);
            }}
            afterChange={(current: any) => {
              setActiveSlide(current);
            }}
            lazyLoad="progressive"
          >
            {reviewPhotos.map((photo: string, index: any) => (
              //   <Link
              //     href={''}
              //     key={index}
              //     style={{ width: '115px' }}
              //   >
              <div
                key={index}
                style={{
                  width: width > 767 ? index != reviewPhotos.length - 1 ?   334 : 304 : index != reviewPhotos.length - 1 ? 248 : 240 ,
                  height: 228,
                  paddingRight: 30,
                }}
              >
                <div className="">
                  {
                    <Image
                      src={photo}
                      alt={`review photo ${index}`}
                      className="h-full w-full rounded-[10px] object-cover review-block__image"
                      width={304}
                      height={228}
                      quality={100}
                      placeholder="blur"
                      blurDataURL="/images/loading.gif"
                    />
                  }
                </div>
              </div>
              //   </Link>
            ))}
          </Slider>
        </div>
      }
    </>
  );
}
