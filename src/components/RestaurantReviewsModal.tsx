import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ReviewService } from "@/services/Reviews/reviewService";
import { MdOutlineThumbUp } from "react-icons/md";
import { useSession } from "next-auth/react";
import { palateFlagMap } from "@/utils/palateFlags";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import toast from 'react-hot-toast';
import { commentLikedSuccess, commentUnlikedSuccess, updateLikeFailed } from "@/constants/messages";
import { responseStatusCode as code } from "@/constants/response";
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

interface RestaurantReviewsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  restaurant: Restaurant;
}

const reviewService = new ReviewService();

const RestaurantReviewsModal: React.FC<RestaurantReviewsModalProps> = ({ isOpen, setIsOpen, restaurant }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<{ [key: string]: boolean }>({});
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const { data: session } = useSession();
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>({});
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState<{ [id: string]: boolean }>({});
  const [expandedContents, setExpandedContents] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    reviewService.getRestaurantReviews(restaurant.databaseId, session?.accessToken)
      .then((data) => {
        setReviews(data.reviews || []);
        // Initialize likes count and userLikes
        const likes: { [key: string]: number } = {};
        const userLiked: { [key: string]: boolean } = {};
        (data.reviews || []).forEach((review: any) => {
          likes[review.id] = review.likes || review.commentLikes || 0;
          // If backend provides info if user liked, set here. Otherwise, default to false.
          userLiked[review.id] = !!review.userHasLiked;
        });
        setLikesCount(likes);
        setUserLikes(userLiked);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, restaurant.databaseId, session?.accessToken]);

  const handleLike = async (review: any) => {
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
        if (response.status === code.success) {
          toast.success(commentUnlikedSuccess);
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      } else {
        response = await reviewService.likeComment(commentId, accessToken);
        if (response.status === code.success) {
          toast.success(commentLikedSuccess);
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      }
      // Update the review in the reviews array with the new like state/count
      setReviews((prevReviews) => prevReviews.map((r) =>
        (r.id === review.id || r.databaseId === review.databaseId)
          ? { ...r, userLiked: response.data?.userLiked, commentLikes: response.data?.likesCount }
          : r
      ));
    } catch (e) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />
      {/* Right-side modal */}
      <div className="relative w-full max-w-xl h-full bg-white shadow-xl flex flex-col overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold text-[#31343F]">Reviews</h2>
            <span className="text-lg font-normal text-[#494D5D]">·</span>
            <span className="text-lg font-normal text-[#494D5D]">{reviews.length}</span>
          </div>
          <button
            className="text-2xl text-gray-400 hover:text-gray-700"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <div className="text-center text-gray-400">Loading...</div>}
          {error && <div className="text-center text-red-500">Failed to load reviews.</div>}
          {!loading && !error && reviews.length === 0 && (
            <div className="text-center text-gray-400">No reviews</div>
          )}
          {!loading && !error && reviews.map((review: any) => {
            const reviewTitle = review.reviewMainTitle || '';
            const reviewStars = review.reviewStars ?? 0;
            const userAvatar = review.userAvatar || DEFAULT_USER_ICON;
            const palatesArr = review.palates
              ? review.palates
                .split("|")
                .map((s: string) => ({ name: capitalizeWords(s.trim()) }))
                .filter((s: any) => s.name)
              : [];
            return (
              <div key={review.id || review.databaseId} className="mb-8 pb-0 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  {(review.author?.node?.id || review.userId) ? (
                    session?.user?.id && String(session.user.id) === String(review.author?.node?.id || review.userId) ? (
                      <a href={PROFILE}>
                        <Image
                          src={userAvatar}
                          alt={review.author?.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover cursor-pointer"
                        />
                      </a>
                    ) : session ? (
                      <a href={PAGE(PROFILE, [(review.author?.node?.id || review.userId)])}>
                        <Image
                          src={userAvatar}
                          alt={review.author?.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover cursor-pointer"
                        />
                      </a>
                    ) : (
                      <Image
                        src={userAvatar}
                        alt={review.author?.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover cursor-pointer"
                        onClick={() => setIsShowSignin(true)}
                      />
                    )
                  ) : (
                    <FallbackImage
                      src={userAvatar}
                      alt={review.author?.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    type={FallbackImageType.Icon}
                    />
                  )}
                  <div>
                    {(review.author?.node?.id || review.userId) ? (
                      session?.user?.id && String(session.user.id) === String(review.author?.node?.id || review.userId) ? (
                        <a href={PROFILE}>
                          <div className="font-semibold text-[#31343F] cursor-pointer">
                            {review.author?.name || review.author?.node?.name || "Unknown User"}
                          </div>
                        </a>
                      ) : session ? (
                        <a href={PAGE(PROFILE, [(review.author?.node?.id || review.userId)])}>
                          <div className="font-semibold text-[#31343F] cursor-pointer">
                            {review.author?.name || review.author?.node?.name || "Unknown User"}
                          </div>
                        </a>
                      ) : (
                        <div
                          className="font-semibold text-[#31343F] cursor-pointer"
                          onClick={() => setIsShowSignin(true)}
                        >
                          {review.author?.name || review.author?.node?.name || "Unknown User"}
                        </div>
                      )
                    ) : (
                      <div className="font-semibold text-[#31343F]">
                        {review.author?.name || review.author?.node?.name || "Unknown User"}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {palatesArr.map((p: any, idx: number) => {
                        const lowerName = p.name.toLowerCase();
                        return (
                          <span
                            key={p.name + idx}
                            className="flex items-center gap-1 bg-[#f1f1f1] text-xs text-[#31343f] rounded-full px-2 py-1 font-medium"
                          >
                            {palateFlagMap[lowerName] && (
                              <img
                                src={palateFlagMap[lowerName]}
                                alt={`${p.name} flag`}
                                className="w-[18px] h-[10px] rounded object-cover"
                              />
                            )}
                            {p.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-[#31343F] mt-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    const full = i + 1 <= reviewStars;
                    const half = !full && i + 0.5 <= reviewStars;
                    return full ? (
                      <Image src={STAR_FILLED} key={i} width={16} height={16} className="size-4" alt="star rating" />
                    ) : half ? (
                      <Image src={STAR_HALF} key={i} width={16} height={16} className="size-4" alt="half star rating" />
                    ) : (
                      <Image src={STAR} key={i} width={16} height={16} className="size-4" alt="star rating" />
                    );
                  })}
                  <span className="mx-2">·</span>
                  <span>{new Date(review.date).toLocaleDateString()}</span>
                </div>
                {/* {reviewTitle && (
                  <div className="font-semibold mt-2 text-[#31343F]">{reviewTitle}</div>
                )} */}
                {reviewTitle && (
                  <div className="text-sm font-semibold mt-2 text-[#31343F]">
                    {expandedTitles[review.id]
                      ? capitalizeWords(reviewTitle)
                      : capitalizeWords(truncateText(reviewTitle, reviewTitleDisplayLimit)) + "… "}
                    {" "}
                    {reviewTitle.length > reviewTitleDisplayLimit && (
                      <button
                        className="hover:underline font-bold"
                        onClick={() => toggleTitle(review.id)}
                      >
                        {expandedTitles[review.id] ? " [Show Less]" : "[See More]"}
                      </button>
                    )}
                  </div>
                )}
                <div className="text-[#31343F] mt-1 leading-[1.5]">
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
                        className="text-xs hover:underline inline font-bold"
                        onClick={() => toggleContent(review.id)}
                      >
                        {expandedContents[review.id] ? "[Show Less]" : "[See More]"}
                      </button>
                    </>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: capitalizeWords(review.content) }} />
                  )}
                </div>
                {/* <div className="text-[#31343F] mt-1" dangerouslySetInnerHTML={{ __html: review.content }} /> */}
                <div className="flex items-center gap-2 text-sm text-[#494D5D] mt-2">
                  <button
                    onClick={() => handleLike(review)}
                    disabled={likeLoading[review.id]}
                    aria-pressed={review.userLiked}
                    aria-label={review.userLiked ? "Unlike comment" : "Like comment"}
                    className="focus:outline-none cursor-pointer"
                  >
                    {likeLoading[review.id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
                    ) : (
                      <MdOutlineThumbUp
                        className={`shrink-0 size-6 stroke-[#494D5D] transition-colors duration-200 ${review.userLiked ? 'text-blue-600' : ''}`}
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
      `}</style>
    </div>
  );
};

export default RestaurantReviewsModal;
