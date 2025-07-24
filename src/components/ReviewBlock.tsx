import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiStar, FiThumbsUp } from "react-icons/fi";
import { BiLike } from "react-icons/bi";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import PhotoSlider from "./Restaurant/Details/PhotoSlider";

// Styles
import "@/styles/pages/_restaurant-details.scss";
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import { useSession } from "next-auth/react";
import { capitalizeFirstLetter, formatDate, formatDateT, stripTags } from "@/lib/utils";
import { ReviewService } from "@/services/Reviews/reviewService";
import { palateFlagMap } from "@/utils/palateFlags";
import ReviewDetailModal from "./ReviewDetailModal";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { commentUnlikedSuccess, updateLikeFailed } from "@/constants/messages";
import toast from "react-hot-toast";
import { responseStatusCode as code } from "@/constants/response";

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

  return {
    databaseId: review.databaseId,
    id: review.id, // Use relay global ID
    // id: encodeRelayId('comment', review.id), // Use relay global ID
    reviewMainTitle: review.title || "",
    commentLikes: String(review.commentLikes ?? 0),
    userLiked: review.userLiked ?? false,
    content: review.comment,
    uri: "",
    reviewStars: String(review.rating),
    date: review.date,
    reviewImages,
    palates: review.palateNames?.join("|") ?? "",
    userAvatar: review.userImage || "/profile-icon.svg",
    author: {
      name: review.user,
      node: {
        id: `user:${review.authorId}`,
        databaseId: review.authorId,
        name: review.user,
        avatar: {
          url: review.userImage || "/profile-icon.svg",
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

const ReviewBlock = ({ review }: ReviewBlockProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [userLiked, setUserLiked] = useState(review.userLiked ?? false);
  const [likesCount, setLikesCount] = useState(review.commentLikes ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const tags = [
    { id: 1, name: "Must Revisit", icon: "/flag.svg" },
    { id: 2, name: "Insta-Worthy", icon: "/phone.svg" },
    { id: 3, name: "Value for Money", icon: "/cash.svg" },
    { id: 4, name: "Best Service", icon: "/helmet.svg" },
  ];

  useEffect(() => {
    if (review) {
      setUserLiked(review.userLiked ?? false);
      setLikesCount(review.commentLikes ?? 0);
    }
  }, [review.userLiked, review.commentLikes]);

  const toggleLike = async () => {
    if (loading) return;

    if (!session?.user) {
      setIsShowSignup(true);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (userLiked) {
        // Already liked, so unlike
        response = await ReviewService.unlikeComment(
          review.databaseId,
          session.accessToken ?? ""
        );
        if (response.data?.status === code.success) {
          toast.success(commentUnlikedSuccess);
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      } else {
        // Not liked yet, so like
        response = await ReviewService.likeComment(
          review.databaseId,
          session.accessToken ?? ""
        );
        if (response.data?.status === code.success) {
          toast.success("Liked comment successfully!");
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      }

      setUserLiked(response.data?.userLiked);
      setLikesCount(response.data?.likesCount);
    } catch (error) {
      console.error(error);
      toast.error(updateLikeFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-block px-4 py-4">
      <div className="review-block__header">
        <div className="review-block__user">
          <Image
            src={review?.userImage || "/profile-icon.svg"} // Fallback image if author is not found
            alt={review?.user || "User"} // Fallback name if author is not found
            width={40}
            height={40}
            className="review-block__user-image size-6 md:size-10"
          />
          <div className="review-block__user-info">
            <h3 className="review-block__username">
              {review?.user || "Unknown User"}
            </h3>
            <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
              {review.palateNames?.map((tag, index) => {
                const flagSrc = palateFlagMap[tag.toLowerCase()];
                return (
                  <span
                    key={index}
                    className="review-block__palate-tag flex items-center gap-1"
                  >
                    {flagSrc && (
                      <img
                        src={flagSrc}
                        alt={`${tag} flag`}
                        width={18}
                        height={10}
                        className="w-[18px] h-[10px] rounded object-cover"
                      />
                    )}
                    {capitalizeFirstLetter(tag)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="review-block__rating">
          {Array.from({ length: 5 }, (_, i) => {
            const full = i + 1 <= review.rating;
            const half = !full && i + 0.5 <= review.rating;
            return full ? (
              <Image src="/star-filled.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
            ) : (
              <Image src="/star.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
            );
          })}
          {/* {[...Array(review.rating)].map((i, index) =>
            <FiStar key={index} className="review-block__star fill-[#31343F] stroke-none size-3 md:size-3.5" />
          )} */}
          <span className="text-[#9ca3af] text-[10px] md:text-sm p-2">&#8226;</span>
          <span className="review-card__timestamp">
            {formatDate(review.date)}
          </span>
        </div>
        <div className="review-block__recognitions flex gap-2">
          {Array.isArray(review.recognitions) && review.recognitions.filter(tag => tag && tag.trim() !== '').length > 0 && (
            <div className="review-block__recognitions flex gap-2">
              {tags
                .filter(tagObj => (review.recognitions ?? []).includes(tagObj.name))
                .map((tagObj, index) => (
                  <span key={index} className="review-block__recognitions flex items-center !w-fit !rounded-[50px] !px-3 !py-1 border-[1.5px] border-[#494D5D] gap-1">
                    <Image src={tagObj.icon} alt={tagObj.name} width={16} height={16} />
                    {tagObj.name}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
      <div className="review-block__content">
        <h3 className="text-xs md:text-base font-medium mb-2">{stripTags(review?.title || "") ?? ""}</h3>
        <p className="review-block__text">{stripTags(review.comment || "") || ""}</p>
      </div>
      <div className="">
        {" "}
        {/* {review.images.length > 0 && review.images?.map((image) => (
          <Image
            src={image} // Display the first image from the review
            alt="Review"
            width={400}
            height={400}
            className="review-block__image"
          />
        ))} */}
        {isModalOpen && (
          <ReviewDetailModal
            key={`modal-${selectedPhotoIndex}`}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPhotoIndex(0);
            }}
            data={mapToReviewedDataProps(review)}
            initialPhotoIndex={selectedPhotoIndex}
            userLiked={userLiked}
            likesCount={likesCount}
            onLikeChange={(liked, count) => {
              setUserLiked(liked);
              setLikesCount(count);
            }}
          />
        )}
        <PhotoSlider
          reviewPhotos={review.images}
          onImageClick={(idx) => {
            setSelectedPhotoIndex(idx);
            setIsModalOpen(true);
          }}
        />
      </div>
      <div className="review-block__actions flex items-center relative text-center">
        <button
          onClick={toggleLike}
          disabled={loading}
          aria-pressed={userLiked}
          aria-label={userLiked ? "Unlike comment" : "Like comment"}
          className="review-block__action-btn cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
          ) : (
            <BiLike className={`shrink-0 size-6 transition-colors duration-200 ${userLiked ? 'text-blue-600 fill-blue-600' : 'fill-[#494D5D]'
              }`} />
          )}
          <span className="ml-2 text-center leading-6">{likesCount}</span>
        </button>
        {/* <button className="review-block__action-btn">
            <FiMessageCircle />
          </button> */}
      </div>
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

export default ReviewBlock;