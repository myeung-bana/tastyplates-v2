"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDrag, useWheel } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Image from "next/image";
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
  const viewportHeightRef = useRef<number>(0);
  const fetchedCommentCountsRef = useRef<Set<number>>(new Set());

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
      viewportHeightRef.current = window.innerHeight;
    }
  }, [isOpen, initialIndex]);

  // Fetch comment counts for all reviews
  useEffect(() => {
    if (isOpen && reviews.length > 0) {
      reviews.forEach((review) => {
        if (review.id && !fetchedCommentCountsRef.current.has(review.databaseId)) {
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
              // Remove from set on error so it can be retried
              fetchedCommentCountsRef.current.delete(review.databaseId);
            });
        }
      });
    }
  }, [isOpen, reviews]);

  // Spring animation for vertical movement and index transitions
  // y represents the target position (index * 100%) plus gesture offset
  // Using faster config for snappier transitions
  const [{ y }, api] = useSpring(() => ({
    y: currentIndex * 100, // Start at current index position (in percentage)
    config: {
      tension: 300, // Higher tension = faster response
      friction: 25, // Lower friction = less damping, faster movement
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

      // Optimistic update
      setUserLiked((prev) => ({ ...prev, [reviewId]: newLikedState }));
      setLikesCount((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] ?? 0) + (newLikedState ? 1 : -1),
      }));

      try {
        // TODO: Implement actual like API call
        toast.success(newLikedState ? commentLikedSuccess : commentUnlikedSuccess);
      } catch (error) {
        // Revert on error
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

  // Navigate to next/previous review
  const navigateToReview = useCallback(
    (direction: "up" | "down") => {
      if (direction === "up" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (direction === "down" && currentIndex < reviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [currentIndex, reviews.length]
  );

  // Shared gesture handler logic for drag (touch/mouse)
  const handleDragGesture = useCallback(
    (deltaY: number, direction: number, velocity: number, isActive: boolean, isEnd: boolean) => {
      // Disable gestures when comments panel is open
      if (showComments) {
        return;
      }

      const threshold = 100; // Minimum distance to trigger navigation
      const velocityThreshold = 0.5; // Minimum velocity for quick swipes
      const viewportHeight = viewportHeightRef.current || window.innerHeight;

      // Update spring position during gesture (show preview of next/previous)
      if (isActive && !isEnd) {
        // Calculate base position from current index
        const baseY = currentIndex * 100;
        // Convert pixel movement to percentage offset
        // Negative deltaY (swipe up) should show next post (positive offset)
        // Positive deltaY (swipe down) should show previous post (negative offset)
        const gestureOffset = -(deltaY / viewportHeight) * 100;
        
        // Clamp to prevent over-scrolling beyond adjacent posts
        const maxOffset = 100; // Can't scroll more than one post
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, gestureOffset));
        
        api.start({
          y: baseY + clampedOffset,
          immediate: true,
        });
      }

      // On release, check if we should navigate or snap back
      if (isEnd) {
        const shouldNavigate =
          Math.abs(deltaY) > threshold || Math.abs(velocity) > velocityThreshold;

        if (shouldNavigate) {
          if (direction > 0 && currentIndex > 0) {
            // Swipe down - go to previous
            const newIndex = currentIndex - 1;
            navigateToReview("up");
            // Animate to new position
            api.start({
              y: newIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          } else if (direction < 0 && currentIndex < reviews.length - 1) {
            // Swipe up - go to next
            const newIndex = currentIndex + 1;
            navigateToReview("down");
            // Animate to new position
            api.start({
              y: newIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          } else if (deltaY > 150 && currentIndex === 0) {
            // Swipe down from first review - close viewer
            onClose();
            return;
          } else {
            // Snap back to current position if not navigating
            api.start({
              y: currentIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          }
        } else {
          // Snap back to current position if threshold not met
          api.start({
            y: currentIndex * 100,
            immediate: false,
            config: {
              tension: 300,
              friction: 25,
            },
          });
        }
      }
    },
    [showComments, currentIndex, reviews.length, navigateToReview, onClose, api]
  );

  // Wheel gesture handler with linear, fast scrolling
  const wheelAccumulatorRef = useRef<number>(0);
  const handleWheelGesture = useCallback(
    (deltaY: number, direction: number, velocity: number, isActive: boolean, isEnd: boolean) => {
      // Disable gestures when comments panel is open
      if (showComments) {
        return;
      }

      const viewportHeight = viewportHeightRef.current || window.innerHeight;
      const wheelSensitivity = 0.5; // Make scrolling more sensitive (lower = more sensitive)
      const threshold = 50; // Lower threshold for faster navigation

      // Accumulate wheel delta for smoother, linear scrolling
      if (isActive) {
        wheelAccumulatorRef.current += deltaY * wheelSensitivity;
        
        // Calculate base position from current index
        const baseY = currentIndex * 100;
        // Convert accumulated movement to percentage offset (linear)
        // Negative deltaY (scroll up) should show next post (positive offset)
        // Positive deltaY (scroll down) should show previous post (negative offset)
        const gestureOffset = -(wheelAccumulatorRef.current / viewportHeight) * 100;
        
        // Clamp to prevent over-scrolling beyond adjacent posts
        const maxOffset = 100;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, gestureOffset));
        
        api.start({
          y: baseY + clampedOffset,
          immediate: true,
        });
      }

      // On wheel end, check if we should navigate
      if (isEnd) {
        const accumulatedDelta = Math.abs(wheelAccumulatorRef.current);
        const shouldNavigate = accumulatedDelta > threshold || Math.abs(velocity) > 0.3;

        if (shouldNavigate) {
          if (direction > 0 && currentIndex > 0) {
            // Scroll down - go to previous
            const newIndex = currentIndex - 1;
            navigateToReview("up");
            api.start({
              y: newIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          } else if (direction < 0 && currentIndex < reviews.length - 1) {
            // Scroll up - go to next
            const newIndex = currentIndex + 1;
            navigateToReview("down");
            api.start({
              y: newIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          } else if (wheelAccumulatorRef.current > 150 && currentIndex === 0) {
            // Scroll down from first review - close viewer
            onClose();
            wheelAccumulatorRef.current = 0;
            return;
          } else {
            // Snap back to current position
            api.start({
              y: currentIndex * 100,
              immediate: false,
              config: {
                tension: 300,
                friction: 25,
              },
            });
          }
        } else {
          // Snap back to current position if threshold not met
          api.start({
            y: currentIndex * 100,
            immediate: false,
            config: {
              tension: 300,
              friction: 25,
            },
          });
        }

        // Reset accumulator
        wheelAccumulatorRef.current = 0;
      }
    },
    [showComments, currentIndex, reviews.length, navigateToReview, onClose, api]
  );

  // Gesture handler for touch/mouse drag (Reels-style)
  const bindDrag = useDrag(
    ({ movement: [, my], direction: [, dy], velocity, canceled, first, last }) => {
      if (canceled) return;
      handleDragGesture(my, dy, velocity[1], !first && !last, last);
    },
    {
      axis: "y",
      filterTaps: true,
    }
  );

  // Gesture handler for trackpad wheel scrolling (linear and fast)
  const bindWheel = useWheel(
    ({ delta: [, dy], direction: [, direction], velocity, first, last }) => {
      handleWheelGesture(dy, direction, velocity[1], !first && !last, last);
    },
    {
      axis: "y",
    }
  );

  // Reset position when index changes (synchronize spring with currentIndex)
  useEffect(() => {
    api.start({
      y: currentIndex * 100,
      immediate: false,
      config: {
        tension: 300,
        friction: 25,
      },
    });
  }, [currentIndex, api]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
    return undefined; // Explicit return for when isOpen is false
  }, [isOpen]);

  if (!isOpen || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];
  if (!currentReview) return null;

  const isLiked = userLiked[currentReview.databaseId] ?? false;
  const likes = likesCount[currentReview.databaseId] ?? 0;
  const commentCount = commentCounts[currentReview.databaseId] ?? 0;

  return (
    <>
      <div 
        className="swipeable-review-viewer" 
        ref={containerRef}
        style={{
          pointerEvents: showComments ? 'none' : 'auto', // Disable viewer when comments open
        }}
      >
        {/* Close Button */}
        <button
          className="swipeable-review-viewer__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Posts Container - Reels-style vertical scrolling */}
        <animated.div
          className="swipeable-review-viewer__posts-container"
          style={{
            transform: y.to((value) => {
              // value is the target position (index * 100%) plus gesture offset
              return `translateY(-${value}%)`;
            }),
            pointerEvents: showComments ? 'none' : 'auto',
          }}
          {...(!showComments ? { ...bindDrag(), ...bindWheel() } : {})}
        >
          {reviews.map((review, index) => {
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
                  top: `${index * 100}%`,
                }}
              >
                {/* Image Section */}
                <div className="swipeable-review-viewer__image-container">
                  <FallbackImage
                    src={mainImage}
                    alt={stripTags(review.reviewMainTitle || "Review")}
                    width={400}
                    height={600}
                    className="swipeable-review-viewer__image"
                  />
                </div>

                {/* Content Overlay */}
                <div className="swipeable-review-viewer__overlay">
                  {/* User Info */}
                  <div className="swipeable-review-viewer__user-info">
                    {review.author?.node?.databaseId ? (
                      session?.user?.id &&
                      String(session.user.id) ===
                        String(review.author?.node?.databaseId) ? (
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
                        <Link
                          href={generateProfileUrl(review.author?.node?.databaseId)}
                          prefetch={false}
                        >
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
                        {review.author?.node?.name ||
                          review.author?.name ||
                          "Unknown User"}
                      </h3>
                      {review.reviewStars && (
                        <div className="swipeable-review-viewer__rating">
                          ⭐ {review.reviewStars}/5
                        </div>
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
                      <p className="swipeable-review-viewer__text">
                        {stripTags(review.content)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="swipeable-review-viewer__actions">
                    <button
                      className="swipeable-review-viewer__action-btn"
                      onClick={() => handleLike(review)}
                    >
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
                        e.stopPropagation(); // Prevent gesture from triggering
                        // Only update index if different from current
                        if (index !== currentIndex) {
                          setCurrentIndex(index);
                        }
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
      </div>

      {/* Comments Slide-In - Rendered outside viewer container to avoid z-index conflicts */}
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

