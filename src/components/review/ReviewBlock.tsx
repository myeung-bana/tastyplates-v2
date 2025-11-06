import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BiLike } from "react-icons/bi";
import SignupModal from "../auth/SignupModal";
import SigninModal from "../auth/SigninModal";
import PhotoSlider from "../Restaurant/Details/PhotoSlider";
import { GraphQLReview } from "@/types/graphql";

// Styles
import "@/styles/pages/_restaurant-details.scss";
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import { useSession } from "next-auth/react";
import { capitalizeWords, formatDate, PAGE, stripTags, truncateText, generateProfileUrl } from "@/lib/utils";
import { ReviewService } from "@/services/Reviews/reviewService";
import { palateFlagMap } from "@/utils/palateFlags";
import ReviewPopUpModal from "./ReviewPopUpModal";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { commentUnlikedSuccess, updateLikeFailed } from "@/constants/messages";
import toast from "react-hot-toast";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { CASH, DEFAULT_USER_ICON, FLAG, HELMET, PHONE, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { PROFILE } from "@/constants/pages";
import PalateTags from "./ui/PalateTags/PalateTags";

// Helper for relay global ID
const encodeRelayId = (type: string, id: number) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(`${type}:${id}`);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(`${type}:${id}`).toString('base64');
  }
  return `${type}:${id}`;
};

interface ReviewBlockProps {
  review: {
    databaseId: number;
    id: string;
    authorId: number;
    restaurantId: string;
    user: string;
    rating: number;
    date: string;
    title?: string,
    comment: string;
    images: string[];
    userImage: string;
    recognitions?: string[];
    palateNames?: string[];
    commentLikes?: number;
    userLiked?: boolean;
  };
}

const mapToReviewedDataProps = (review: ReviewBlockProps["review"]): ReviewedDataProps => {
  // const encodeRelayId = (type: string, id: number) => {
  //   if (typeof window !== 'undefined' && window.btoa) {
  //     return window.btoa(`${type}:${id}`);
  //   } else if (typeof Buffer !== 'undefined') {
  //     return Buffer.from(`${type}:${id}`).toString('base64');
  //   }
  //   return `${type}:${id}`;
  // };

  const reviewImages: ReviewedDataProps["reviewImages"] = review.images.map((src, index) => ({
    databaseId: index,
    id: `${review.id}-${index}`,
    sourceUrl: src,
  }));

  // Encode relay global ID for user
  const encodeRelayId = (type: string, id: number) => {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(`${type}:${id}`);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(`${type}:${id}`).toString('base64');
    }
    return `${type}:${id}`;
  };

  const userRelayId = encodeRelayId('user', review.authorId);

  return {
    databaseId: review.databaseId,
    id: review.id, // Use relay global ID for comment if needed
    reviewMainTitle: review.title || "",
    commentLikes: String(review.commentLikes ?? 0),
    userLiked: review.userLiked ?? false,
    content: review.comment,
    uri: "",
    reviewStars: String(review.rating),
    date: review.date,
    reviewImages,
    palates: review.palateNames?.join("|") ?? "",
    userAvatar: review.userImage || DEFAULT_USER_ICON,
    author: {
      name: review.user,
      node: {
        id: userRelayId,
        databaseId: review.authorId,
        name: review.user,
        avatar: {
          url: review.userImage || DEFAULT_USER_ICON,
        },
      },
    },
    userId: review.authorId,
    commentedOn: {
      node: {
        databaseId: parseInt(review.restaurantId),
        title: "",
        slug: "",
        fieldMultiCheck90: "",
        featuredImage: {
          node: {
            databaseId: "",
            altText: "",
            mediaItemUrl: "",
            mimeType: "",
            mediaType: "",
          },
        },
      },
    },
  };
};

const reviewService = new ReviewService();

const ReviewBlock = ({ review }: ReviewBlockProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [userLiked, setUserLiked] = useState(review.userLiked ?? false);
  const [likesCount, setLikesCount] = useState(review.commentLikes ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [expandedComment, setExpandedComment] = useState(false);

  const tags = [
    { id: 1, name: "Must Revisit", icon: FLAG },
    { id: 2, name: "Insta-Worthy", icon: PHONE },
    { id: 3, name: "Value for Money", icon: CASH },
    { id: 4, name: "Best Service", icon: HELMET },
  ];

  useEffect(() => {
    if (review) {
      setUserLiked(review.userLiked ?? false);
      setLikesCount(review.commentLikes ?? 0);
    }
  }, [review]);

  const toggleLike = async () => {
    if (loading) return;

    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    setLoading(true);
    try {
      let response: { userLiked: boolean; likesCount: number };
      if (userLiked) {
        // Already liked, so unlike
        response = await reviewService.unlikeComment(
          review.databaseId,
          session.accessToken ?? ""
        );
        toast.success(commentUnlikedSuccess);
      } else {
        // Not liked yet, so like
        response = await reviewService.likeComment(
          review.databaseId,
          session.accessToken ?? ""
        );
        toast.success("Liked comment successfully!");
      }

      setUserLiked(response.userLiked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error(error);
      toast.error(updateLikeFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = () => {
    setIsModalOpen(true);
    setSelectedPhotoIndex(0);
  };

  return (
    <div className="review-block">
      <div className="review-block__header">
        <div className="review-block__user">
          {(review.authorId) ? (
            session?.user?.id && String(session.user.id) === String(encodeRelayId('user', review.authorId)) ? (
              <a href={PROFILE}>
                <Image
                  src={review?.userImage || DEFAULT_USER_ICON}
                  alt={review?.user || "User"}
                  width={48}
                  height={48}
                  className="review-block__user-image cursor-pointer"
                />
              </a>
            ) : session ? (
              <a href={generateProfileUrl(review.authorId)}>
                <Image
                  src={review?.userImage || DEFAULT_USER_ICON}
                  alt={review?.user || "User"}
                  width={48}
                  height={48}
                  className="review-block__user-image cursor-pointer"
                />
              </a>
            ) : (
              <Image
                src={review?.userImage || DEFAULT_USER_ICON}
                alt={review?.user || "User"}
                width={48}
                height={48}
                className="review-block__user-image cursor-pointer"
                onClick={() => setIsShowSignin(true)}
              />
            )
          ) : (
            <FallbackImage
              src={review?.userImage || DEFAULT_USER_ICON}
              alt={review?.user || "User"}
              width={48}
              height={48}
              className="review-block__user-image"
              type={FallbackImageType.Icon}
            />
          )}
          <div className="review-block__user-info">
            {/* Make username clickable and handle auth logic */}
            {(review.authorId) ? (
              session?.user?.id && String(session.user.id) === String(encodeRelayId('user', review.authorId)) ? (
                <a href={PROFILE}>
                  <h3 className="review-block__username cursor-pointer">
                    {review?.user || "Unknown User"}
                  </h3>
                </a>
              ) : session ? (
                <a href={generateProfileUrl(review.authorId)}>
                  <h3 className="review-block__username cursor-pointer">
                    {review?.user || "Unknown User"}
                  </h3>
                </a>
              ) : (
                <h3
                  className="review-block__username cursor-pointer"
                  onClick={() => setIsShowSignin(true)}
                >
                  {review?.user || "Unknown User"}
                </h3>
              )
            ) : (
              <h3 className="review-block__username">
                {review?.user || "Unknown User"}
              </h3>
            )}
          </div>
        </div>
        <div className="review-block__rating">
          {Array.from({ length: 5 }, (_, i) => {
            const full = i + 1 <= review.rating;
            const half = !full && i + 0.5 <= review.rating;
            return full ? (
              <Image src={STAR_FILLED} key={i} width={16} height={16} className="size-4" alt="star rating" />
            ) : half ? (
              <Image src={STAR_HALF} key={i} width={16} height={16} className="size-4" alt="star rating" />
            ) : (
              <Image src={STAR} key={i} width={16} height={16} className="size-4" alt="star rating" />
            );
          })}
          <span className="review-block__timestamp">
            {formatDate(review.date)}
          </span>
        </div>
      </div>
      <div className="review-block__content">
        <h3 className="text-sm font-semibold mb-2 break-words">
          {stripTags(review?.title || "")}
        </h3>
        <p className="review-block__text break-words">
          {stripTags(review?.comment || "").length > 200 ? (
            <>
              {capitalizeWords(truncateText(stripTags(review?.comment || ""), 200))}...
              <button
                className="text-blue-600 hover:underline ml-1 font-medium text-sm"
                onClick={handleSeeMore}
              >
                See more
              </button>
            </>
          ) : (
            capitalizeWords(stripTags(review?.comment || ""))
          )}
        </p>
        {/* Reviewer's palate tags */}
        <PalateTags palateNames={review.palateNames || []} maxTags={2} />
      </div>
      {/* Show only first 2 images */}
      <div className="review-block__image-container">
        {review.images.slice(0, 2).map((image, index) => (
          <Image
            key={index}
            src={image}
            alt="Review"
            width={130}
            height={130}
            className="review-block__image"
            onClick={() => {
              setSelectedPhotoIndex(index);
              setIsModalOpen(true);
            }}
          />
        ))}
        {review.images.length > 2 && (
          <div 
            className="review-block__image bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={handleSeeMore}
          >
            <span className="text-gray-600 font-medium text-sm">
              +{review.images.length - 2} more
            </span>
          </div>
        )}
      </div>

      <div className="review-block__actions">
        <button
          onClick={toggleLike}
          disabled={loading}
          aria-pressed={userLiked}
          aria-label={userLiked ? "Unlike comment" : "Like comment"}
          className="review-block__action-btn"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
          ) : (
            <BiLike className={`w-5 h-5 transition-colors duration-200 ${userLiked ? 'text-blue-600 fill-blue-600' : 'fill-gray-500'}`} />
          )}
          <span>{likesCount}</span>
        </button>
        <button
          onClick={handleSeeMore}
          className="review-block__action-btn"
        >
          <span>View full review</span>
        </button>
      </div>

      {/* Modal for full review */}
      {isModalOpen && (
        <ReviewPopUpModal
          key={`modal-${selectedPhotoIndex}`}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPhotoIndex(0);
          }}
          data={mapToReviewedDataProps(review) as unknown as GraphQLReview}
          initialPhotoIndex={selectedPhotoIndex}
          userLiked={userLiked}
          likesCount={likesCount}
          onLikeChange={(liked, count) => {
            setUserLiked(liked);
            setLikesCount(count);
          }}
        />
      )}

      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(false);
          setIsShowSignin(true);
        }}
      />
      <SigninModal
        isOpen={isShowSignin}
        onClose={() => setIsShowSignin(false)}
        onOpenSignup={() => {
          setIsShowSignin(false);
          setIsShowSignup(true);
        }}
      />
    </div>
  );
};

export { mapToReviewedDataProps };
export default ReviewBlock;