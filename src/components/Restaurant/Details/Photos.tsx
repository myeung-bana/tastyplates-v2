import { useState } from "react";
import ReviewPopUpModal from "@/components/ReviewPopUpModal";
import "@/styles/pages/_reviews.scss";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { DEFAULT_IMAGE } from "@/constants/images";
import FallbackImage from "@/components/ui/Image/FallbackImage";

interface PhotosProps {
  data: ReviewedDataProps;
  index: number;
  // Removed unused prop
  image: {
    sourceUrl: string;
    id?: string | number;
  };
}

const Photos = ({ index, data, image }: PhotosProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="review-card relative overflow-hidden" style={{ height: "180px" }}>
      <ReviewPopUpModal
        data={data as unknown as GraphQLReview}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPhotoIndex={index}
      />
      <FallbackImage
        src={image.sourceUrl || DEFAULT_IMAGE}
        alt={'Review image'}
        fill
        className="review-card__image !object-cover rounded-2xl w-full h-full hover:cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      />
    </div>
  );
};

export default Photos;
