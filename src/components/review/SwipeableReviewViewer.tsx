"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart, FiMapPin, FiStar } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { ReviewService } from "@/services/Reviews/reviewService";
import { capitalizeWords, stripTags, generateProfileUrl, formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { commentLikedSuccess, commentUnlikedSuccess } from "@/constants/messages";
import toast from "react-hot-toast";
import CommentsBottomSheet from "@/components/review/CommentsBottomSheet";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import PalateTags from "../ui/PalateTags/PalateTags";
import "@/styles/components/_swipeable-review-viewer.scss";

interface SwipeableReviewViewerProps {
  reviews: GraphQLReview[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onLoadMore?: () => Promise<{ reviews: GraphQLReview[]; hasNextPage: boolean }>;
  hasNextPage?: boolean;
}

const reviewService = new ReviewService();

const SwipeableReviewViewer: React.FC<SwipeableReviewViewerProps> = ({
  reviews: initialReviews,
  initialIndex,
  isOpen,
  onClose,
  onLoadMore,
  hasNextPage = false,
}) => {
  const { user, firebaseUser } = useFirebaseSession();
  const [reviews, setReviews] = useState<GraphQLReview[]>(initialReviews);
  const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [firstComments, setFirstComments] = useState<Record<string, GraphQLReview | null>>({});
  const [loadingFirstComments, setLoadingFirstComments] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GraphQLReview | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Record<number, HTMLDivElement>>({});

  // Update reviews when initialReviews changes
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Initialize likes and comment counts
  useEffect(() => {
    if (reviews.length > 0) {
      const initialLiked: Record<number, boolean> = {};
      const initialCounts: Record<number, number> = {};
      
      reviews.forEach((review) => {
        initialLiked[review.databaseId] = review.userLiked ?? false;
        initialCounts[review.databaseId] = 0; // Will be updated when we fetch comment counts
      });
      
      setUserLiked(initialLiked);
      setLikesCount((prev) => {
        const updated = { ...prev };
        reviews.forEach((review) => {
          updated[review.databaseId] = review.commentLikes ?? 0;
        });
        return updated;
      });
    }
  }, [reviews]);

  // Helper function to fetch first comment for a review
  const fetchFirstCommentForReview = useCallback(async (reviewId: string, databaseId: number) => {
    if (!reviewId || loadingFirstComments[reviewId]) return;
    
    setLoadingFirstComments((prev) => ({ ...prev, [reviewId]: true }));
    
    try {
      const replies = await reviewService.fetchCommentReplies(reviewId);
      const firstComment = replies && replies.length > 0 ? replies[0] : null;
      setFirstComments((prev) => ({ ...prev, [reviewId]: firstComment ?? null }));
      
      // Update comment count
      if (replies) {
        setCommentCounts((prev) => ({
          ...prev,
          [databaseId]: replies.length,
        }));
      }
    } catch (error: any) {
      // Check if it's a JSON parsing error
      const errorMessage = error?.message || '';
      const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('<!DOCTYPE') || errorMessage.includes('Unexpected token');
      
      if (isJsonError) {
        console.error(`Error fetching first comment for review ${reviewId}: API returned non-JSON response (likely HTML error page)`);
      } else {
        console.error(`Error fetching first comment for review ${reviewId}:`, error);
      }
      
      // Set to null to indicate no comments (prevents retrying)
      setFirstComments((prev) => ({ ...prev, [reviewId]: null }));
    } finally {
      setLoadingFirstComments((prev) => ({ ...prev, [reviewId]: false }));
    }
  }, [loadingFirstComments]);

  // Helper function to format relative time
  const formatRelativeTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    
    try {
      let date: Date;
      
      if (dateString.includes('T') && dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('T')) {
        date = new Date(dateString + 'Z');
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          if (!year || !month || !day) return formatDate(dateString);
          const validDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(validDate.getTime())) {
            const relativeTime = formatDistanceToNow(validDate, { addSuffix: true });
            return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
          }
        }
        return formatDate(dateString);
      }
      
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch {
      return formatDate(dateString);
    }
  }, []);

  // Scroll to initial index on open
  useEffect(() => {
    if (isOpen && scrollContainerRef.current && initialIndex >= 0 && initialIndex < reviews.length) {
      const targetPost = postRefs.current[initialIndex];
      if (targetPost) {
        setTimeout(() => {
          targetPost.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isOpen, initialIndex, reviews.length]);

  // Fetch first comment for initial post and adjacent posts immediately
  useEffect(() => {
    if (isOpen && initialIndex >= 0 && initialIndex < reviews.length) {
      const initialReview = reviews[initialIndex];
      const prevReview = reviews[initialIndex - 1];
      const nextReview = reviews[initialIndex + 1];
      
      // Fetch for initial post (only if not already fetched or confirmed no comments)
      if (initialReview?.id && firstComments[initialReview.id] === undefined && !loadingFirstComments[initialReview.id]) {
        fetchFirstCommentForReview(initialReview.id, initialReview.databaseId);
      }
      
      // Pre-fetch for adjacent posts (only if not already fetched or confirmed no comments)
      [prevReview, nextReview].forEach(review => {
        if (review?.id && firstComments[review.id] === undefined && !loadingFirstComments[review.id]) {
          fetchFirstCommentForReview(review.id, review.databaseId);
        }
      });
    }
  }, [isOpen, initialIndex, reviews, firstComments, loadingFirstComments, fetchFirstCommentForReview]);

  // Use Intersection Observer to detect visible posts and lazy load comments
  useEffect(() => {
    if (!isOpen) return;
    
    const observers = new Map<string, IntersectionObserver>();
    
    reviews.forEach((review, index) => {
      const postElement = postRefs.current[index];
      if (!postElement || !review.id) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Post is visible, fetch first comment if not already fetched or confirmed no comments
            // Only fetch if firstComments[review.id] is undefined (not fetched yet)
            // Skip if it's null (confirmed no comments) or already has a comment
            const currentFirstComment = firstComments[review.id!];
            if (currentFirstComment === undefined && !loadingFirstComments[review.id!]) {
              fetchFirstCommentForReview(review.id!, review.databaseId);
            }
          }
        },
        { threshold: 0.5, rootMargin: '100px' } // Start loading 100px before visible
      );
      
      observer.observe(postElement);
      observers.set(review.id, observer);
    });
    
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [isOpen, reviews, firstComments, loadingFirstComments, fetchFirstCommentForReview]);

  // Infinite scroll
  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingMore || !onLoadMore || !hasNextPage) return;
    
    setLoadingMore(true);
    try {
      const { reviews: newReviews } = await onLoadMore();
      setReviews((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const uniqueNew = newReviews.filter((r) => !existingIds.has(r.id));
        return [...prev, ...uniqueNew];
      });
    } catch (error) {
      console.error("Error loading more reviews:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, onLoadMore, hasNextPage]);

  const { observerRef } = useInfiniteScroll({
    loadMore,
    hasNextPage: hasNextPage && !!onLoadMore,
    loading: loadingMore,
  });

  // Handle like
  const handleLike = useCallback(async (review: GraphQLReview): Promise<void> => {
    if (!firebaseUser) {
      toast.error("Please sign in to like reviews");
      return;
    }

    // Get Firebase ID token for authentication
    const idToken = await firebaseUser.getIdToken();

    const isLiked = userLiked[review.databaseId] ?? false;
    const currentLikes = likesCount[review.databaseId] ?? 0;

    // Optimistic update
    setUserLiked((prev) => ({ ...prev, [review.databaseId]: !isLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [review.databaseId]: isLiked ? currentLikes - 1 : currentLikes + 1,
    }));

    try {
      if (isLiked) {
        await reviewService.unlikeComment(review.databaseId, idToken);
        toast.success(commentUnlikedSuccess);
      } else {
        await reviewService.likeComment(review.databaseId, idToken);
        toast.success(commentLikedSuccess);
      }
    } catch (error: any) {
      // Revert on error
      setUserLiked((prev) => ({ ...prev, [review.databaseId]: isLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [review.databaseId]: currentLikes,
      }));
      
      // Check if it's a JSON parsing error
      const errorMessage = error?.message || '';
      const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('<!DOCTYPE') || errorMessage.includes('Unexpected token');
      
      if (isJsonError) {
        console.error("Error toggling like: API returned non-JSON response (likely HTML error page)", error);
        toast.error("Failed to update like. Please try again.");
      } else {
        console.error("Error toggling like:", error);
        toast.error("Failed to update like");
      }
    }
  }, [firebaseUser, userLiked, likesCount]);

  // Handle comment click
  const handleCommentClick = useCallback((review: GraphQLReview) => {
    setSelectedReview(review);
    setShowComments(true);
  }, []);

  // Prevent body scroll when modal is open and hide TopNav on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Add class to hide TopNav on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Add class immediately for fade transition
        document.body.classList.add("swipeable-review-viewer-open");
        // Set display: none after fade completes (300ms)
        const timeoutId = setTimeout(() => {
          const topBar = document.querySelector(".mobile-top-bar") as HTMLElement;
          if (topBar) {
            topBar.style.display = "none";
          }
        }, 300);
        
        return () => {
          document.body.style.overflow = "unset";
          // Restore display first (but keep it invisible)
          const topBar = document.querySelector(".mobile-top-bar") as HTMLElement;
          if (topBar) {
            topBar.style.display = "";
          }
          // Remove class after a brief delay to allow display to be restored
          // This ensures the fade-in transition works
          setTimeout(() => {
            document.body.classList.remove("swipeable-review-viewer-open");
          }, 10);
          clearTimeout(timeoutId);
        };
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen || reviews.length === 0) return null;

  return (
    <>
      <div className="swipeable-review-viewer" ref={scrollContainerRef}>
        {/* Close Button */}
        <button
          className="swipeable-review-viewer__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Scroll Container */}
        <div className="swipeable-review-viewer__scroll-container">
          {reviews.map((review, index) => {
            const images = review.reviewImages || [];
            const mainImage = images[0]?.sourceUrl || DEFAULT_REVIEW_IMAGE;
            const reviewIsLiked = userLiked[review.databaseId] ?? false;
            const reviewLikes = likesCount[review.databaseId] ?? 0;
            const reviewCommentCount = commentCounts[review.databaseId] ?? 0;
            const firstComment = firstComments[review.id || ""] || null;
            const isLoadingComment = loadingFirstComments[review.id || ""] || false;

            return (
              <div
                key={review.id || `review-${index}`}
                ref={(el) => {
                  if (el) postRefs.current[index] = el;
                }}
                className="swipeable-review-viewer__post"
              >
                {/* Image Section - 60-70% */}
                <div className="swipeable-review-viewer__image-section">
                  <FallbackImage
                    src={mainImage}
                    alt={stripTags(review.reviewMainTitle || "Review")}
                    fill
                    className="swipeable-review-viewer__image"
                    priority={index < 3}
                  />
                </div>

                {/* Content Section - 30-40% */}
                <div className="swipeable-review-viewer__content-section">
                  {/* User Info */}
                  <div className="swipeable-review-viewer__user-info">
                    {review.author?.node?.databaseId ? (
                      user?.id &&
                      String(user.id) === String(review.author?.node?.databaseId) ? (
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
                      ) : user ? (
                        <Link href={generateProfileUrl(review.author?.node?.databaseId, review.author?.node?.username)} prefetch={false}>
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
                      <div className="swipeable-review-viewer__user-header">
                        <div className="swipeable-review-viewer__user-info-left">
                          <h3 className="swipeable-review-viewer__username">
                            {review.author?.node?.name || review.author?.name || "Unknown User"}
                          </h3>
                          {review.commentedOn?.node?.title && (
                            <Link
                              href={`/restaurants/${review.commentedOn.node.slug}`}
                              className="swipeable-review-viewer__restaurant-link"
                            >
                              <FiMapPin className="w-3 h-3" />
                              <span>{review.commentedOn.node.title}</span>
                            </Link>
                          )}
                        </div>
                        {review.date && (
                          <span className="swipeable-review-viewer__timestamp">
                            {formatRelativeTime(review.date)}
                          </span>
                        )}
                      </div>
                      {/* Palate Tags */}
                      {(() => {
                        const palateNames = review.palates 
                          ? (typeof review.palates === 'string' 
                              ? review.palates.split('|').map(p => p.trim()).filter(Boolean)
                              : [])
                          : [];
                        return palateNames.length > 0 ? (
                          <div className="swipeable-review-viewer__palates">
                            <PalateTags palateNames={palateNames} maxTags={2} />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="swipeable-review-viewer__review-content">
                    {review.reviewMainTitle && (
                      <h2 className="swipeable-review-viewer__title">
                        {capitalizeWords(stripTags(review.reviewMainTitle))}
                      </h2>
                    )}
                    {review.content && (() => {
                      const MAX_CHARS = 300;
                      const reviewContent = stripTags(review.content);
                      const shouldTruncate = reviewContent.length > MAX_CHARS;
                      const isExpanded = isTextExpanded[review.databaseId] || false;
                      const displayText = isExpanded || !shouldTruncate 
                        ? reviewContent 
                        : reviewContent.slice(0, MAX_CHARS) + "...";
                      
                      return (
                        <div className="swipeable-review-viewer__text-container">
                          <p className="swipeable-review-viewer__text">
                            {displayText}
                          </p>
                          {shouldTruncate && (
                            <button
                              className="swipeable-review-viewer__see-more"
                              onClick={() => setIsTextExpanded(prev => ({
                                ...prev,
                                [review.databaseId]: !isExpanded
                              }))}
                            >
                              {isExpanded ? "See Less" : "See More"}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Rating */}
                    {review.reviewStars && (
                      <div className="swipeable-review-viewer__rating">
                        <FiStar className="w-3 h-3" />
                        <span>{review.reviewStars}/5</span>
                      </div>
                    )}
                  </div>

                  {/* First Comment Preview */}
                  {(() => {
                    const reviewId = review.id || "";
                    const isLoading = loadingFirstComments[reviewId] || false;
                    const firstComment = firstComments[reviewId];
                    const reviewCommentCount = commentCounts[review.databaseId] ?? 0;
                    
                    // Hide section entirely if we've confirmed there are no comments
                    // firstComment === null means we fetched and confirmed no comments exist
                    if (firstComment === null && !isLoading) {
                      return null;
                    }
                    
                    // Show skeleton only while loading and haven't confirmed no comments
                    if (isLoading && firstComment === undefined) {
                      return (
                        <div className="swipeable-review-viewer__comment-preview">
                          <ReplySkeleton count={1} />
                        </div>
                      );
                    }
                    
                    // Show first comment if it exists
                    if (firstComment) {
                      return (
                        <div className="swipeable-review-viewer__comment-preview">
                          <div className="swipeable-review-viewer__comment-item">
                            <FallbackImage
                              src={firstComment.userAvatar || DEFAULT_USER_ICON}
                              alt={firstComment.author?.node?.name || "User"}
                              width={24}
                              height={24}
                              className="swipeable-review-viewer__comment-avatar"
                              type={FallbackImageType.Icon}
                            />
                            <div className="swipeable-review-viewer__comment-content">
                              <span className="swipeable-review-viewer__comment-author">
                                {firstComment.author?.node?.name || firstComment.author?.name || "Unknown"}
                              </span>
                              <span className="swipeable-review-viewer__comment-text">
                                {stripTags(firstComment.content || "")}
                              </span>
                            </div>
                          </div>
                          {reviewCommentCount > 1 && (
                            <button
                              className="swipeable-review-viewer__view-all-comments"
                              onClick={() => handleCommentClick(review)}
                            >
                              View all {reviewCommentCount} comments
                            </button>
                          )}
                        </div>
                      );
                    }
                    
                    // Don't render anything if we haven't fetched yet (firstComment is undefined)
                    return null;
                  })()}

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
                      onClick={() => handleCommentClick(review)}
                    >
                      <FiMessageCircle className="w-6 h-6" />
                      <span>{reviewCommentCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll Trigger & Loading Skeleton */}
          {onLoadMore && hasNextPage && (
            <div ref={observerRef} className="swipeable-review-viewer__load-more">
              {loadingMore && (
                <div className="swipeable-review-viewer__skeleton-post">
                  <div className="swipeable-review-viewer__skeleton-image" />
                  <div className="swipeable-review-viewer__skeleton-content">
                    <div className="swipeable-review-viewer__skeleton-avatar" />
                    <div className="swipeable-review-viewer__skeleton-text" />
                    <div className="swipeable-review-viewer__skeleton-text" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && selectedReview && (
        <CommentsBottomSheet
          review={selectedReview}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedReview(null);
          }}
          onCommentCountChange={(count) => {
            setCommentCounts((prev) => ({
              ...prev,
              [selectedReview.databaseId]: count,
            }));
            // Refresh first comment if count changed
            if (count > 0 && !firstComments[selectedReview.id || ""]) {
              reviewService
                .fetchCommentReplies(selectedReview.id || "")
                .then((replies) => {
                  if (replies && replies.length > 0) {
                    setFirstComments((prev) => ({
                      ...prev,
                      [selectedReview.id || ""]: replies[0] ?? null,
                    }));
                  }
                })
                .catch((error: any) => {
                  // Check if it's a JSON parsing error
                  const errorMessage = error?.message || '';
                  const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('<!DOCTYPE') || errorMessage.includes('Unexpected token');
                  
                  if (isJsonError) {
                    console.error('Error refreshing first comment: API returned non-JSON response (likely HTML error page)', error);
                  } else {
                    console.error('Error refreshing first comment:', error);
                  }
                });
            }
          }}
        />
      )}
    </>
  );
};

export default SwipeableReviewViewer;
