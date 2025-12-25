import { useState } from "react";
import SwipeableReviewViewer from "@/components/review/SwipeableReviewViewer";
import SwipeableReviewViewerDesktop from "@/components/review/SwipeableReviewViewerDesktop";
import "@/styles/pages/_reviews.scss";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { DEFAULT_RESTAURANT_IMAGE } from "@/constants/images";
import FallbackImage from "@/components/ui/Image/FallbackImage";
import { useIsMobile } from "@/utils/deviceUtils";

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
  const isMobile = useIsMobile();
  
  const reviewsArray = [data as unknown as GraphQLReview];

  return (
    <div className="review-card relative overflow-hidden" style={{ height: "180px" }}>
      {isMobile ? (
        <SwipeableReviewViewer
          reviews={reviewsArray}
          initialIndex={0}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      ) : (
        <SwipeableReviewViewerDesktop
          reviews={reviewsArray}
          initialIndex={0}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      <FallbackImage
        src={image.sourceUrl || DEFAULT_RESTAURANT_IMAGE}
        alt={'Review image'}
        fill
        className="review-card__image !object-cover rounded-2xl w-full h-full hover:cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      />
    </div>
  );
};

export default Photos;
