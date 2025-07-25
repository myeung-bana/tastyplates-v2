// ReviewCard.tsx
import Image from "next/image";
import ReviewDetailModal from "./ReviewDetailModal";
import { capitalizeWords, PAGE, stripTags } from "../lib/utils"
import { ReviewedDataProps, ReviewCardProps } from "@/interfaces/Reviews/review";
import { useEffect, useState } from "react";
import { BsFillStarFill } from "react-icons/bs";
import { GiRoundStar } from "react-icons/gi";
import { palateFlagMap } from "@/utils/palateFlags";
import Link from "next/link"; // Import Link
import { useSession } from "next-auth/react";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { DEFAULT_USER_ICON, STAR_FILLED } from "@/constants/images";

const ReviewCard = ({ index, data, width }: ReviewCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedReview, setSelectedReview] = useState<ReviewedDataProps>()
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null); // 'signup' | 'signin' | null
  const defaultImage = "/images/default-image.png"
  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s) => capitalizeWords(s.trim()))
    .filter((s) => s.length > 0);

  const { data: session } = useSession();

  return (
    <div className={`review-card !w-[${width}px] !border-none`}>
      <ReviewDetailModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* Auth modals */}
      {showAuthModal === 'signup' && (
        <SignupModal
          isOpen={true}
          onClose={() => setShowAuthModal(null)}
          onOpenSignin={() => setShowAuthModal('signin')}
        />
      )}
      {showAuthModal === 'signin' && (
        <SigninModal
          isOpen={true}
          onClose={() => setShowAuthModal(null)}
          onOpenSignup={() => setShowAuthModal('signup')}
        />
      )}
      <div className="review-card__image-container">
        <FallbackImage
          src={
            Array.isArray(data.reviewImages) && data.reviewImages.length > 0
            ? data.reviewImages[0].sourceUrl
            : defaultImage
          }
          alt="Review"
          width={400}
          height={600}
          className="review-card__image rounded-2xl min-h-[233px] max-h-[236px] md:min-h-[228px] md:max-h-[405px] hover:cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <div className="review-card__content !px-0 mt-2 md:mt-0">
        <div className="review-card__user mb-2">
          {/* Make the user image clickable and link to their profile, or show auth modal if not logged in */}
          {data.author?.node?.databaseId ? (
            session?.user?.id && String(session.user.id) === String(data.author.node.databaseId) ? (
              <Link href={PROFILE}>
                <FallbackImage
                  src={data.userAvatar || DEFAULT_USER_ICON}
                  alt={data.author?.node?.name || "User"}
                  width={32}
                  height={32}
                  className="review-card__user-image cursor-pointer"
                  type={FallbackImageType.Icon}
                />
              </Link>
            ) : session ? (
              <Link href={PAGE(PROFILE, [data.author.node.databaseId])} prefetch={false}>
                <FallbackImage
                  src={data.userAvatar || DEFAULT_USER_ICON}
                  alt={data.author?.node?.name || "User"}
                  width={32}
                  height={32}
                  className="review-card__user-image cursor-pointer"
                  type={FallbackImageType.Icon}
                />
              </Link>
            ) : (
              <FallbackImage
                src={data.userAvatar || DEFAULT_USER_ICON}
                alt={data.author?.node?.name || "User"}
                width={32}
                height={32}
                className="review-card__user-image cursor-pointer"
                onClick={() => setShowAuthModal('signup')}
                type={FallbackImageType.Icon}
              />
            )
          ) : (
            <FallbackImage
              src={data.userAvatar || DEFAULT_USER_ICON}
              alt={data.author?.node?.name || "User"}
              width={32}
              height={32}
              className="review-card__user-image"
              type={FallbackImageType.Icon}
            />
          )}

          <div className="review-card__user-info">
            <h3 className="review-card__username line-clamp-1">
              {data.author?.name || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
              {UserPalateNames?.map((tag, index) => (
                <span
                  key={index}
                  className="review-block__palate-tag !text-[10px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#1b1b1b] flex items-center gap-1"
                >
                  {palateFlagMap[tag.toLowerCase()] && (
                    <Image
                      src={palateFlagMap[tag.toLowerCase()]}
                      alt={`${tag} flag`}
                      width={18}
                      height={10}
                      className="w-[18px] h-[10px] rounded object-cover"
                    />
                  )}
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="rate-container ml-auto">
              <div className="review-detail-meta">
                <span className="ratings">
                  <Image src={STAR_FILLED} width={16} height={16} className="size-3 md:size-4" alt="star icon" />
                  <i className="rating-counter">
                    {data.reviewStars}
                  </i>
                </span>
              </div>
          </div>
        </div>
        <p className="text-[10px] md:text-sm font-semibold w-[304px] line-clamp-1">{stripTags(data.reviewMainTitle || "") || ""}</p>
        <p className="review-card__text max-w-[304px] text-[10px] md:text-sm font-normal line-clamp-2 !mb-0">{stripTags(data.content || "") || ""}</p>
        {/* <span className="review-card__timestamp">{data.date}</span> */}
      </div>
    </div>
  );
};

export default ReviewCard;
