"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useWheel } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart, FiChevronLeft, FiChevronRight, FiStar, FiMapPin, FiSend } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from "@/services/user/userService";
import { FollowService } from "@/services/follow/followService";
import { useFollowContext } from "../FollowContext";
import { capitalizeWords, stripTags, generateProfileUrl } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";

// Helper function to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  if (typeof profileImage === 'string') return profileImage;
  if (typeof profileImage === 'object') {
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  return null;
};
import { commentLikedSuccess, commentUnlikedSuccess, authorIdMissing, errorOccurred } from "@/constants/messages";
import { responseStatusCode as code } from "@/constants/response";
import toast from "react-hot-toast";
import ReplyItem from "./ReplyItem";
import SigninModal from "../auth/SigninModal";
import SignupModal from "../auth/SignupModal";
import "@/styles/components/_swipeable-review-viewer-desktop.scss";

interface SwipeableReviewViewerDesktopProps {
  reviews: GraphQLReview[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const reviewService = new ReviewService();
const userService = new UserService();
const followService = new FollowService();

const SwipeableReviewViewerDesktop: React.FC<SwipeableReviewViewerDesktopProps> = ({
  reviews,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const { user } = useFirebaseSession();
  const { setFollowState } = useFollowContext();
  
  // Helper to get Firebase ID token for API calls
  const getFirebaseToken = useCallback(async () => {
    if (!user?.firebase_uuid) return null;
    try {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return null;
  }, [user]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState(true); // Changed to true to show by default
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedCommentCountsRef = useRef<Set<number>>(new Set());
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  const wheelAccumulatorRef = useRef(0);

  // Windowed rendering - only render visible ±2 reviews
  const visibleIndices = useMemo(() => {
    const indices = new Set<number>();
    for (let i = Math.max(0, currentIndex - 1); i <= Math.min(reviews.length - 1, currentIndex + 2); i++) {
      indices.add(i);
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, [currentIndex, reviews.length]);

  // Preload images for current and next reviews
  useEffect(() => {
    if (!isOpen) return;

    const imagesToPreload = [
      reviews[currentIndex],
      reviews[currentIndex + 1],
      reviews[currentIndex + 2],
    ].filter(Boolean);

    imagesToPreload.forEach((review) => {
      if (!review) return;
      review.reviewImages?.forEach((img) => {
        if (img?.sourceUrl && !preloadedImagesRef.current.has(img.sourceUrl)) {
          const image = new Image();
          image.src = img.sourceUrl;
          preloadedImagesRef.current.add(img.sourceUrl);
        }
      });
    });
  }, [currentIndex, isOpen, reviews]);

  // Initialize like states
  useEffect(() => {
    if (reviews.length > 0) {
      const initialLiked: Record<number, boolean> = {};
      const initialCounts: Record<number, number> = {};
      reviews.forEach((review) => {
        initialLiked[review.databaseId] = review.userLiked ?? false;
        initialCounts[review.databaseId] = review.commentLikes ?? 0;
      });
      setUserLiked(initialLiked);
      setLikesCount(initialCounts);
    }
  }, [reviews]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setCurrentImageIndex(0);
      setShowComments(true); // Changed to true to show by default
      setReplies([]);
      setIsTextExpanded(false); // Reset text expansion
    }
  }, [isOpen, initialIndex]);

  // Hide/show navbar when viewer opens/closes
  useEffect(() => {
    if (isOpen) {
      // Add class to body to hide navbar
      document.body.classList.add('swipeable-review-viewer-open');
    } else {
      // Remove class when viewer closes
      document.body.classList.remove('swipeable-review-viewer-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('swipeable-review-viewer-open');
    };
  }, [isOpen]);

  // Check follow state when review changes
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const review = reviews[currentIndex];
    if (!review?.author?.node?.databaseId) return;

    const authorUserId = review.author.node.databaseId;
    const currentUserId = user?.id ? parseInt(String(user.id)) : null;

    // Don't check follow state for own profile
    if (currentUserId && authorUserId === currentUserId) {
      setIsFollowing((prev) => ({ ...prev, [authorUserId]: false }));
      return;
    }

    // Fetch follow state for current review
    getFirebaseToken().then((token) => {
      if (!token) return;
      userService
        .isFollowingUser(authorUserId, token)
        .then((result) => {
          setIsFollowing((prev) => ({ ...prev, [authorUserId]: !!result.is_following }));
          setFollowState(authorUserId, !!result.is_following);
        })
        .catch((err) => {
          console.error("Error fetching follow state:", err);
          setIsFollowing((prev) => ({ ...prev, [authorUserId]: false }));
        });
    });
  }, [currentIndex, isOpen, user, reviews, setFollowState]);

  // Fetch comment counts only for visible reviews
  useEffect(() => {
    if (!isOpen) return;

    visibleIndices.forEach((idx) => {
      const review = reviews[idx];
      if (review?.id && !fetchedCommentCountsRef.current.has(review.databaseId)) {
        fetchedCommentCountsRef.current.add(review.databaseId);
        reviewService
          .fetchCommentReplies(review.id)
          .then((replies) => {
            setCommentCounts((prev) => ({
              ...prev,
              [review.databaseId]: replies.length,
            }));
          })
          .catch((error) => {
            console.error("Error fetching comment count:", error);
            fetchedCommentCountsRef.current.delete(review.databaseId);
          });
      }
    });
  }, [isOpen, visibleIndices, reviews]);

  // Fetch replies when comments are toggled
  useEffect(() => {
    const review = reviews[currentIndex];
    if (showComments && review?.id) {
      setIsLoadingReplies(true);
      reviewService
        .fetchCommentReplies(review.id)
        .then((fetchedReplies) => {
          setReplies(fetchedReplies);
          setIsLoadingReplies(false);
        })
        .catch((error) => {
          console.error("Error fetching replies:", error);
          setIsLoadingReplies(false);
        });
    }
  }, [showComments, currentIndex, reviews]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Spring animation for vertical scrolling
  const [{ y }, api] = useSpring(() => ({
    y: currentIndex,
    config: {
      tension: 300,
      friction: 30,
    },
  }));

  // Handle like/unlike
  const handleLike = useCallback(
    async (review: GraphQLReview) => {
      if (!user) {
        toast.error("Please sign in to like reviews");
        return;
      }

      const reviewId = review.databaseId;
      const currentLiked = userLiked[reviewId] ?? false;
      const newLikedState = !currentLiked;

      setUserLiked((prev) => ({ ...prev, [reviewId]: newLikedState }));
      setLikesCount((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] ?? 0) + (newLikedState ? 1 : -1),
      }));

      try {
        toast.success(newLikedState ? commentLikedSuccess : commentUnlikedSuccess);
      } catch (error) {
        setUserLiked((prev) => ({ ...prev, [reviewId]: currentLiked }));
        setLikesCount((prev) => ({
          ...prev,
          [reviewId]: (prev[reviewId] ?? 0) + (newLikedState ? -1 : 1),
        }));
        console.error("Like error:", error);
      }
    },
    [user, userLiked]
  );

  // Navigate between images in current review
  const handleImageNavigation = useCallback(
    (direction: "prev" | "next") => {
      const review = reviews[currentIndex];
      if (!review?.reviewImages) return;

      const imageCount = review.reviewImages.length;
      if (imageCount <= 1) return;

      setCurrentImageIndex((prev) => {
        if (direction === "next") {
          return (prev + 1) % imageCount;
        } else {
          return (prev - 1 + imageCount) % imageCount;
        }
      });
    },
    [reviews, currentIndex]
  );

  // Handle follow/unfollow
  const handleFollowClick = useCallback(async () => {
    if (!user) {
      setIsShowSignin(true);
      return;
    }

    const review = reviews[currentIndex];
    if (!review?.author?.node?.databaseId) {
      toast.error(authorIdMissing);
      return;
    }

    const authorUserId = review.author.node.databaseId;
    const currentUserId = user?.id ? parseInt(String(user.id)) : null;

    // Don't allow following yourself
    if (currentUserId && authorUserId === currentUserId) {
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [authorUserId]: true }));
    try {
      const token = await getFirebaseToken();
      if (!token) {
        toast.error("Authentication required");
        setFollowLoading((prev) => ({ ...prev, [authorUserId]: false }));
        return;
      }
      
      let response;
      if (isFollowing[authorUserId]) {
        response = await followService.unfollowUser(authorUserId, token);
      } else {
        response = await followService.followUser(authorUserId, token);
      }

      if (response.status === code.success) {
        const newFollowState = !isFollowing[authorUserId];
        setIsFollowing((prev) => ({ ...prev, [authorUserId]: newFollowState }));
        setFollowState(authorUserId, newFollowState);
        toast.success(newFollowState ? "Following user!" : "Unfollowed user!");
      } else {
        toast.error(response.message || errorOccurred);
      }
    } catch (error) {
      console.error("Follow/unfollow error:", error);
      toast.error(errorOccurred);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [authorUserId]: false }));
    }
  }, [user, currentIndex, reviews, isFollowing, setFollowState, getFirebaseToken]);

  // Navigate between reviews
  const navigateReview = useCallback((direction: "up" | "down") => {
    if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImageIndex(0);
      setShowComments(true); // Keep comments open
      setCommentText("");
      setIsTextExpanded(false); // Reset text expansion on navigation
      api.start({ y: currentIndex - 1, immediate: false });
    } else if (direction === "down" && currentIndex < reviews.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImageIndex(0);
      setShowComments(true); // Keep comments open
      setCommentText("");
      setIsTextExpanded(false); // Reset text expansion on navigation
      api.start({ y: currentIndex + 1, immediate: false });
    }
  }, [currentIndex, reviews.length, api]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isSubmittingComment || cooldown > 0) return;
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (commentText.length > 500) {
      toast.error("Comment is too long (max 500 characters)");
      return;
    }

    const review = reviews[currentIndex];
    if (!review) return;

    setIsSubmittingComment(true);

    // Optimistically add reply at the top
    const userName = user.display_name || user.username || user.email?.split('@')[0] || "You";
    
    // Create proper ISO timestamp for optimistic reply
    const now = new Date();
    const isoDate = now.toISOString();
    
    const optimisticReply: GraphQLReview & { isOptimistic: boolean } = {
      id: `optimistic-${Date.now()}`,
      databaseId: 0,
      reviewMainTitle: "",
      commentLikes: 0,
      userLiked: false,
      reviewStars: "0",
      date: isoDate,
      content: commentText,
      reviewImages: [],
      palates: "",
      userAvatar: getProfileImageUrl(user.profile_image) || DEFAULT_USER_ICON,
      hashtags: [],
      author: {
        name: userName,
        node: {
          id: String(user.id || ""),
          databaseId: user.id ? parseInt(String(user.id)) : 0,
          name: userName,
          avatar: {
            url: getProfileImageUrl(user.profile_image) || DEFAULT_USER_ICON,
          },
        },
      },
      commentedOn: {
        node: {
          databaseId: review.commentedOn?.node?.databaseId || 0,
          title: review.commentedOn?.node?.title || "",
          slug: review.commentedOn?.node?.slug || "",
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
      isOptimistic: true,
    };

    setReplies((prev) => [optimisticReply, ...prev]);
    setCommentText("");

    try {
      const token = await getFirebaseToken();
      if (!token) {
        toast.error("Authentication required");
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        setIsSubmittingComment(false);
        return;
      }
      
      const payload = {
        content: commentText,
        restaurantId: review.commentedOn?.node?.databaseId,
        parent: review.databaseId,
        authorId: user?.id ? parseInt(String(user.id)) : null,
      };
      
      const response = await reviewService.postReview(payload, token);

      // Check for success status codes - HANDLE BOTH NUMERIC AND STRING STATUSES
      const isSuccess = (status: number | string) => {
        // Handle numeric status codes (200-299)
        if (typeof status === 'number') {
          return status >= 200 && status < 300;
        }
        // Handle string statuses (approved, success, etc.)
        if (typeof status === 'string') {
          const successStatuses = ['approved', 'success', 'created', 'ok'];
          return successStatuses.includes(status.toLowerCase());
        }
        return false;
      };

      if (response.status && isSuccess(response.status)) {
        // Replace optimistic reply with actual reply
        const newReply = response.data || response;
        
        // Remove optimistic reply and add the actual reply with a unique key
        setReplies((prev) => {
          const filtered = prev.filter((r) => r.id !== optimisticReply.id);
          return [newReply, ...filtered];
        });
        
        setCommentCounts((prev) => ({
          ...prev,
          [review.databaseId]: (prev[review.databaseId] || 0) + 1,
        }));
        toast.success("Comment posted successfully!");
        setCooldown(3);
      } else {
        // Handle failure
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        toast.error("Failed to post comment. Please try again.");
      }
    } catch (error) {
      setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
      console.error("Comment submission error:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentText, isSubmittingComment, cooldown, user, reviews, currentIndex, getFirebaseToken]);

  // Wheel gesture handler (two-finger scroll or mouse wheel)
  const bindWheel = useWheel(
    ({ delta: [, dy], direction: [, dirY], last }) => {
      // Prevent scrolling when comments are open and scrolling in comments area
      if (showComments) return;

      // Accumulate wheel delta
      wheelAccumulatorRef.current += dy;

      const threshold = 100; // Pixels to trigger navigation

      if (last) {
        if (Math.abs(wheelAccumulatorRef.current) > threshold) {
          if (dirY > 0) {
            // Scroll down = next review
            navigateReview("down");
          } else if (dirY < 0) {
            // Scroll up = previous review
            navigateReview("up");
          }
        }
        wheelAccumulatorRef.current = 0;
      }
    },
    {
      axis: "y",
      preventDefault: true,
    }
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (!showComments) {
            e.preventDefault();
            navigateReview("up");
          }
          break;
        case "ArrowDown":
          if (!showComments) {
            e.preventDefault();
            navigateReview("down");
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleImageNavigation("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          handleImageNavigation("next");
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showComments, navigateReview, handleImageNavigation, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];
  if (!currentReview) return null;

  const reviewImages = currentReview.reviewImages || [];
  const hasMultipleImages = reviewImages.length > 1;
  const currentImage = reviewImages[currentImageIndex]?.sourceUrl || DEFAULT_REVIEW_IMAGE;
  const isLiked = userLiked[currentReview.databaseId] ?? false;
  const likes = likesCount[currentReview.databaseId] ?? 0;
  const commentCount = commentCounts[currentReview.databaseId] ?? 0;
  
  // Text truncation logic
  const MAX_CHARS = 300;
  const reviewContent = stripTags(currentReview.content || "");
  const shouldTruncate = reviewContent.length > MAX_CHARS;
  const displayText = isTextExpanded || !shouldTruncate 
    ? reviewContent 
    : reviewContent.slice(0, MAX_CHARS) + "...";

  return (
    <div className="swipeable-review-viewer-desktop" onClick={onClose}>
      <div
        className="swipeable-review-viewer-desktop__content"
        onClick={(e) => e.stopPropagation()}
        {...bindWheel()}
      >
        {/* Close button */}
        <button
          className="swipeable-review-viewer-desktop__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Left side: Image Gallery */}
        <div className="swipeable-review-viewer-desktop__gallery">
          {/* Previous image button */}
          {hasMultipleImages && currentImageIndex > 0 && (
            <button
              className="swipeable-review-viewer-desktop__image-nav swipeable-review-viewer-desktop__image-nav--prev"
              onClick={() => handleImageNavigation("prev")}
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main image */}
          <div className="swipeable-review-viewer-desktop__image-container">
            <FallbackImage
              src={currentImage}
              alt={stripTags(currentReview.reviewMainTitle || "Review")}
              fill
              className="swipeable-review-viewer-desktop__image"
              priority
            />

            {/* Image counter */}
            {hasMultipleImages && (
              <div className="swipeable-review-viewer-desktop__image-counter">
                {currentImageIndex + 1} / {reviewImages.length}
              </div>
            )}
          </div>

          {/* Next image button */}
          {hasMultipleImages && currentImageIndex < reviewImages.length - 1 && (
            <button
              className="swipeable-review-viewer-desktop__image-nav swipeable-review-viewer-desktop__image-nav--next"
              onClick={() => handleImageNavigation("next")}
              aria-label="Next image"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Scroll hint (only show on first review) */}
          {currentIndex === 0 && (
            <div className="swipeable-review-viewer-desktop__scroll-hint">
              Scroll to see more reviews
            </div>
          )}
        </div>

        {/* Right side: Content & Comments */}
        <div className="swipeable-review-viewer-desktop__sidebar">
          {/* User info header */}
          <div className="swipeable-review-viewer-desktop__header">
            <div className="swipeable-review-viewer-desktop__user-info">
              {currentReview.author?.node?.databaseId ? (
                user?.id &&
                String(user.id) === String(currentReview.author?.node?.databaseId) ? (
                  <Link href={PROFILE}>
                    <FallbackImage
                      src={currentReview.userAvatar || DEFAULT_USER_ICON}
                      alt={currentReview.author?.node?.name || "User"}
                      width={40}
                      height={40}
                      className="swipeable-review-viewer-desktop__avatar swipeable-review-viewer-desktop__avatar--own"
                      type={FallbackImageType.Icon}
                    />
                  </Link>
                ) : user ? (
                  <Link href={generateProfileUrl(currentReview.author?.node?.databaseId, currentReview.author?.node?.username)} prefetch={false}>
                    <FallbackImage
                      src={currentReview.userAvatar || DEFAULT_USER_ICON}
                      alt={currentReview.author?.node?.name || "User"}
                      width={40}
                      height={40}
                      className="swipeable-review-viewer-desktop__avatar"
                      type={FallbackImageType.Icon}
                    />
                  </Link>
                ) : (
                  <FallbackImage
                    src={currentReview.userAvatar || DEFAULT_USER_ICON}
                    alt={currentReview.author?.node?.name || "User"}
                    width={40}
                    height={40}
                    className="swipeable-review-viewer-desktop__avatar"
                    type={FallbackImageType.Icon}
                  />
                )
              ) : (
                <FallbackImage
                  src={currentReview.userAvatar || DEFAULT_USER_ICON}
                  alt="User"
                  width={40}
                  height={40}
                  className="swipeable-review-viewer-desktop__avatar"
                  type={FallbackImageType.Icon}
                />
              )}

              <div className="swipeable-review-viewer-desktop__user-details">
                <div className="swipeable-review-viewer-desktop__user-header">
                  <h3 className="swipeable-review-viewer-desktop__username">
                    {currentReview.author?.node?.name || currentReview.author?.name || "Unknown User"}
                  </h3>
                  {/* Follow/Unfollow Button */}
                  {currentReview.author?.node?.databaseId && 
                   (!user?.id || 
                    parseInt(String(user.id)) !== currentReview.author.node.databaseId) && (
                    <button
                      onClick={handleFollowClick}
                      disabled={followLoading[currentReview.author.node.databaseId] || !currentReview.author.node.databaseId}
                      className={`swipeable-review-viewer-desktop__follow-btn ${
                        isFollowing[currentReview.author.node.databaseId]
                          ? 'swipeable-review-viewer-desktop__follow-btn--following'
                          : 'swipeable-review-viewer-desktop__follow-btn--follow'
                      }`}
                    >
                      {followLoading[currentReview.author.node.databaseId] ? (
                        <span className="animate-pulse">
                          {isFollowing[currentReview.author.node.databaseId] ? "Unfollowing..." : "Following..."}
                        </span>
                      ) : isFollowing[currentReview.author.node.databaseId] ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Review content */}
          <div className="swipeable-review-viewer-desktop__content-area">
            {/* Title */}
            {currentReview.reviewMainTitle && (
              <h2 className="swipeable-review-viewer-desktop__title">
                {capitalizeWords(stripTags(currentReview.reviewMainTitle))}
              </h2>
            )}

            {/* Content */}
            {currentReview.content && (
              <div className="swipeable-review-viewer-desktop__text-container">
                <p className="swipeable-review-viewer-desktop__text">
                  {displayText}
                </p>
                {shouldTruncate && (
                  <button 
                    onClick={() => setIsTextExpanded(!isTextExpanded)}
                    className="swipeable-review-viewer-desktop__see-more"
                  >
                    {isTextExpanded ? "See Less" : "See More"}
                  </button>
                )}
              </div>
            )}

            {/* Rating and Location - Moved below content */}
            <div className="swipeable-review-viewer-desktop__meta">
              {currentReview.reviewStars && (
                <div className="swipeable-review-viewer-desktop__rating">
                  <FiStar className="inline w-3.5 h-3.5 mr-1" />
                  {currentReview.reviewStars}/5
                </div>
              )}
              {currentReview.commentedOn?.node?.title && currentReview.commentedOn?.node?.slug && (
                <Link 
                  href={`/restaurants/${currentReview.commentedOn.node.slug}`}
                  className="swipeable-review-viewer-desktop__restaurant"
                >
                  <FiMapPin className="inline w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  <span className="hover:underline">{currentReview.commentedOn.node.title}</span>
                </Link>
              )}
            </div>

            {/* Action buttons */}
            <div className="swipeable-review-viewer-desktop__actions">
              <button
                className="swipeable-review-viewer-desktop__action-btn"
                onClick={() => handleLike(currentReview)}
              >
                {isLiked ? (
                  <AiFillHeart className="w-6 h-6 text-red-500" />
                ) : (
                  <FiHeart className="w-6 h-6" />
                )}
                <span className="font-medium">{likes}</span>
              </button>

              <button
                className="swipeable-review-viewer-desktop__action-btn"
                onClick={() => setShowComments(!showComments)}
              >
                <FiMessageCircle className="w-6 h-6" />
                <span className="font-medium">{commentCount}</span>
              </button>
            </div>

            {/* Comments section - Always visible */}
            <div className="swipeable-review-viewer-desktop__comments">
              <h3 className="swipeable-review-viewer-desktop__comments-title">
                Comments ({commentCount})
              </h3>
                
                {/* Comment input */}
                {user ? (
                  <div className="swipeable-review-viewer-desktop__comment-input">
                    {isSubmittingComment ? (
                      <div className="flex-1 text-xs text-gray-500 italic">
                        Sending...
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit();
                            }
                          }}
                          placeholder={
                            cooldown > 0
                              ? `Please wait ${cooldown}s before commenting again...`
                              : "Add a comment..."
                          }
                          className="swipeable-review-viewer-desktop__comment-textarea"
                          rows={1}
                          disabled={cooldown > 0}
                        />
                        <button
                          onClick={handleCommentSubmit}
                          disabled={!commentText.trim() || isSubmittingComment || cooldown > 0}
                          className="swipeable-review-viewer-desktop__comment-send-btn"
                          aria-label="Send comment"
                        >
                          <FiSend className={`w-4 h-4 ${commentText.trim() ? 'text-blue-500' : 'text-gray-300'}`} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="swipeable-review-viewer-desktop__comment-login">
                    <p className="text-sm text-gray-500 text-center">
                      <button
                        onClick={() => toast.error("Please sign in to comment")}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Sign in
                      </button>
                      {" "}to add a comment
                    </p>
                  </div>
                )}
              
              {isLoadingReplies ? (
                <div className="swipeable-review-viewer-desktop__comments-skeleton">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="swipeable-review-viewer-desktop__skeleton-item">
                      <div className="swipeable-review-viewer-desktop__skeleton-avatar" />
                      <div className="swipeable-review-viewer-desktop__skeleton-content">
                        <div className="swipeable-review-viewer-desktop__skeleton-line swipeable-review-viewer-desktop__skeleton-line--short" />
                        <div className="swipeable-review-viewer-desktop__skeleton-line swipeable-review-viewer-desktop__skeleton-line--long" />
                        <div className="swipeable-review-viewer-desktop__skeleton-line swipeable-review-viewer-desktop__skeleton-line--medium" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : replies.length > 0 ? (
                  <div className="swipeable-review-viewer-desktop__comments-list">
                    {replies.map((reply, index) => (
                      <ReplyItem
                        key={reply.id || `reply-${index}-${reply.databaseId}`}
                        reply={reply}
                        onLike={() => {}}
                        onProfileClick={() => {}}
                        isLoading={false}
                      />
                    ))}
                  </div>
                ) : (
                <p className="swipeable-review-viewer-desktop__comments-empty">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signin/Signup Modals */}
      <SigninModal
        isOpen={isShowSignin}
        onClose={() => setIsShowSignin(false)}
        onOpenSignup={() => {
          setIsShowSignin(false);
          setIsShowSignup(true);
        }}
      />
      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(false);
          setIsShowSignin(true);
        }}
      />
    </div>
  );
};

export default SwipeableReviewViewerDesktop;

