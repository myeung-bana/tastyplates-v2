import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ReviewService } from "@/services/Reviews/reviewService";
import { MdOutlineThumbUp } from "react-icons/md";
import { useSession } from "next-auth/react";
import { palateFlagMap } from "@/utils/palateFlags";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import toast from 'react-hot-toast';
import { commentLikedSuccess, commentUnlikedSuccess, signInReview, updateLikeFailed } from "@/constants/messages";

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

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    ReviewService.getRestaurantReviews(restaurant.databaseId, session?.accessToken)
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
      setIsShowSignup(true);
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
        response = await ReviewService.unlikeComment(commentId, accessToken);
        toast.success(commentUnlikedSuccess);
      } else {
        response = await ReviewService.likeComment(commentId, accessToken);
        toast.success(commentLikedSuccess);
      }
      // Update the review in the reviews array with the new like state/count
      setReviews((prevReviews) => prevReviews.map((r) =>
        (r.id === review.id || r.databaseId === review.databaseId)
          ? { ...r, userLiked: response.userLiked, commentLikes: response.likesCount }
          : r
      ));
    } catch (e) {
      toast.error(updateLikeFailed);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [review.id]: false }));
    }
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
            const userAvatar = review.userAvatar || "/profile-icon.svg";
            const palatesArr = review.palates ? review.palates.split("|").map((s: string) => ({ name: s.trim() })).filter((s: any) => s.name) : [];
            return (
              <div key={review.id || review.databaseId} className="mb-8 border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={userAvatar}
                    alt={review.author?.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-[#31343F]">{review.author?.name || "Unknown User"}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {palatesArr.map((p: any, idx: number) => {
                        const lowerName = p.name.toLowerCase();
                        return (
                          <span
                            key={p.name + idx}
                            className="flex items-center gap-1 bg-[#1b1b1b] text-xs text-[#FDF0EF] rounded-full px-2 py-1 font-medium"
                          >
                            {palateFlagMap[lowerName] && (
                              <img
                                src={palateFlagMap[lowerName]}
                                alt={`${p.name} flag`}
                                className="w-6 h-4 rounded object-cover"
                              />
                            )}
                            {p.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#31343F] mt-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    const full = i + 1 <= reviewStars;
                    const half = !full && i + 0.5 <= reviewStars;
                    return full ? (
                      <Image src="/star-filled.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
                    ) : half ? (
                      <Image src="/star-half.svg" key={i} width={16} height={16} className="size-4" alt="half star rating" />
                    ) : (
                      <Image src="/star.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
                    );
                  })}
                  <span className="mx-2">·</span>
                  <span>{new Date(review.date).toLocaleDateString()}</span>
                </div>
                {reviewTitle && (
                  <div className="font-semibold mt-2 text-[#31343F]">{reviewTitle}</div>
                )}
                <div className="text-[#31343F] mt-1" dangerouslySetInnerHTML={{ __html: review.content }} />
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
              </div>
            );
          })}
        </div>
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
