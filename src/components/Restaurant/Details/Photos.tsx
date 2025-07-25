import Image from "next/image";
import { useState } from "react";
import ReviewDetailModal from "@/components/ReviewDetailModal";
import "@/styles/pages/_reviews.scss";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import FallbackImage from "@/components/ui/Image/FallbackImage";
import { DEFAULT_IMAGE } from "@/constants/images";

interface PhotosProps {
  data: ReviewedDataProps;
  index: number;
  width: number;
}

const Photos = ({ index, data, width }: PhotosProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const images =
    Array.isArray(data.reviewImages) && data.reviewImages.length > 0
      ? data.reviewImages
      : [{ sourceUrl: DEFAULT_IMAGE }];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === images.length - 1 ? prev : prev + 1));
  };

  return (
    <div className="review-card relative overflow-hidden" style={{ width: `${width}px`, height: "180px" }}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPhotoIndex={currentImgIdx}
      />

      {/* Prev button */}
      {images.length > 1 && currentImgIdx > 0 && (
        <button
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow"
        >
          <RxCaretLeft className="h-11 w-11 stroke-black" />
        </button>
      )}

      {/* Sliding container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentImgIdx * width}px)`,
          width: `${images.length * width}px`,
        }}
      >
        {images.map((img: any, idx: number) => (
          <div
            key={img.id || `img-${idx}`}
            className="flex-shrink-0"
            style={{ width: `${width}px`, height: "180px" }}
          >
            <FallbackImage
              src={img.sourceUrl || DEFAULT_IMAGE}
              alt={`Review image ${idx + 1}`}
              width={width}
              height={180}
              className="review-card__image !object-cover rounded-2xl w-full h-full hover:cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        ))}
      </div>

      {/* Next button */}
      {images.length > 1 && currentImgIdx < images.length - 1 && (
        <button
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow"
        >
          <RxCaretRight className="h-11 w-11 stroke-black" />
        </button>
      )}
    </div>
  );
};

export default Photos;
