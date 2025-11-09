"use client";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { stripTags, capitalizeWords } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "@/components/ui/Image/FallbackImage";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON, STAR_FILLED } from "@/constants/images";
import { PAGE } from "@/lib/utils";
import { EDIT_REVIEW } from "@/constants/pages";
import HashtagDisplay from "@/components/ui/HashtagDisplay/HashtagDisplay";

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
    <div className="overflow-hidden font-neusans">
      {/* Image Section - Matching ReviewCard2 aspect ratio */}
      <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2 group">
        <FallbackImage
          src={
            // Get first image from reviewImages array (from review_images backend field)
            (reviewDraft.reviewImages && 
             Array.isArray(reviewDraft.reviewImages) && 
             reviewDraft.reviewImages.length > 0 && 
             reviewDraft.reviewImages[0]?.sourceUrl) ||
            // Fallback: check if reviewImages is a single object (edge case)
            (typeof reviewDraft.reviewImages === 'object' && 
             !Array.isArray(reviewDraft.reviewImages) && 
             reviewDraft.reviewImages?.sourceUrl) ||
            // Final fallback to default image
            DEFAULT_REVIEW_IMAGE
          }
          alt="Review Draft"
          width={450}
          height={600}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />
        
        {/* Draft Badge */}
        <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-[10px] md:text-xs px-2 py-1 rounded-full font-medium">
          Draft
        </div>

        {/* Edit and Delete Buttons - Matching ReviewCard2 positioning */}
        <div className="flex flex-col gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="rounded-full p-2 bg-white/90 hover:bg-white shadow-md transition-all backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            title="Edit Review"
          >
            <FaEdit className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#31343F]" />
          </button>
          <button
            className="rounded-full p-2 bg-white/90 hover:bg-white shadow-md transition-all backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Review"
          >
            <IoMdClose className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#31343F]" />
          </button>
        </div>
      </div>

      {/* Content Section - Matching ReviewCard2 layout */}
      <div className="px-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-2">
          {/* User Avatar */}
          <FallbackImage
            src={DEFAULT_USER_ICON}
            alt={reviewDraft.authorName || "User"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            type={FallbackImageType.Icon}
          />

          {/* User Name - Matching ReviewCard2 font sizes */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[12px] md:text-xs font-medium text-[#31343F] truncate">
              {reviewDraft.authorName || "Unknown User"}
            </h3>
          </div>

          {/* Rating - Matching ReviewCard2 styling */}
          <div className="flex items-center gap-1 ml-auto">
            <Image
              src={STAR_FILLED}
              width={16}
              height={16}
              className="w-3 h-3 md:w-4 md:h-4"
              alt="star icon"
            />
            <span className="text-[12px] md:text-sm font-medium text-[#31343F]">
              {reviewDraft.reviewStars || "0"}
            </span>
          </div>
        </div>

        {/* Review Title - Matching ReviewCard2 font sizes */}
        {reviewDraft.reviewMainTitle && (
          <p className="text-[12px] md:text-sm text-[#31343F] mb-1 line-clamp-1 break-words">
            {capitalizeWords(stripTags(reviewDraft.reviewMainTitle))}
          </p>
        )}

        {/* Review Content with Hashtags - Matching ReviewCard2 */}
        <HashtagDisplay 
          content={stripTags(reviewDraft.content?.rendered || "")}
          hashtags={reviewDraft.recognitions || []}
          className="text-[12px] md:text-sm font-normal text-[#494D5D] line-clamp-2 break-words leading-[1.4] md:leading-[1.5]"
        />
      </div>
    </div>
  );
};

export default ListingCard;
