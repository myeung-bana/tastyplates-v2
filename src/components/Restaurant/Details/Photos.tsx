import Image from "next/image";
import { useState } from "react";
import ReviewDetailModal from "@/components/ReviewDetailModal";
import "@/styles/pages/_reviews.scss";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";

interface PhotosProps {
  data: ReviewedDataProps;
  index: number;
  width: number;
}

const Photos = ({ index, data, width }: PhotosProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultImage = "/images/default-image.png"

  const firstImageUrl =
    Array.isArray(data.reviewImages) && data.reviewImages.length > 0
      ? data.reviewImages[0].sourceUrl
      : null;
  const imageSrc = firstImageUrl || defaultImage;


  return (
    <div className="review-card" style={{ width: `${width}px` }}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="review-card__image-container">
        <Image
          src={imageSrc}
          alt="Review"
          width={400}
          height={400}
          className="review-card__image !w-full !object-cover rounded-2xl max-h-[405px] hover:cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
      </div>
    </div>
  );
};

export default Photos;
