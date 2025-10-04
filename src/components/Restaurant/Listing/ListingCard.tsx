"use client";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import "@/styles/components/_listing-card.scss";
import { formatDateT, stripTags } from "@/lib/utils";
import FallbackImage from "@/components/ui/Image/FallbackImage";
import { DEFAULT_IMAGE, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import { PAGE } from "@/lib/utils";
import { EDIT_REVIEW } from "@/constants/pages";

export interface ReviewDraft {
  author: number;
  authorName: string;
  content: {
    rendered: string;
    raw: string;
  }
  date: string;
  id: number;
  link: string;
  post: number;
  recognitions: string[];
  reviewImages: {
    databaseId: number;
    id: string;
    sourceUrl: string;
  }[];
  reviewMainTitle: string;
  reviewStars: string;
  status: string;
  type: string;
}

interface ListingCardProps {
  reviewDraft: ReviewDraft;
  onDelete: () => void;
}

const ListingCard = ({ reviewDraft, onDelete }: ListingCardProps) => {
  const router = useRouter();

  const handleEdit = () => {
    // Navigate to edit-review page with the review ID
    // We'll use a placeholder slug since we don't have restaurant slug in the draft
    router.push(PAGE(EDIT_REVIEW, ["draft", reviewDraft.id.toString()]));
  };

  return (
    <div className="relative overflow-hidden rounded-md">
      <div className="restaurant-card__image relative">
        <FallbackImage
          src={reviewDraft.reviewImages?.[0]?.sourceUrl || DEFAULT_IMAGE}
          alt="Review Draft"
          width={304}
          height={228}
          className="restaurant-card__img"
        />
        {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
        <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
          <button
            className="rounded-full p-2 bg-white hover:bg-gray-50 transition-colors"
            onClick={handleEdit}
            title="Edit Review"
          >
            <FaEdit className="w-4 h-4" />
          </button>
          <button
            className="rounded-full p-2 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => onDelete()}
            title="Delete Review"
          >
            <IoMdClose />
          </button>
        </div>
      </div>
      <div className="restaurant-card__content">
        <div className="restaurant-card__header">
          {/* <h2 className="restaurant-card__name line-clamp-1 w-[220px]">
              {restaurant.name}
            </h2> */}
          <div className="restaurant-card__rating">
            {Array.from({ length: 5 }, (_, i) => {
              const full = i + 1 <= Number(reviewDraft.reviewStars);
              const half = !full && i + 0.5 <= Number(reviewDraft.reviewStars);
              return full ? (
                <Image src={STAR_FILLED} key={i} width={16} height={16} className="size-4" alt="star rating" />
              ) : half ? (
                <Image src={STAR_HALF} key={i} width={16} height={16} className="size-4" alt="half star rating" />
              ) : (
                <Image src={STAR} key={i} width={16} height={16} className="size-4" alt="star rating" />
              );
            })}
          </div>
        </div>
        <p className="text-[10px] sm:text-sm font-semibold w-[304px] line-clamp-1">{stripTags(reviewDraft?.reviewMainTitle || "") || ""}</p>
        <p className="review-card__text w-[304] text-[10px] sm:text-sm font-normal line-clamp-2 mb-3">{stripTags(reviewDraft?.content?.rendered || "")}</p>
        <span className="review-card__timestamp">{formatDateT(reviewDraft.date)}</span>
        {/* <div className="restaurant-card__info">
            <div className="restaurant-card__location">
              <FiMapPin className="restaurant-card__icon" />
              <span className="line-clamp-2 text-[10px] md:text-base">{restaurant.countries}</span>
            </div>
          </div> */}

        {/* <div className="restaurant-card__tags">
            {cuisineNames.map((cuisineName, index) => (
              <span key={index} className="restaurant-card__tag">
                &#8226; {cuisineName}
              </span>
            ))}
            &nbsp;&#8226; $
          </div> */}
      </div>
    </div>
  );
};

export default ListingCard;
