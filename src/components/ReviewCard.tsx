// ReviewCard.tsx
import Image from "next/image";
import ReviewPopUpModal from "./ReviewPopUpModal";
import { capitalizeWords, PAGE, stripTags } from "../lib/utils";
import {
  ReviewCardProps,
} from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { useState } from "react";
import Link from "next/link"; // Import Link
import { useSession } from "next-auth/react";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { PROFILE } from "@/constants/pages";
import { generateProfileUrl } from "@/lib/utils";
import "@/styles/pages/_restaurant-details.scss";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import {
  DEFAULT_IMAGE,
  DEFAULT_USER_ICON,
  STAR_FILLED,
} from "@/constants/images";

const ReviewCard = ({ data, width }: ReviewCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null); // 'signup' | 'signin' | null

  const { data: session } = useSession();

  return (
    <div className={`review-card !w-[${width}px] !border-none`}>
      <ReviewPopUpModal
        data={data as unknown as GraphQLReview}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* Auth modals */}
      {showAuthModal === "signup" && (
        <SignupModal
          isOpen={true}
          onClose={() => setShowAuthModal(null)}
          onOpenSignin={() => setShowAuthModal("signin")}
        />
      )}
      {showAuthModal === "signin" && (
        <SigninModal
          isOpen={true}
          onClose={() => setShowAuthModal(null)}
          onOpenSignup={() => setShowAuthModal("signup")}
        />
      )}
      <div className="review-card__image-container">
        <FallbackImage
          src={
            Array.isArray(data.reviewImages) && data.reviewImages.length > 0
              ? data.reviewImages[0]?.sourceUrl || DEFAULT_IMAGE
              : DEFAULT_IMAGE
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
          {data.author?.node?.databaseId || data.id ? (
            session?.user?.id &&
            String(session.user.id) ===
              String(data.author?.node?.databaseId || data.id) ? (
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
              <Link
                href={generateProfileUrl(data.author?.node?.databaseId || data.id)}
                prefetch={false}
              >
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
                onClick={() => setShowAuthModal('signin')}
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
            {/* Make username clickable and handle auth logic */}
            {data.author?.node?.databaseId || data.id ? (
              session?.user?.id &&
              String(session.user.id) ===
                String(data.author?.node?.databaseId || data.id) ? (
                <Link href={PROFILE}>
                  <h3 className="review-card__username line-clamp-1 cursor-pointer">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </h3>
                </Link>
              ) : session ? (
                <Link
                  href={generateProfileUrl(data.author?.node?.databaseId || data.id)}
                  prefetch={false}
                >
                  <h3 className="review-card__username line-clamp-1 cursor-pointer">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </h3>
                </Link>
              ) : (
                <h3
                  className="review-card__username line-clamp-1 cursor-pointer"
                  onClick={() => setShowAuthModal('signin')}
                >
                  {data.author?.name || data.author?.node?.name || "Unknown User"}
                </h3>
              )
            ) : (
              <h3 className="review-card__username line-clamp-1">
                {data.author?.name || data.author?.node?.name || "Unknown User"}
              </h3>
            )}
          </div>
          <div className="rate-container ml-auto inline-flex shrink-0">
            <div className="review-detail-meta">
              <span className="ratings">
                <Image
                  src={STAR_FILLED}
                  width={16}
                  height={16}
                  className="star-icon size-3 md:size-4"
                  alt="star icon"
                />
                <span className="rating-counter">{data.reviewStars}</span>
              </span>
            </div>
          </div>
        </div>
        <p className="text-[12px] md:text-sm font-semibold w-[304px] line-clamp-1 break-words">{capitalizeWords(stripTags(data.reviewMainTitle || "")) || ""}</p>
        <p className="review-card__text max-w-[304px] text-[12px] md:text-sm font-normal line-clamp-2 !mb-0 break-words">{capitalizeWords(stripTags(data.content || "")) || ""}</p>
        {/* <span className="review-card__timestamp">{data.date}</span> */}
      </div>
    </div>
  );
};

export default ReviewCard;
