import Image from "next/image";
import ReviewDetailModal from "./ReviewDetailModal";
import { stripTags } from "../lib/utils"
// import '@fortawesome/fontawesome-free/css/all.min.css';
import { ReviewedDataProps, ReviewCardProps } from "@/interfaces/Reviews/review";
import { useEffect, useState } from "react";
import { BsFillStarFill } from "react-icons/bs";
import { GiRoundStar } from "react-icons/gi";
import Photo from "../../public/images/default-image.png";

const ReviewCard = ({ index, data, width }: ReviewCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedReview, setSelectedReview] = useState<ReviewedDataProps>()

 const UserPalateNames = data?.palates
  ?.split("|")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

  return (
    <div className={`review-card !w-[${width}px]`}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="review-card__image-container">
        <Image
          src={
            Array.isArray(data.reviewImages) && data.reviewImages.length > 0
            ? data.reviewImages[0].sourceUrl
            : Photo
          }
          alt="Review"
          width={400}
          height={600}
          className="review-card__image rounded-2xl min-h-[233px] max-h-[236px] md:min-h-[228px] md:max-h-[405px] hover:cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <div className="review-card__content mt-2 md:mt-0">
        <div className="review-card__user mb-2">
          <Image
            src={data.userAvatar || data.author?.node?.avatar?.url || "/profile-icon.svg"}
            alt={data.author?.node?.name || "User"}
            width={32}
            height={32}
            className="review-card__user-image"
          />
          <div className="review-card__user-info">
            <h3 className="review-card__username line-clamp-1">
              {data.author?.name || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
              {UserPalateNames?.map((tag, index) => (
                <span key={index} 
                className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]">
                  {tag}{" "}
                </span>
              ))}
            </div>
          </div>
          <div className="rate-container ml-auto">
              <div className="review-detail-meta">
                <span className="ratings">
                  <Image src="/star-filled.svg" width={16} height={16} className="size-3 md:size-4" alt="star icon" />
                  <i className="rating-counter">
                    {data.reviewStars}
                  </i>
               </span>
              </div>
          </div>
        </div>
        <p className="text-[10px] md:text-sm font-semibold w-[304px] line-clamp-1">{stripTags(data.reviewMainTitle || "") || "Dorem ipsum dolor title."}</p>
        <p className="review-card__text w-[304] text-[10px] md:text-sm font-normal line-clamp-2">{stripTags(data.content || "") || "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}</p>
        {/* <span className="review-card__timestamp">{data.date}</span> */}
      </div>
    </div>
  );
};

export default ReviewCard;
