import Image from "next/image";
import Link from "next/link";
import { FiStar } from "react-icons/fi";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { restaurants } from "@/data/dummyRestaurants";
import { useState } from "react";
// import ModalPopup from "@/components/ModalPopup";
import ReviewDetailModal from "@/components/ModalPopup2";
import "@/styles/pages/_reviews.scss";

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

interface PhotosProps {
  data: ReviewedDataProps;
  index: number
  width: number
}

const Photos = ({ index, data, width }: PhotosProps) => {
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
console.log(data, 'data')
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
    </div>
  );
};

export default Photos;
