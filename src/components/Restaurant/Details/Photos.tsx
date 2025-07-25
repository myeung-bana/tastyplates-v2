import Image from "next/image";
import { useState } from "react";
import ReviewDetailModal from "@/components/ReviewDetailModal";
import "@/styles/pages/_reviews.scss";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";

interface PhotosProps {
  data: ReviewedDataProps;
  index: number;
  width: number;
  image: {
    sourceUrl: string;
    id?: string | number;
  };
}

const Photos = ({ index, data, width, image }: PhotosProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultImage = "/images/default-image.png";

  return (
    <div className="review-card relative overflow-hidden" style={{ height: "180px" }}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPhotoIndex={index}
      />
      <Image
        src={image.sourceUrl || defaultImage}
        alt={'Review image'}
        fill
        className="review-card__image !object-cover rounded-2xl w-full h-full hover:cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      />
    </div>
  );
};

export default Photos;
