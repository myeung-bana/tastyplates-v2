import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ReviewService } from "@/services/Reviews/reviewService";
import { MdOutlineThumbUp } from "react-icons/md";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    ReviewService.fetchRestaurantReviewsById(restaurant.databaseId)
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
  }, [isOpen, restaurant.databaseId]);

  const handleLike = async (review: any) => {
    if (!session?.accessToken) {
      alert("You must be signed in to like a review.");
      return;
    }
    setLikeLoading((prev) => ({ ...prev, [review.id]: true }));
    const alreadyLiked = !!userLikes[review.id];
    try {
      await ReviewService.toggleCommentLike(review.id, !alreadyLiked, session.accessToken);
      setUserLikes((prev) => ({ ...prev, [review.id]: !alreadyLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [review.id]: prev[review.id] + (!alreadyLiked ? 1 : -1),
      }));
    } catch (e) {
      alert("Failed to update like. Please try again.");
    } finally {
      setLikeLoading((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />
      {/* Right-side modal */}
      <div className="relative w-full max-w-xl h-full bg-white shadow-xl flex flex-col overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#31343F]">
            Reviews · {reviews.length}
          </h2>
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
            const reviewTitle = review.title 
                   || review.reviewMainTitle || review.review_main_title || '';
            const reviewStars = review.rating ?? review.reviewStars ?? review.review_stars ?? 0;
            return (
              <div key={review.id || review.databaseId} className="mb-8 border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={review.author?.image || review.author?.node?.avatar?.url || "/profile-icon.svg"}
                    alt={review.author?.name || review.author?.node?.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-[#31343F]">{review.author?.name || review.author?.node?.name || "Unknown User"}</div>
                    <div className="flex gap-2 mt-1">
                      {(review.author?.palates || review.author?.node?.palates?.split("|").map((s: string) => ({ name: s.trim() })).filter((s: any) => s.name)).map((p: any, idx: number) => (
                        <span key={p.name + idx} className="bg-[#D56253] text-xs text-[#FDF0EF] rounded-full px-2 py-0.5 font-medium">
                          {p.name}
                        </span>
                      ))}
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
                <div className="text-[#31343F] mt-1">{review.comment || review.content}</div>
                <div className="flex items-center gap-2 text-sm text-[#494D5D] mt-2">
                  <button
                    onClick={() => handleLike(review)}
                    disabled={likeLoading[review.id]}
                    aria-pressed={userLikes[review.id]}
                    aria-label={userLikes[review.id] ? "Unlike comment" : "Like comment"}
                    className="focus:outline-none cursor-pointer"
                  >
                    {likeLoading[review.id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
                    ) : (
                      <MdOutlineThumbUp
                        className={`shrink-0 size-6 stroke-[#494D5D] transition-colors duration-200 ${userLikes[review.id] ? 'text-blue-600' : ''}`}
                      />
                    )}
                  </button>
                  <span>{likesCount[review.id] ?? review.likes ?? review.commentLikes ?? 0}</span>
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
