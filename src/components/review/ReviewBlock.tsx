import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import SignupModal from "../auth/SignupModal";
import SigninModal from "../auth/SigninModal";
import PhotoSlider from "../Restaurant/Details/PhotoSlider";
import { GraphQLReview } from "@/types/graphql";

// Styles
import "@/styles/pages/_restaurant-details.scss";
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { capitalizeWords, formatDateT, PAGE, stripTags, truncateText, generateProfileUrl } from "@/lib/utils";
import { ReviewService } from "@/services/Reviews/reviewService";
import { palateFlagMap } from "@/utils/palateFlags";
import ReviewScreen from "./ReviewScreen";
import ReviewScreenDesktop from "./ReviewScreenDesktop";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { updateLikeFailed } from "@/constants/messages";
import toast from "react-hot-toast";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { CASH, DEFAULT_USER_ICON, FLAG, HELMET, PHONE, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { PROFILE } from "@/constants/pages";
import PalateTags from "../ui/PalateTags/PalateTags";
import { useUserData } from '@/hooks/useUserData';
import { useRef, useCallback } from "react";
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';

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
    authorId: number | string; // Support both numeric ID and UUID string
    authorUuid?: string; // Optional UUID field for restaurant_users lookup
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

  // Handle both UUID strings and numeric IDs
  const authorIdNum = typeof review.authorId === 'number' ? review.authorId : 0;
  const authorUuidStr = review.authorUuid || (typeof review.authorId === 'string' ? review.authorId : undefined);
  const userRelayId = authorUuidStr || encodeRelayId('user', authorIdNum);

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
        databaseId: authorIdNum,
        name: review.user,
        avatar: {
          url: review.userImage || DEFAULT_USER_ICON,
        },
      },
    },
    userId: authorIdNum,
    commentedOn: {
      node: {
        databaseId: parseInt(review.restaurantId),
        title: review.restaurantTitle || "",
        slug: review.restaurantSlug || "",
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

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ReviewBlock = ({ review }: ReviewBlockProps) => {
  const { user, firebaseUser } = useFirebaseSession();
  const [loading, setLoading] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [userLiked, setUserLiked] = useState(review.userLiked ?? false);
  const [likesCount, setLikesCount] = useState(review.commentLikes ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [expandedComment, setExpandedComment] = useState(false);
  
  // Cache user UUID to avoid redundant API calls
  const userUuidRef = useRef<string | null>(null);
  const fetchedLikeStatusRef = useRef<Set<string>>(new Set());

  const tags = [
    { id: 1, name: "Must Revisit", icon: FLAG },
    { id: 2, name: "Insta-Worthy", icon: PHONE },
    { id: 3, name: "Value for Money", icon: CASH },
    { id: 4, name: "Best Service", icon: HELMET },
  ];

  // Helper to get user UUID (cached)
  const getUserUuid = useCallback(async (): Promise<string | null> => {
    if (!user?.id || !firebaseUser) return null;
    
    // Check if user.id is already a UUID
    if (UUID_REGEX.test(user.id)) {
      userUuidRef.current = user.id;
      return user.id;
    }
    
    // Return cached value if available
    if (userUuidRef.current) {
      return userUuidRef.current;
    }
    
    try {
      const idToken = await firebaseUser.getIdToken();
      // Prefer the dedicated endpoint (faster + consistent with other components)
      const response = await fetch(`/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.data?.id) {
          userUuidRef.current = userData.data.id;
          return userData.data.id;
        }
      }
    } catch (error) {
      console.error("Error fetching user UUID:", error);
    }

    return null;
  }, [user?.id, firebaseUser]);

  // Log initial review data
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:158',message:'ReviewBlock mounted with initial data',data:{reviewId:review.id,reviewDatabaseId:review.databaseId,initialUserLiked:review.userLiked,initialCommentLikes:review.commentLikes,hasUser:!!user,hasFirebaseUser:!!firebaseUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, []);

  // Update state when review prop changes
  useEffect(() => {
    if (review) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:165',message:'Review prop changed',data:{reviewId:review.id,reviewDatabaseId:review.databaseId,newUserLiked:review.userLiked,newCommentLikes:review.commentLikes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setUserLiked(review.userLiked ?? false);
      setLikesCount(review.commentLikes ?? 0);
    }
  }, [review]);

  // Fetch actual like status from API when component mounts (for UUID reviews)
  useEffect(() => {
    if (!user || !firebaseUser || !review?.id) return;
    
    const reviewId = review.id;
    const isReviewUUID = typeof reviewId === 'string' && UUID_REGEX.test(reviewId);
    if (!isReviewUUID) return;
    
    const fetchLikeStatus = async () => {
      try {
        const userId = await getUserUuid();
        if (!userId) return;

        const key = `${reviewId}_${userId}`;
        if (fetchedLikeStatusRef.current.has(key)) return;
        fetchedLikeStatusRef.current.add(key);
        
        // #region agent log
        const fetchStartTime = Date.now();
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:185',message:'Fetching like status on mount',data:{reviewId,userId,reviewDatabaseId:review.databaseId,initialUserLiked:userLiked,initialLikesCount:likesCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        const idToken = await firebaseUser.getIdToken();
        const statusResponse = await fetch(`/api/v1/restaurant-reviews/toggle-like?review_id=${reviewId}&user_id=${userId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        
        const fetchDuration = Date.now() - fetchStartTime;
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success && statusData.data) {
            const isLiked = statusData.data.liked ?? false;
            const currentCount = statusData.data.likesCount ?? 0;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:200',message:'Like status fetched on mount',data:{reviewId,userId,isLiked,currentCount,reviewDatabaseId:review.databaseId,fetchDuration,previousUserLiked:userLiked,previousLikesCount:likesCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
            // #endregion
            
            // Only update if different from initial state
            if (isLiked !== userLiked || currentCount !== likesCount) {
              setUserLiked(isLiked);
              setLikesCount(currentCount);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:207',message:'State updated from API on mount',data:{reviewId,isLiked,currentCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
            }
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:213',message:'Error fetching like status on mount',data:{reviewId:review.id,errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Error fetching like status on mount:', error);
      }
    };
    
    fetchLikeStatus();
  }, [user, firebaseUser, review?.id, getUserUuid]); // Run when auth becomes available / review changes

  const toggleLike = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:165',message:'toggleLike called',data:{reviewId:review.id,reviewDatabaseId:review.databaseId,loading,hasUser:!!user,hasFirebaseUser:!!firebaseUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    if (loading) return;

    if (!user || !firebaseUser) {
      setIsShowSignin(true);
      return;
    }

    setLoading(true);
    
    const currentLiked = userLiked;
    const currentCount = likesCount;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:175',message:'Current state before optimistic update',data:{currentLiked,currentCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Optimistic update
    setUserLiked(!currentLiked);
    setLikesCount(currentLiked ? currentCount - 1 : currentCount + 1);

    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      
      // Use review.id (UUID) if available, otherwise fall back to databaseId
      const reviewId = review.id || String(review.databaseId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:187',message:'Before API call',data:{reviewId,currentLiked,hasIdToken:!!idToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      let response: { userLiked: boolean; likesCount: number };
      const apiStartTime = Date.now();
      if (currentLiked) {
        // Already liked, so unlike
        response = await reviewService.unlikeComment(
          reviewId,
          idToken
        );
      } else {
        // Not liked yet, so like
        response = await reviewService.likeComment(
          reviewId,
          idToken
        );
      }
      const apiDuration = Date.now() - apiStartTime;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:202',message:'API call success',data:{reviewId,response,apiDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
      // #endregion

      setUserLiked(response.userLiked);
      setLikesCount(response.likesCount);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:204',message:'State updated from API',data:{responseUserLiked:response.userLiked,responseLikesCount:response.likesCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
      // #endregion
      
      // NO SUCCESS TOAST - smooth like modern social media
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewBlock.tsx:208',message:'API call error',data:{reviewId:review.id||String(review.databaseId),errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      // Revert on error
      setUserLiked(currentLiked);
      setLikesCount(currentCount);
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

  // Helper to check if a value is a UUID string
  const isUuid = (id: string | number): boolean => {
    if (typeof id === 'string') {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }
    return false;
  };

  // Get the UUID string for profile URLs and session comparison
  // Priority: authorUuid prop > authorId if it's a UUID string
  const authorUuid = review.authorUuid || (typeof review.authorId === 'string' && isUuid(review.authorId) ? review.authorId : undefined);
  
  // For session comparison: use UUID if available, otherwise use encoded numeric ID
  const isOwnProfile = authorUuid 
    ? (user?.id && String(user.id) === String(authorUuid))
    : (user?.id && String(user.id) === String(encodeRelayId('user', review.authorId as number)));
  
  // Generate profile URL: use UUID if available, otherwise use numeric ID
  const profileUrl = authorUuid ? generateProfileUrl(authorUuid) : generateProfileUrl(review.authorId);

  // Fetch user data from restaurant_users if UUID is available and review data is incomplete
  const { userData: fetchedUserData, loading: userDataLoading } = useUserData(
    authorUuid && (review.user === "Unknown User" || !review.user || review.userImage === DEFAULT_USER_ICON)
      ? authorUuid
      : undefined
  );

  // Use fetched data as fallback if review data is incomplete
  const displayName = review.user && review.user !== "Unknown User" 
    ? review.user 
    : (fetchedUserData?.display_name || "Unknown User");

  const displayImage = review.userImage && review.userImage !== DEFAULT_USER_ICON
    ? review.userImage
    : (fetchedUserData?.profile_image || DEFAULT_USER_ICON);

  return (
    <div className="review-block">
      <div className="review-block__header">
        <div className="review-block__user">
          {(review.authorId || authorUuid) ? (
            isOwnProfile ? (
              <a href={PROFILE}>
                <Image
                  src={displayImage}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="review-block__user-image cursor-pointer"
                />
              </a>
              ) : user ? (
                <a href={profileUrl}>
                  <Image
                    src={displayImage}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="review-block__user-image cursor-pointer"
                  />
                </a>
              ) : (
                <Image
                  src={displayImage}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="review-block__user-image cursor-pointer"
                  onClick={() => setIsShowSignin(true)}
                />
              )
          ) : (
            <FallbackImage
              src={displayImage}
              alt={displayName}
              width={48}
              height={48}
              className="review-block__user-image"
              type={FallbackImageType.Icon}
            />
          )}
          <div className="review-block__user-info">
            {/* Make username clickable and handle auth logic */}
            {(review.authorId || authorUuid) ? (
              isOwnProfile ? (
                <a href={PROFILE}>
                  <h3 className="review-block__username cursor-pointer">
                    {displayName}
                  </h3>
                </a>
              ) : user ? (
                <a href={profileUrl}>
                  <h3 className="review-block__username cursor-pointer">
                    {displayName}
                  </h3>
                </a>
              ) : (
                <h3
                  className="review-block__username cursor-pointer"
                  onClick={() => setIsShowSignin(true)}
                >
                  {displayName}
                </h3>
              )
            ) : (
              <h3 className="review-block__username">
                {displayName}
              </h3>
            )}
            {/* Palate tags below username */}
            {review.palateNames && review.palateNames.length > 0 && (
              <div className="mt-1">
                <PalateTags palateNames={review.palateNames} maxTags={2} />
              </div>
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
            {formatDateT(review.date)}
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
          aria-label={userLiked ? "Unlike review" : "Like review"}
          className="review-block__action-btn"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-[2px] border-red-400 border-t-transparent"></div>
          ) : userLiked ? (
            <AiFillHeart className="w-5 h-5 text-red-500" />
          ) : (
            <FiHeart className="w-5 h-5" />
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
      {isModalOpen && (() => {
        const reviewData = mapToReviewedDataProps(review) as unknown as GraphQLReview;
        const reviewsArray = [reviewData];
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        
        return isMobile ? (
          <ReviewScreen
            reviews={reviewsArray}
            initialIndex={0}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPhotoIndex(0);
            }}
          />
        ) : (
          <ReviewScreenDesktop
            reviews={reviewsArray}
            initialIndex={0}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPhotoIndex(0);
            }}
          />
        );
      })()}

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