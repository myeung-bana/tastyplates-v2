import Image from "next/image";
import Link from "next/link";
import { FiStar } from "react-icons/fi";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { restaurants } from "@/data/dummyRestaurants";
import { useState } from "react";
import ModalPopup from "./ModalPopup";
import ReviewDetailModal from "./ModalPopup2";

interface ReviewedDataProps {
  id: string;
  authorId: string;
  restaurantId: string;
  rating: number;
  date: string;
  comment: string;
  images: string[];
  userImage: string;
}

interface ReviewCardProps {
  data: ReviewedDataProps;
  index: number
  width: number
}

const ReviewCard = ({ index, data, width }: ReviewCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedReview, setSelectedReview] = useState<ReviewedDataProps>()
  const author = users.find((user) => user.id === data.authorId);
  const restaurant = restaurants.find(
    (restaurant) => restaurant.id === data.restaurantId
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

  return (
    <div className={`review-card !w-[${width}px]`}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="review-card__image-container">
        <Image
          src={data.images[0]}
          alt="Review"
          width={400}
          height={400}
          className="review-card__image !-full !w-full !object-cover rounded-2xl max-h-[405px] hover:cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <div className="review-card__content">
        <div className="review-card__user">
          <Image
            src={author?.image || "/profile-icon.svg"} // Fallback image if author is not found
            alt={author?.name || "User"} // Fallback name if author is not found
            width={32}
            height={32}
            className="review-card__user-image !rounded-2xl"
          />
          <div className="review-card__user-info">
            <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-sm !font-bold">
              {author?.name || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
              {palateNames?.map((tag, index) => (
                <span key={index} className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]">
                  {tag}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>
        <br></br>
        <p className="text-sm font-semibold w-[304] line-clamp-1">Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.</p>
        <p className="review-card__text w-[304] text-sm font-normal line-clamp-2">Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.</p>
        {/* <span className="review-card__timestamp">{data.date}</span> */}
      </div>
    </div>
  );
};

export default ReviewCard;
