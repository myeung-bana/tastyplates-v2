"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle } from "react-icons/fi";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import CommentsBottomSheet from "../review/CommentsBottomSheet";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { DEFAULT_USER_ICON } from "@/constants/images";
import { capitalizeWords, stripTags } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { useIsMobile } from "@/utils/deviceUtils";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { transformReviewV2ToGraphQLReview } from "@/utils/reviewTransformers";
import "@/styles/components/_restaurant-comments-quick-view.scss";

interface RestaurantCommentsQuickViewProps {
  restaurantUuid: string;
  restaurantDatabaseId?: number;
  restaurantName: string;
  isOpen: boolean;
  onClose: () => void;
}

const RestaurantCommentsQuickView: React.FC<RestaurantCommentsQuickViewProps> = ({
  restaurantUuid,
  restaurantDatabaseId,
  restaurantName,
  isOpen,
  onClose,
}) => {
  const { user, firebaseUser } = useFirebaseSession();
  const isMobile = useIsMobile();
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GraphQLReview | null>(null);
  const [sheetPosition, setSheetPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Load reviews when opened
  useEffect(() => {
    if (isOpen && restaurantUuid && reviews.length === 0) {
      loadReviews();
    }
  }, [isOpen, restaurantUuid]);

  const loadReviews = async () => {
    if (!restaurantUuid) return;
    setLoading(true);
    try {
      const response = await reviewV2Service.getReviewsByRestaurant(restaurantUuid, {
        limit: 10,
        offset: 0,
      });
      const transformed = (response.reviews || []).map((r) =>
        transformReviewV2ToGraphQLReview(r, restaurantDatabaseId)
      );
      setReviews(transformed);
      setOffset(10);
      setHasNextPage(!!response.hasMore);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage || !restaurantUuid) return;
    setLoadingMore(true);
    try {
      const response = await reviewV2Service.getReviewsByRestaurant(restaurantUuid, {
        limit: 10,
        offset,
      });
      const transformed = (response.reviews || []).map((r) =>
        transformReviewV2ToGraphQLReview(r, restaurantDatabaseId)
      );
      setReviews((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const uniqueNew = transformed.filter((r) => !existingIds.has(r.id));
        return [...prev, ...uniqueNew];
      });
      setOffset((prev) => prev + 10);
      setHasNextPage(!!response.hasMore);
    } catch (error) {
      console.error("Error loading more reviews:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNextPage, restaurantUuid, offset, restaurantDatabaseId]);

  const handleCommentClick = useCallback((review: GraphQLReview) => {
    setSelectedReview(review);
    setShowComments(true);
  }, []);

  const formatRelativeTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return formatDate(dateString);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch {
      return formatDate(dateString);
    }
  }, []);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple close calls
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setReviews([]);
      setShowComments(false);
      setSelectedReview(null);
      setSheetPosition(0);
      setOffset(0);
      setHasNextPage(false);
    }, 300); // Match CSS transition duration
  }, [onClose, isClosing]);

  // Bottom sheet drag handlers (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isClosing) return;
    setIsDragging(true);
    setStartY(e.touches[0]?.clientY ?? 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging || isClosing) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const diff = currentY - startY;
    if (diff > 0) {
      setSheetPosition(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || isClosing) return;
    if (sheetPosition > 100) {
      handleClose();
    } else {
      setSheetPosition(0);
    }
    setIsDragging(false);
  };

  // Reset closing state when opened
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Trigger slide-in animation after component mounts
  useEffect(() => {
    if (isOpen && !isClosing) {
      // Small delay to ensure initial off-screen state is rendered first
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
    }
    return undefined;
  }, [isOpen, isClosing]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen && !isClosing) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
    return undefined;
  }, [isOpen, isClosing]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div className={`restaurant-comments-quick-view ${isMobile ? 'restaurant-comments-quick-view--mobile' : 'restaurant-comments-quick-view--desktop'} ${isClosing ? 'restaurant-comments-quick-view--closing' : ''}`}>
        {/* Backdrop */}
        <div 
          className="restaurant-comments-quick-view__backdrop" 
          onClick={handleClose}
        />
        
        {/* Bottom Sheet (Mobile) / Side Panel (Desktop) */}
        <div 
          ref={sheetRef}
          className={`restaurant-comments-quick-view__sheet ${isMobile ? 'restaurant-comments-quick-view__sheet--mobile' : 'restaurant-comments-quick-view__sheet--desktop'} ${isClosing ? 'restaurant-comments-quick-view__sheet--closing' : ''} ${isAnimatingIn ? 'restaurant-comments-quick-view__sheet--animating-in' : ''}`}
          style={isMobile && !isClosing ? {
            transform: `translateY(${sheetPosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          } : {}}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Swipe Handle - Only show on mobile */}
          {isMobile && (
            <div className="restaurant-comments-quick-view__handle">
              <div className="restaurant-comments-quick-view__handle-bar" />
            </div>
          )}

          {/* Header */}
          <div className="restaurant-comments-quick-view__header">
            <h2 className="restaurant-comments-quick-view__title font-neusans">
              Reviews & Comments
            </h2>
            <button
              className="restaurant-comments-quick-view__close"
              onClick={handleClose}
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="restaurant-comments-quick-view__content">
            {loading ? (
              <div className="restaurant-comments-quick-view__loading">
                <ReplySkeleton count={3} />
              </div>
            ) : reviews.length === 0 ? (
              <div className="restaurant-comments-quick-view__empty">
                <FiMessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : (
              <div className="restaurant-comments-quick-view__list">
                {reviews.map((review) => (
                  <div
                    key={review.id || review.databaseId}
                    className="restaurant-comments-quick-view__item"
                    onClick={() => handleCommentClick(review)}
                  >
                    <FallbackImage
                      src={review.userAvatar || DEFAULT_USER_ICON}
                      alt={review.author?.node?.name || "User"}
                      width={40}
                      height={40}
                      className="restaurant-comments-quick-view__avatar"
                      type={FallbackImageType.Icon}
                    />
                    <div className="restaurant-comments-quick-view__item-content">
                      <div className="restaurant-comments-quick-view__item-header">
                        <span className="restaurant-comments-quick-view__username">
                          {review.author?.node?.name || "Unknown"}
                        </span>
                        {review.date && (
                          <span className="restaurant-comments-quick-view__date">
                            {formatRelativeTime(review.date)}
                          </span>
                        )}
                      </div>
                      {review.reviewMainTitle && (
                        <h3 className="restaurant-comments-quick-view__title-text">
                          {capitalizeWords(stripTags(review.reviewMainTitle))}
                        </h3>
                      )}
                      {review.content && (
                        <p className="restaurant-comments-quick-view__text">
                          {stripTags(review.content).slice(0, 100)}
                          {stripTags(review.content).length > 100 && '...'}
                        </p>
                      )}
                      <div className="restaurant-comments-quick-view__actions">
                        <button className="restaurant-comments-quick-view__view-comments">
                          <FiMessageCircle className="w-4 h-4" />
                          <span>View comments</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {hasNextPage && (
                  <button
                    className="restaurant-comments-quick-view__load-more"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load more reviews'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Bottom Sheet */}
      {showComments && selectedReview && (
        <CommentsBottomSheet
          review={selectedReview}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedReview(null);
          }}
        />
      )}
    </>
  );
};

export default RestaurantCommentsQuickView;

