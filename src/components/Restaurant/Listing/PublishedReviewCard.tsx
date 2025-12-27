"use client";
import Image from "next/image";
import { FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { stripTags, capitalizeWords } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "@/components/ui/Image/FallbackImage";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON, STAR_FILLED } from "@/constants/images";
import HashtagDisplay from "@/components/ui/HashtagDisplay/HashtagDisplay";
import { ReviewV2 } from "@/app/api/v1/services/reviewV2Service";

interface PublishedReviewCardProps {
  review: ReviewV2;
}

const PublishedReviewCard = ({ review }: PublishedReviewCardProps) => {
  const router = useRouter();

  const handleEdit = () => {
    // Navigate to edit-review page with review UUID
    if (review.id) {
      router.push(`/tastystudio/edit-review/${review.id}`);
    } else {
      console.error('Review UUID not available');
    }
  };

  // Extract first image URL
  const getFirstImageUrl = (): string => {
    if (!review.images || !Array.isArray(review.images) || review.images.length === 0) {
      return DEFAULT_REVIEW_IMAGE;
    }
    
    // Find first image with valid URL
    const firstImage = review.images.find(
      (img) => img && img.url && typeof img.url === 'string' && img.url.trim().length > 0
    );
    
    return firstImage?.url || DEFAULT_REVIEW_IMAGE;
  };

  // Get author name
  const authorName = review.author?.display_name || review.author?.username || "Unknown User";
  const authorAvatar = review.author?.profile_image 
    ? (typeof review.author.profile_image === 'string' 
        ? review.author.profile_image 
        : (review.author.profile_image as any)?.url || DEFAULT_USER_ICON)
    : DEFAULT_USER_ICON;

  return (
    <div 
      className="overflow-hidden font-neusans cursor-pointer"
      onClick={handleEdit}
    >
      {/* Image Section - Matching ReviewCard2 aspect ratio */}
      <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2 group">
        <FallbackImage
          src={getFirstImageUrl()}
          alt="Published Review"
          width={450}
          height={600}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />

        {/* Edit Button - Matching ReviewCard2 positioning */}
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
        </div>
      </div>

      {/* Content Section - Matching ReviewCard2 layout */}
      <div className="px-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-2">
          {/* User Avatar */}
          <FallbackImage
            src={authorAvatar}
            alt={authorName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            type={FallbackImageType.Icon}
          />

          {/* User Name - Matching ReviewCard2 font sizes */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[12px] md:text-xs font-medium text-[#31343F] truncate">
              {authorName}
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
              {review.rating || "0"}
            </span>
          </div>
        </div>

        {/* Review Title - Matching ReviewCard2 font sizes */}
        {review.title && (
          <p className="text-[12px] md:text-sm text-[#31343F] mb-1 line-clamp-1 break-words">
            {capitalizeWords(stripTags(review.title))}
          </p>
        )}

        {/* Review Content with Hashtags - Matching ReviewCard2 */}
        <HashtagDisplay 
          content={stripTags(review.content || "")}
          hashtags={review.recognitions || []}
          className="text-[12px] md:text-sm font-normal text-[#494D5D] line-clamp-2 break-words leading-[1.4] md:leading-[1.5]"
        />
      </div>
    </div>
  );
};

export default PublishedReviewCard;

