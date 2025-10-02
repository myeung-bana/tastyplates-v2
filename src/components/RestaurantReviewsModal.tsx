import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ReviewService } from "@/services/Reviews/reviewService";
import { MdOutlineThumbUp } from "react-icons/md";
import { useSession } from "next-auth/react";
import PalateTags from "@/components/ui/PalateTags/PalateTags";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import toast from 'react-hot-toast';
import { commentLikedSuccess, commentUnlikedSuccess, updateLikeFailed } from "@/constants/messages";
import { DEFAULT_USER_ICON, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { capitalizeWords, PAGE, truncateText } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";

interface Restaurant {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  image: string;
  rating: number;
  palatesNames?: string[];
  countries: string;
  priceRange: string;
}

interface ReviewAuthor {
  name?: string;
  node?: {
    id?: string;
    name?: string;
  };
}

interface ReviewData {
  id: string;
  databaseId: number;
  reviewMainTitle?: string;
  reviewStars?: string | number;
  userAvatar?: string;
  palates?: string;
  author?: ReviewAuthor;
  userId?: string;
  date: string;
  content: string;
  commentLikes?: number;
  userLiked?: boolean;
  likes?: number;
  userHasLiked?: boolean;
}

interface RestaurantReviewsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  restaurant: Restaurant;
}

const reviewService = new ReviewService();

const RestaurantReviewsModal: React.FC<RestaurantReviewsModalProps> = ({ isOpen, setIsOpen, restaurant }) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<{ [key: string]: boolean }>({});
  const { data: session } = useSession();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState<{ [id: string]: boolean }>({});
  const [expandedContents, setExpandedContents] = useState<{ [id: string]: boolean }>({});
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    reviewService.getRestaurantReviews(restaurant.databaseId, session?.accessToken)
      .then((data) => {
        const reviewsData = (data.reviews || []) as unknown as ReviewData[];
        setReviews(reviewsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, restaurant.databaseId, session?.accessToken]);

  const handleLike = async (review: ReviewData) => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }
    setLikeLoading((prev) => ({ ...prev, [review.id]: true }));
    // Always use the latest userLiked from the review object
    const alreadyLiked = !!review.userLiked;
    try {
      let response;
      const commentId = Number(review.databaseId);
      const accessToken = session.accessToken || "";
      if (alreadyLiked) {
        response = await reviewService.unlikeComment(commentId, accessToken);
        toast.success(commentUnlikedSuccess);
      } else {
        response = await reviewService.likeComment(commentId, accessToken);
        toast.success(commentLikedSuccess);
      }
      // Update the review in the reviews array with the new like state/count
      setReviews((prevReviews) => prevReviews.map((r) =>
        (r.id === review.id || r.databaseId === review.databaseId)
          ? { ...r, userLiked: response.userLiked, commentLikes: response.likesCount }
          : r
      ));
    } catch {
      toast.error(updateLikeFailed);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const toggleTitle = (id: string) => {
    setExpandedTitles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleContent = (id: string) => {
    setExpandedContents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCloseWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Match CSS animation duration
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200"
        onClick={handleCloseWithAnimation}
      />
      {/* Right-side modal (compact) */}
      <div className={`relative w-full max-w-md h-full bg-white shadow-xl flex flex-col overflow-y-auto ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}` }>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <h2 className="text-base font-semibold text-[#31343F]">Reviews</h2>
            <span className="text-sm text-[#494D5D]">·</span>
            <span className="text-sm text-[#494D5D]">{reviews.length}</span>
          </div>
          <button
            className="text-xl text-gray-400 hover:text-gray-700 p-1"
            onClick={handleCloseWithAnimation}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div className="text-center text-red-500 text-sm py-4">Failed to load reviews.</div>}
          {!loading && !error && reviews.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4">No reviews</div>
          )}
          {!loading && !error && reviews.map((review) => {
            const reviewTitle = review.reviewMainTitle || '';
            const reviewStars = Number(review.reviewStars) || 0;
            const userAvatar = review.userAvatar || DEFAULT_USER_ICON;
            const palateNames = review.palates
              ? review.palates
                .split("|")
                .map((s: string) => capitalizeWords(s.trim()))
                .filter((s) => s)
              : [];
            return (
              <div key={review.id || review.databaseId} className="mb-4 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2 mb-2">
                  {(review.author?.node?.id || review.userId) ? (
                    session?.user?.id && String(session.user.id) === String(review.author?.node?.id || review.userId) ? (
                      <a href={PROFILE}>
                        <Image
                          src={userAvatar}
                          alt={review.author?.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover cursor-pointer flex-shrink-0"
                        />
                      </a>
                    ) : session ? (
                      <a href={PAGE(PROFILE, [(review.author?.node?.id || review.userId || '')])}>
                        <Image
                          src={userAvatar}
                          alt={review.author?.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover cursor-pointer flex-shrink-0"
                        />
                      </a>
                    ) : (
                      <Image
                        src={userAvatar}
                        alt={review.author?.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover cursor-pointer flex-shrink-0"
                        onClick={() => setIsShowSignin(true)}
                      />
                    )
                  ) : (
                    <FallbackImage
                      src={userAvatar}
                      alt={review.author?.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover flex-shrink-0"
                    type={FallbackImageType.Icon}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {(review.author?.node?.id || review.userId) ? (
                      session?.user?.id && String(session.user.id) === String(review.author?.node?.id || review.userId) ? (
                        <a href={PROFILE}>
                          <div className="font-medium text-sm text-[#31343F] cursor-pointer truncate">
                            {review.author?.name || review.author?.node?.name || "Unknown User"}
                          </div>
                        </a>
                      ) : session ? (
                        <a href={PAGE(PROFILE, [(review.author?.node?.id || review.userId || '')])}>
                          <div className="font-medium text-sm text-[#31343F] cursor-pointer truncate">
                            {review.author?.name || review.author?.node?.name || "Unknown User"}
                          </div>
                        </a>
                      ) : (
                        <div
                          className="font-medium text-sm text-[#31343F] cursor-pointer truncate"
                          onClick={() => setIsShowSignin(true)}
                        >
                          {review.author?.name || review.author?.node?.name || "Unknown User"}
                        </div>
                      )
                    ) : (
                      <div className="font-medium text-sm text-[#31343F] truncate">
                        {review.author?.name || review.author?.node?.name || "Unknown User"}
                      </div>
                    )}
                    <PalateTags palateNames={palateNames} maxTags={2} className="!mb-0" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#494D5D] mb-1">
                  {Array.from({ length: 5 }, (_, i) => {
                    const full = i + 1 <= reviewStars;
                    const half = !full && i + 0.5 <= reviewStars;
                    return full ? (
                      <Image src={STAR_FILLED} key={i} width={12} height={12} className="w-3 h-3" alt="star rating" />
                    ) : half ? (
                      <Image src={STAR_HALF} key={i} width={12} height={12} className="w-3 h-3" alt="half star rating" />
                    ) : (
                      <Image src={STAR} key={i} width={12} height={12} className="w-3 h-3" alt="star rating" />
                    );
                  })}
                  <span>·</span>
                  <span>{new Date(review.date).toLocaleDateString()}</span>
                </div>
                {reviewTitle && (
                  <div className="text-sm font-medium mb-1 text-[#31343F] break-words">
                    {expandedTitles[review.id]
                      ? capitalizeWords(reviewTitle)
                      : capitalizeWords(truncateText(reviewTitle, reviewTitleDisplayLimit)) + "… "}
                    {" "}
                    {reviewTitle.length > reviewTitleDisplayLimit && (
                      <button
                        className="hover:underline font-medium text-xs"
                        onClick={() => toggleTitle(review.id)}
                      >
                        {expandedTitles[review.id] ? " [Show Less]" : "[See More]"}
                      </button>
                    )}
                  </div>
                )}
                <div className="text-sm text-[#31343F] leading-relaxed break-words">
                  {review.content.length > reviewDescriptionDisplayLimit ? (
                    <>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: expandedContents[review.id]
                            ? capitalizeWords(review.content)
                            : capitalizeWords(truncateText(review.content, reviewDescriptionDisplayLimit)) + "…",
                        }}
                      />
                      <button
                        className="text-xs hover:underline font-medium"
                        onClick={() => toggleContent(review.id)}
                      >
                        {expandedContents[review.id] ? "[Show Less]" : "[See More]"}
                      </button>
                    </>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: capitalizeWords(review.content) }} />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#494D5D] mt-2">
                  <button
                    onClick={() => handleLike(review)}
                    disabled={likeLoading[review.id]}
                    aria-pressed={review.userLiked}
                    aria-label={review.userLiked ? "Unlike comment" : "Like comment"}
                    className="focus:outline-none cursor-pointer"
                  >
                    {likeLoading[review.id] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-[1px] border-blue-400 border-t-transparent"></div>
                    ) : (
                      <MdOutlineThumbUp
                        className={`shrink-0 w-4 h-4 stroke-[#494D5D] transition-colors duration-200 ${review.userLiked ? 'text-blue-600' : ''}`}
                      />
                    )}
                  </button>
                  <span>{review.commentLikes ?? 0}</span>
                </div>
              </div>
            );
          })}
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
      <style jsx global>{`
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-slide-out-right {
          animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantReviewsModal;
