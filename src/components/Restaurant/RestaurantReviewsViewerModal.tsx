"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart, FiStar } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ReviewService } from "@/services/Reviews/reviewService";
import { capitalizeWords, stripTags, generateProfileUrl, formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { commentLikedSuccess, commentUnlikedSuccess } from "@/constants/messages";
import toast from "react-hot-toast";
import CommentsBottomSheet from "../review/CommentsBottomSheet";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import PalateTags from "../ui/PalateTags/PalateTags";
import "@/styles/components/_restaurant-reviews-viewer-modal.scss";

interface RestaurantReviewsViewerModalProps {
  reviews: GraphQLReview[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  restaurantId?: number;
  onLoadMore?: () => Promise<{ reviews: GraphQLReview[]; hasNextPage: boolean }>;
  hasNextPage?: boolean;
}

const reviewService = new ReviewService();

const RestaurantReviewsViewerModal: React.FC<RestaurantReviewsViewerModalProps> = ({
  reviews: initialReviews,
  isOpen,
  onClose,
  initialIndex = 0,
  onLoadMore,
  hasNextPage = false,
}) => {
  const { data: session } = useSession();
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

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    if (reviews.length > 0) {
      const initialLiked: Record<number, boolean> = {};
      reviews.forEach((review) => {
        initialLiked[review.databaseId] = review.userLiked ?? false;
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

  const fetchFirstCommentForReview = useCallback(async (reviewId: string, databaseId: number) => {
    if (!reviewId || loadingFirstComments[reviewId]) return;
    setLoadingFirstComments((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const replies = await reviewService.fetchCommentReplies(reviewId);
      const firstComment = replies && replies.length > 0 ? replies[0] : null;
      setFirstComments((prev) => ({ ...prev, [reviewId]: firstComment ?? null }));
      if (replies) {
        setCommentCounts((prev) => ({ ...prev, [databaseId]: replies.length }));
      }
    } catch (error) {
      console.error(`Error fetching first comment for review ${reviewId}:`, error);
      setFirstComments((prev) => ({ ...prev, [reviewId]: null }));
    } finally {
      setLoadingFirstComments((prev) => ({ ...prev, [reviewId]: false }));
    }
  }, [loadingFirstComments]);

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

  useEffect(() => {
    if (isOpen && initialIndex >= 0 && initialIndex < reviews.length) {
      const initialReview = reviews[initialIndex];
      const prevReview = reviews[initialIndex - 1];
      const nextReview = reviews[initialIndex + 1];
      if (initialReview?.id && firstComments[initialReview.id] === undefined && !loadingFirstComments[initialReview.id]) {
        fetchFirstCommentForReview(initialReview.id, initialReview.databaseId);
      }
      [prevReview, nextReview].forEach(review => {
        if (review?.id && firstComments[review.id] === undefined && !loadingFirstComments[review.id]) {
          fetchFirstCommentForReview(review.id, review.databaseId);
        }
      });
    }
  }, [isOpen, initialIndex, reviews, firstComments, loadingFirstComments, fetchFirstCommentForReview]);

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
            const currentFirstComment = firstComments[review.id!];
            if (currentFirstComment === undefined && !loadingFirstComments[review.id!]) {
              fetchFirstCommentForReview(review.id!, review.databaseId);
            }
          }
        },
        { threshold: 0.5, rootMargin: '100px' }
      );
      observer.observe(postElement);
      observers.set(review.id, observer);
    });
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [isOpen, reviews, firstComments, loadingFirstComments, fetchFirstCommentForReview]);

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

  const handleLike = useCallback(async (review: GraphQLReview): Promise<void> => {
    if (!session?.accessToken) {
      toast.error("Please sign in to like reviews");
      return;
    }
    const isLiked = userLiked[review.databaseId] ?? false;
    const currentLikes = likesCount[review.databaseId] ?? 0;
    setUserLiked((prev) => ({ ...prev, [review.databaseId]: !isLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [review.databaseId]: isLiked ? currentLikes - 1 : currentLikes + 1,
    }));
    try {
      if (isLiked) {
        await reviewService.unlikeComment(review.databaseId, session.accessToken);
        toast.success(commentUnlikedSuccess);
      } else {
        await reviewService.likeComment(review.databaseId, session.accessToken);
        toast.success(commentLikedSuccess);
      }
    } catch (error) {
      setUserLiked((prev) => ({ ...prev, [review.databaseId]: isLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [review.databaseId]: currentLikes,
      }));
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  }, [session, userLiked, likesCount]);

  const handleCommentClick = useCallback((review: GraphQLReview) => {
    setSelectedReview(review);
    setShowComments(true);
  }, []);

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

  return (
    <>
      <div className="restaurant-reviews-viewer-modal" ref={scrollContainerRef}>
        <button
          className="restaurant-reviews-viewer-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>
        <div className="restaurant-reviews-viewer-modal__scroll-container">
          {reviews.map((review, index) => {
            const images = review.reviewImages || [];
            const mainImage = images[0]?.sourceUrl || DEFAULT_REVIEW_IMAGE;
            const reviewIsLiked = userLiked[review.databaseId] ?? false;
            const reviewLikes = likesCount[review.databaseId] ?? 0;
            const reviewCommentCount = commentCounts[review.databaseId] ?? 0;
            const firstComment = firstComments[review.id || ""] || null;
            const palateNames = review.palates 
              ? (typeof review.palates === 'string' 
                  ? review.palates.split('|').map(p => p.trim()).filter(Boolean)
                  : [])
              : [];

            return (
              <div
                key={review.id || `review-${index}`}
                ref={(el) => {
                  if (el) postRefs.current[index] = el;
                }}
                className="restaurant-reviews-viewer-modal__post"
              >
                <div className="restaurant-reviews-viewer-modal__image-section">
                  <FallbackImage
                    src={mainImage}
                    alt={stripTags(review.reviewMainTitle || "Review")}
                    fill
                    className="restaurant-reviews-viewer-modal__image"
                    priority={index < 3}
                  />
                </div>
                <div className="restaurant-reviews-viewer-modal__content-section">
                  <div className="restaurant-reviews-viewer-modal__user-info">
                    {review.author?.node?.databaseId ? (
                      session?.user?.id &&
                      String(session.user.id) === String(review.author?.node?.databaseId) ? (
                        <Link href={PROFILE}>
                          <FallbackImage
                            src={review.userAvatar || DEFAULT_USER_ICON}
                            alt={review.author?.node?.name || "User"}
                            width={40}
                            height={40}
                            className="restaurant-reviews-viewer-modal__avatar"
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
                            className="restaurant-reviews-viewer-modal__avatar"
                            type={FallbackImageType.Icon}
                          />
                        </Link>
                      ) : (
                        <FallbackImage
                          src={review.userAvatar || DEFAULT_USER_ICON}
                          alt={review.author?.node?.name || "User"}
                          width={40}
                          height={40}
                          className="restaurant-reviews-viewer-modal__avatar"
                          type={FallbackImageType.Icon}
                        />
                      )
                    ) : (
                      <FallbackImage
                        src={review.userAvatar || DEFAULT_USER_ICON}
                        alt={review.author?.node?.name || "User"}
                        width={40}
                        height={40}
                        className="restaurant-reviews-viewer-modal__avatar"
                        type={FallbackImageType.Icon}
                      />
                    )}
                    <div className="restaurant-reviews-viewer-modal__user-details">
                      <div className="restaurant-reviews-viewer-modal__user-header">
                        <div className="restaurant-reviews-viewer-modal__user-info-left">
                          <h3 className="restaurant-reviews-viewer-modal__username">
                            {review.author?.node?.name || review.author?.name || "Unknown User"}
                          </h3>
                        </div>
                        {review.date && (
                          <span className="restaurant-reviews-viewer-modal__timestamp">
                            {formatRelativeTime(review.date)}
                          </span>
                        )}
                      </div>
                      {palateNames.length > 0 && (
                        <div className="restaurant-reviews-viewer-modal__palates">
                          <PalateTags palateNames={palateNames} maxTags={2} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="restaurant-reviews-viewer-modal__review-content">
                    {review.reviewMainTitle && (
                      <h2 className="restaurant-reviews-viewer-modal__title">
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
                        <div className="restaurant-reviews-viewer-modal__text-container">
                          <p className="restaurant-reviews-viewer-modal__text">
                            {displayText}
                          </p>
                          {shouldTruncate && (
                            <button
                              className="restaurant-reviews-viewer-modal__see-more"
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
                    {review.reviewStars && (
                      <div className="restaurant-reviews-viewer-modal__rating">
                        <FiStar className="w-3 h-3" />
                        <span>{review.reviewStars}/5</span>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const reviewId = review.id || "";
                    const isLoading = loadingFirstComments[reviewId] || false;
                    const firstComment = firstComments[reviewId];
                    const reviewCommentCount = commentCounts[review.databaseId] ?? 0;
                    if (firstComment === null && !isLoading) {
                      return null;
                    }
                    if (isLoading && firstComment === undefined) {
                      return (
                        <div className="restaurant-reviews-viewer-modal__comment-preview">
                          <ReplySkeleton count={1} />
                        </div>
                      );
                    }
                    if (firstComment) {
                      return (
                        <div className="restaurant-reviews-viewer-modal__comment-preview">
                          <div className="restaurant-reviews-viewer-modal__comment-item">
                            <FallbackImage
                              src={firstComment.userAvatar || DEFAULT_USER_ICON}
                              alt={firstComment.author?.node?.name || "User"}
                              width={24}
                              height={24}
                              className="restaurant-reviews-viewer-modal__comment-avatar"
                              type={FallbackImageType.Icon}
                            />
                            <div className="restaurant-reviews-viewer-modal__comment-content">
                              <span className="restaurant-reviews-viewer-modal__comment-author">
                                {firstComment.author?.node?.name || firstComment.author?.name || "Unknown"}
                              </span>
                              <span className="restaurant-reviews-viewer-modal__comment-text">
                                {stripTags(firstComment.content || "")}
                              </span>
                            </div>
                          </div>
                          {reviewCommentCount > 1 && (
                            <button
                              className="restaurant-reviews-viewer-modal__view-all-comments"
                              onClick={() => handleCommentClick(review)}
                            >
                              View all {reviewCommentCount} comments
                            </button>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="restaurant-reviews-viewer-modal__actions">
                    <button
                      className="restaurant-reviews-viewer-modal__action-btn"
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
                      className="restaurant-reviews-viewer-modal__action-btn"
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
          {onLoadMore && hasNextPage && (
            <div ref={observerRef} className="restaurant-reviews-viewer-modal__load-more">
              {loadingMore && (
                <div className="restaurant-reviews-viewer-modal__skeleton-post">
                  <div className="restaurant-reviews-viewer-modal__skeleton-image" />
                  <div className="restaurant-reviews-viewer-modal__skeleton-content">
                    <div className="restaurant-reviews-viewer-modal__skeleton-avatar" />
                    <div className="restaurant-reviews-viewer-modal__skeleton-text" />
                    <div className="restaurant-reviews-viewer-modal__skeleton-text" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
                .catch(console.error);
            }
          }}
        />
      )}
    </>
  );
};

export default RestaurantReviewsViewerModal;
