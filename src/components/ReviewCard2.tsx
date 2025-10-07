// ReviewCard2.tsx - Optimized for Grid Layout
import Image from "next/image";
import ReviewPopUpModal from "./ReviewPopUpModal";
import { capitalizeWords, PAGE, stripTags } from "../lib/utils";
import { ReviewCardProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { PROFILE } from "@/constants/pages";
import { generateProfileUrl } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import HashtagDisplay from "./ui/HashtagDisplay/HashtagDisplay";
import {
  DEFAULT_IMAGE,
  DEFAULT_USER_ICON,
  STAR_FILLED,
} from "@/constants/images";

const ReviewCard2 = ({ data }: Omit<ReviewCardProps, 'width' | 'index'>) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<string | null>(null);

  const { data: session } = useSession();

  return (
    <div className="overflow-hidden">
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

      {/* Image Section - Standalone with rounded borders */}
      <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2">
        <FallbackImage
          src={
            Array.isArray(data.reviewImages) && data.reviewImages.length > 0
              ? data.reviewImages[0]?.sourceUrl || DEFAULT_IMAGE
              : DEFAULT_IMAGE
          }
          alt="Review"
          width={450}
          height={600}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Content Section - No background, minimal padding */}
      <div className="px-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-2">
          {/* User Avatar */}
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
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
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
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  type={FallbackImageType.Icon}
                />
              </Link>
            ) : (
              <FallbackImage
                src={data.userAvatar || DEFAULT_USER_ICON}
                alt={data.author?.node?.name || "User"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
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
              className="w-8 h-8 rounded-full object-cover"
              type={FallbackImageType.Icon}
            />
          )}

          {/* User Name - Matching ReviewCard font sizes */}
          <div className="flex-1 min-w-0">
            {data.author?.node?.databaseId || data.id ? (
              session?.user?.id &&
              String(session.user.id) ===
                String(data.author?.node?.databaseId || data.id) ? (
                <Link href={PROFILE}>
                  <h3 className="text-[12px] md:text-xs font-medium text-[#31343F] truncate cursor-pointer">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </h3>
                </Link>
              ) : session ? (
                <Link
                  href={generateProfileUrl(data.author?.node?.databaseId || data.id)}
                  prefetch={false}
                >
                  <h3 className="text-[12px] md:text-xs font-medium text-[#31343F] truncate cursor-pointer">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </h3>
                </Link>
              ) : (
                <h3
                  className="text-[12px] md:text-xs font-medium text-[#31343F] truncate cursor-pointer"
                  onClick={() => setShowAuthModal('signin')}
                >
                  {data.author?.name || data.author?.node?.name || "Unknown User"}
                </h3>
              )
            ) : (
              <h3 className="text-[12px] md:text-xs font-medium text-[#31343F] truncate">
                {data.author?.name || data.author?.node?.name || "Unknown User"}
              </h3>
            )}
          </div>

          {/* Rating - Matching ReviewCard styling */}
          <div className="flex items-center gap-1 ml-auto">
            <Image
              src={STAR_FILLED}
              width={16}
              height={16}
              className="w-3 h-3 md:w-4 md:h-4"
              alt="star icon"
            />
            <span className="text-[12px] md:text-sm font-medium text-[#31343F]">{data.reviewStars}</span>
          </div>
        </div>

        {/* Review Title - Matching ReviewCard font sizes */}
        {data.reviewMainTitle && (
          <p className="text-[12px] md:text-sm font-semibold text-[#31343F] mb-1 line-clamp-1 break-words">
            {capitalizeWords(stripTags(data.reviewMainTitle))}
          </p>
        )}

        {/* Review Content with Hashtags */}
        <HashtagDisplay 
          content={stripTags(data.content || "")}
          hashtags={data.hashtags as unknown as string[]}
          className="text-[12px] md:text-sm font-normal text-[#494D5D] line-clamp-2 break-words leading-[1.4] md:leading-[1.5]"
        />
      </div>
    </div>
  );
};

export default ReviewCard2;
