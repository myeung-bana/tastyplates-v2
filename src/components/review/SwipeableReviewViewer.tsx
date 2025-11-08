"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useDrag, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ReviewService } from "@/services/Reviews/reviewService";
import { capitalizeWords, stripTags, generateProfileUrl } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { commentLikedSuccess, commentUnlikedSuccess } from "@/constants/messages";
import toast from "react-hot-toast";
import CommentsSlideIn from "@/components/review/CommentsSlideIn";
import "@/styles/components/_swipeable-review-viewer.scss";

interface SwipeableReviewViewerProps {
  reviews: GraphQLReview[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const reviewService = new ReviewService();

const SwipeableReviewViewer: React.FC<SwipeableReviewViewerProps> = ({
  reviews,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedCommentCountsRef = useRef<Set<number>>(new Set());
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // ✅ FIX 1: Initialize viewport height immediately to prevent glitch
  const [viewportHeight, setViewportHeight] = useState(() => {
    // Get initial height synchronously
    if (typeof window !== 'undefined') {
      return window.visualViewport?.height ?? window.innerHeight;
    }
    return 0;
  });
  
  useEffect(() => {
    const updateHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(height);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  // ✅ FIX 2: Opening animation - start from current scale when opening
  const [{ scale, opacity }, apiOpen] = useSpring(() => ({
    scale: 1, // Start at full scale to prevent flash
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (isOpen) {
      // Animate from 0.95 to 1 when opening
      apiOpen.start({ from: { scale: 0.95, opacity: 0 }, to: { scale: 1, opacity: 1 } });
    } else {
      // Reset to hidden state
      apiOpen.set({ scale: 0.95, opacity: 0 });
    }
  }, [isOpen, apiOpen]);

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
      const imageUrl = review.reviewImages?.[0]?.sourceUrl;
      if (imageUrl && !preloadedImagesRef.current.has(imageUrl)) {
        const img = new Image();
        img.src = imageUrl;
        preloadedImagesRef.current.add(imageUrl);
      }
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

  // Reset index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

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

  // Faster spring configuration
  const [{ y }, api] = useSpring(() => ({
    y: currentIndex,
    config: {
      tension: 400,
      friction: 35,
    },
  }));

  // Handle like/unlike
  const handleLike = useCallback(
    async (review: GraphQLReview) => {
      if (!session?.user) {
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
    [session, userLiked]
  );

  // ✅ FIX 3: Improved gesture handler with proper close threshold
  const handleGesture = useCallback(
    (deltaY: number, velocity: number, isActive: boolean) => {
      if (showComments || !viewportHeight) return;

      // ✅ FIX 4: Increased thresholds
      const navigationThreshold = viewportHeight * 0.3; // 30% for navigation
      const closeThreshold = viewportHeight * 0.4; // 40% for closing (more intentional)
      const velocityThreshold = 0.8; // Increased for more deliberate swipes

      if (isActive) {
        // During drag: show preview
        const offset = -deltaY / viewportHeight;
        
        // ✅ ADDED: Limit preview range to prevent over-scrolling
        const clampedOffset = Math.max(-1.5, Math.min(1.5, offset));
        
        api.start({
          y: currentIndex + clampedOffset,
          immediate: true,
        });
      } else {
        // On release: decide navigation
        
        // ✅ FIX 5: Only close from first post with STRONG downward swipe
        if (currentIndex === 0 && deltaY > closeThreshold && velocity > velocityThreshold) {
          // Strong pull down from first post = close
          onClose();
          return;
        }
        
        // Regular navigation logic
        const shouldNavigate = 
          Math.abs(deltaY) > navigationThreshold || 
          Math.abs(velocity) > velocityThreshold;
        
        if (shouldNavigate) {
          const direction = deltaY < 0 ? 1 : -1; // Negative = swipe up = next
          const newIndex = Math.max(0, Math.min(reviews.length - 1, currentIndex + direction));
          
          if (newIndex !== currentIndex) {
            // Navigate to new post
            setCurrentIndex(newIndex);
            api.start({ y: newIndex, immediate: false });
          } else {
            // ✅ Can't navigate further - just snap back (no close)
            api.start({ y: currentIndex, immediate: false });
          }
        } else {
          // Below threshold - snap back to current
          api.start({ y: currentIndex, immediate: false });
        }
      }
    },
    [showComments, currentIndex, reviews.length, viewportHeight, api, onClose]
  );

  // Gesture handlers
  const bindDrag = useDrag(
    ({ movement: [, my], velocity, active, last }) => {
      handleGesture(my, velocity[1], active && !last);
    },
    { 
      axis: "y", 
      filterTaps: true,
      // ✅ ADDED: Prevent default to stop page scrolling
      preventDefault: true,
    }
  );

  const bindWheel = useWheel(
    ({ delta: [, dy], velocity, active, last }) => {
      handleGesture(dy * 2, velocity[1], active && !last);
    },
    { 
      axis: "y",
      // ✅ ADDED: Prevent default to stop page scrolling
      preventDefault: true,
    }
  );

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // ✅ ADDED: Prevent iOS bounce scrolling
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      
      return () => {
        document.body.style.overflow = "unset";
        document.body.style.position = "unset";
        document.body.style.width = "unset";
      };
    }
    return undefined;
  }, [isOpen]);

  // ✅ FIX 6: Always render structure, just hide with CSS
  if (!isOpen || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];
  if (!currentReview) return null;

  const isLiked = userLiked[currentReview.databaseId] ?? false;
  const likes = likesCount[currentReview.databaseId] ?? 0;
  const commentCount = commentCounts[currentReview.databaseId] ?? 0;

  return (
    <>
      <animated.div
        className="swipeable-review-viewer"
        ref={containerRef}
        style={{
          opacity,
          transform: scale.to((s) => `scale(${s})`),
          pointerEvents: showComments ? "none" : "auto",
          // ✅ FIX 7: Use fallback height to prevent glitch
          height: viewportHeight || '100vh',
        }}
      >
        {/* Close Button - Only closes on click */}
        <button
          className="swipeable-review-viewer__close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Only render visible reviews */}
        <animated.div
          className="swipeable-review-viewer__posts-container"
          style={{
            transform: y.to((value) => `translate3d(0, ${-value * 100}%, 0)`),
            height: (viewportHeight || window.innerHeight) * reviews.length,
          }}
          {...(!showComments ? { ...bindDrag(), ...bindWheel() } : {})}
        >
          {visibleIndices.map((index) => {
            const review = reviews[index];
            if (!review) return null;
            
            const images = review.reviewImages || [];
            const mainImage = images[0]?.sourceUrl || DEFAULT_IMAGE;
            const reviewIsLiked = userLiked[review.databaseId] ?? false;
            const reviewLikes = likesCount[review.databaseId] ?? 0;
            const reviewCommentCount = commentCounts[review.databaseId] ?? 0;

            return (
              <div
                key={review.id}
                className="swipeable-review-viewer__post"
                style={{
                  height: viewportHeight || '100vh',
                  transform: `translate3d(0, ${index * 100}%, 0)`,
                  willChange: 'transform',
                }}
              >
                {/* Image Section */}
                <div className="swipeable-review-viewer__image-container">
                  <FallbackImage
                    src={mainImage}
                    alt={stripTags(review.reviewMainTitle || "Review")}
                    fill
                    className="swipeable-review-viewer__image"
                    priority={index === currentIndex}
                  />
                </div>

                {/* Content Overlay */}
                <div className="swipeable-review-viewer__overlay">
                  {/* User Info */}
                  <div className="swipeable-review-viewer__user-info">
                    {review.author?.node?.databaseId ? (
                      session?.user?.id &&
                      String(session.user.id) === String(review.author?.node?.databaseId) ? (
                        <Link href={PROFILE}>
                          <FallbackImage
                            src={review.userAvatar || DEFAULT_USER_ICON}
                            alt={review.author?.node?.name || "User"}
                            width={40}
                            height={40}
                            className="swipeable-review-viewer__avatar"
                            type={FallbackImageType.Icon}
                          />
                        </Link>
                      ) : session ? (
                        <Link href={generateProfileUrl(review.author?.node?.databaseId)} prefetch={false}>
                          <FallbackImage
                            src={review.userAvatar || DEFAULT_USER_ICON}
                            alt={review.author?.node?.name || "User"}
                            width={40}
                            height={40}
                            className="swipeable-review-viewer__avatar"
                            type={FallbackImageType.Icon}
                          />
                        </Link>
                      ) : (
                        <FallbackImage
                          src={review.userAvatar || DEFAULT_USER_ICON}
                          alt={review.author?.node?.name || "User"}
                          width={40}
                          height={40}
                          className="swipeable-review-viewer__avatar"
                          type={FallbackImageType.Icon}
                        />
                      )
                    ) : (
                      <FallbackImage
                        src={review.userAvatar || DEFAULT_USER_ICON}
                        alt={review.author?.node?.name || "User"}
                        width={40}
                        height={40}
                        className="swipeable-review-viewer__avatar"
                        type={FallbackImageType.Icon}
                      />
                    )}

                    <div className="swipeable-review-viewer__user-details">
                      <h3 className="swipeable-review-viewer__username">
                        {review.author?.node?.name || review.author?.name || "Unknown User"}
                      </h3>
                      {review.reviewStars && (
                        <div className="swipeable-review-viewer__rating">⭐ {review.reviewStars}/5</div>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="swipeable-review-viewer__review-content">
                    {review.reviewMainTitle && (
                      <h2 className="swipeable-review-viewer__title">
                        {capitalizeWords(stripTags(review.reviewMainTitle))}
                      </h2>
                    )}
                    {review.content && (
                      <p className="swipeable-review-viewer__text">{stripTags(review.content)}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="swipeable-review-viewer__actions">
                    <button className="swipeable-review-viewer__action-btn" onClick={() => handleLike(review)}>
                      {reviewIsLiked ? (
                        <AiFillHeart className="w-6 h-6 text-red-500" />
                      ) : (
                        <FiHeart className="w-6 h-6" />
                      )}
                      <span>{reviewLikes}</span>
                    </button>

                    <button
                      className="swipeable-review-viewer__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index !== currentIndex) setCurrentIndex(index);
                        setShowComments(true);
                      }}
                    >
                      <FiMessageCircle className="w-6 h-6" />
                      <span>{reviewCommentCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </animated.div>
      </animated.div>

      {showComments && (
        <CommentsSlideIn
          review={currentReview}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCommentCountChange={(count) => {
            setCommentCounts((prev) => ({
              ...prev,
              [currentReview.databaseId]: count,
            }));
          }}
        />
      )}
    </>
  );
};

export default SwipeableReviewViewer;
