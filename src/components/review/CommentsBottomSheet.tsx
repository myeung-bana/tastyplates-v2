"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { GraphQLReview } from "@/types/graphql";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { ReviewService } from "@/services/Reviews/reviewService";
import { FiX, FiSend } from "react-icons/fi";
import ReplyItem from "./ReplyItem";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { DEFAULT_USER_ICON } from "@/constants/images";
import { reviewDescriptionDisplayLimit } from "@/constants/validation";
import {
  commentedSuccess,
  errorOccurred,
  maximumCommentReplies,
} from "@/constants/messages";
import { responseStatusCode as code } from "@/constants/response";
import toast from "react-hot-toast";
import "@/styles/components/_comments-bottom-sheet.scss";

interface CommentsBottomSheetProps {
  review: GraphQLReview;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

const reviewService = new ReviewService();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  review,
  isOpen,
  onClose,
  onCommentCountChange,
}) => {
  const { user, firebaseUser } = useFirebaseSession();
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sheetPosition, setSheetPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({});
  const [replyUserLiked, setReplyUserLiked] = useState<Record<string, boolean>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const fetchedReviewIdRef = React.useRef<string | null>(null);
  const onCommentCountChangeRef = React.useRef(onCommentCountChange);
  const userUuidRef = useRef<string | null>(null);

  // Helper function to extract profile image URL from JSONB format
  const getProfileImageUrl = (profileImage: any): string | null => {
    if (!profileImage) return null;
    if (typeof profileImage === 'string') return profileImage;
    if (typeof profileImage === 'object') {
      return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
    }
    return null;
  };

  // Create session object compatible with old NextAuth session structure
  const session = user ? {
    user: {
      id: user.id,
      userId: user.id,
      name: user.display_name || user.username || "Unknown User",
      image: getProfileImageUrl(user.profile_image) || DEFAULT_USER_ICON,
      palates: typeof user.palates === 'string' 
        ? user.palates 
        : Array.isArray(user.palates) 
          ? user.palates.join('|') 
          : "",
    }
  } : null;

  const getUserUuid = useCallback(async (): Promise<string | null> => {
    if (!user?.id || !firebaseUser) return null;

    const userIdStr = String(user.id);
    if (UUID_REGEX.test(userIdStr)) {
      userUuidRef.current = userIdStr;
      return userIdStr;
    }

    if (userUuidRef.current) return userUuidRef.current;

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.id) {
          userUuidRef.current = data.data.id;
          return data.data.id;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }, [user?.id, firebaseUser]);

  // Keep ref updated
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  // Load replies when panel opens - only fetch once per review
  useEffect(() => {
    if (isOpen && review?.id) {
      // Only fetch if this is a different review or we haven't fetched yet
      if (fetchedReviewIdRef.current !== review.id) {
        // Clear previous replies when opening new review
        setReplies([]);
        setIsLoadingReplies(true);
        fetchedReviewIdRef.current = review.id;
        
        (async () => {
          const userUuid = await getUserUuid();
          const fetchedReplies = await reviewService.fetchCommentReplies(review.id, userUuid ?? undefined);

            setReplies(fetchedReplies);
            // Initialize likes state for replies
          const initialLikes: Record<string, number> = {};
          const initialUserLiked: Record<string, boolean> = {};
          fetchedReplies.forEach((reply) => {
            const key = reply.id || String(reply.databaseId);
            initialLikes[key] = reply.commentLikes || 0;
            initialUserLiked[key] = reply.userLiked || false;
          });
          setReplyLikes(initialLikes);
          setReplyUserLiked(initialUserLiked);
          if (onCommentCountChangeRef.current) {
            onCommentCountChangeRef.current(fetchedReplies.length);
          }
        })()
          .catch((error) => {
            console.error("Error fetching replies:", error);
            setReplies([]); // Ensure empty array on error
          })
          .finally(() => setIsLoadingReplies(false));
      }
    } else if (!isOpen) {
      // Clear state when modal closes
      setReplies([]);
      setIsLoadingReplies(false);
      setCommentText("");
      setReplyLikes({});
      setReplyUserLiked({});
      fetchedReviewIdRef.current = null;
    }
  }, [isOpen, review?.id, getUserUuid]);

  // Handle reply like
  const handleReplyLike = useCallback(async (reply: GraphQLReview) => {
    if (!firebaseUser) {
      toast.error("Please sign in to like comments");
      return;
    }

    // Get Firebase ID token for authentication
    const idToken = await firebaseUser.getIdToken();

    const replyId = reply.id || String(reply.databaseId);
    if (!UUID_REGEX.test(String(reply.id || ''))) {
      // Only UUID replies are supported in the new system
      toast.error("Unable to like this comment");
      return;
    }

    const isLiked = replyUserLiked[replyId] ?? false;
    const currentLikes = replyLikes[replyId] ?? 0;

    // Optimistic update
    setReplyUserLiked((prev) => ({ ...prev, [replyId]: !isLiked }));
    setReplyLikes((prev) => ({
      ...prev,
      [replyId]: isLiked ? currentLikes - 1 : currentLikes + 1,
    }));
    setReplyLoading((prev) => ({ ...prev, [replyId]: true }));

    try {
      if (isLiked) {
        const resp = await reviewService.unlikeComment(reply.id, idToken);
        setReplyUserLiked((prev) => ({ ...prev, [replyId]: resp.userLiked }));
        setReplyLikes((prev) => ({ ...prev, [replyId]: resp.likesCount }));
      } else {
        const resp = await reviewService.likeComment(reply.id, idToken);
        setReplyUserLiked((prev) => ({ ...prev, [replyId]: resp.userLiked }));
        setReplyLikes((prev) => ({ ...prev, [replyId]: resp.likesCount }));
      }
      
      // NO SUCCESS TOAST - smooth like modern social media
    } catch (error) {
      // Revert on error
      setReplyUserLiked((prev) => ({ ...prev, [replyId]: isLiked }));
      setReplyLikes((prev) => ({
        ...prev,
        [replyId]: currentLikes,
      }));
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    } finally {
      setReplyLoading((prev) => ({ ...prev, [replyId]: false }));
    }
  }, [firebaseUser, replyUserLiked, replyLikes]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Smooth entrance animation when opening
  useEffect(() => {
    if (isOpen) {
      // Reset states
      setIsClosing(false);
      setIsAnimatingIn(true);
      setIsVisible(true);
      setIsDragging(false);
      
      // Start with sheet below viewport
      setSheetPosition(400);
      
      // Small delay for backdrop to render, then slide up
      requestAnimationFrame(() => {
        setTimeout(() => {
          setSheetPosition(0);
        }, 50); // Small delay for backdrop fade-in
      });
      
      // Mark animation complete
      setTimeout(() => {
        setIsAnimatingIn(false);
      }, 400); // Total entrance animation time
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Touch handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touchY = e.touches[0]?.clientY ?? 0;
    const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? 0;
    const touchOffset = touchY - sheetTop;
    
    // Allow dragging if touch is within the first 60px of the sheet (handle area)
    if (touchOffset <= 60) {
      setIsDragging(true);
      setStartY(touchY);
      e.preventDefault();
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const deltaY = currentY - startY;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setSheetPosition(Math.min(deltaY, 200));
      e.preventDefault();
    }
  }, [isDragging, startY]);

  // Smooth close handler with animation
  const handleSmoothClose = useCallback(() => {
    if (isClosing) return;
    
    setIsClosing(true);
    
    // Slide down animation
    setSheetPosition(400); // Slide below viewport
    
    // Wait for slide animation, then fade out backdrop
    setTimeout(() => {
      setIsVisible(false);
      
      // Finally close after backdrop fade
      setTimeout(() => {
        onClose();
        setIsClosing(false);
        setSheetPosition(0);
      }, 200); // Backdrop fade duration
    }, 300); // Sheet slide duration
  }, [isClosing, onClose]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If swiped down more than 80px, close the modal
    if (sheetPosition > 80) {
      handleSmoothClose();
    } else {
      setSheetPosition(0);
    }
  }, [isDragging, sheetPosition, handleSmoothClose]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isLoading || cooldown > 0) return;
    if (!user || !firebaseUser) {
      toast.error("Please sign in to comment");
      return;
    }

    if (commentText.length > reviewDescriptionDisplayLimit) {
      toast.error(maximumCommentReplies(reviewDescriptionDisplayLimit));
      return;
    }

    setIsLoading(true);
    const userName = user.display_name || user.username || user.email?.split('@')[0] || "You";
    const now = new Date();
    const isoDate = now.toISOString();
    
    const optimisticReply: GraphQLReview = {
      id: `optimistic-${Date.now()}`,
      databaseId: 0,
      reviewMainTitle: "",
      commentLikes: 0,
      userLiked: false,
      reviewStars: "0",
      date: isoDate,
      content: commentText,
      reviewImages: [],
      palates: typeof user.palates === 'string' 
        ? user.palates 
        : Array.isArray(user.palates) 
          ? user.palates.join('|') 
          : "",
      userAvatar: getProfileImageUrl(user.profile_image) || DEFAULT_USER_ICON,
      author: {
        name: userName,
        node: {
          id: String(user.id || ""),
          databaseId: 0, // Firebase users don't have numeric userId
          name: userName,
          avatar: {
            url: getProfileImageUrl(user.profile_image) || DEFAULT_USER_ICON,
          },
        },
      },
      commentedOn: {
        node: {
          databaseId: 0,
          title: "",
          slug: "",
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

    setReplies((prev) => [optimisticReply, ...prev]);
    
    // Initialize like state for optimistic comment
    setReplyLikes((prev) => ({ ...prev, [optimisticReply.id]: 0 }));
    setReplyUserLiked((prev) => ({ ...prev, [optimisticReply.id]: false }));
    
    setCommentText("");

    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      
      const payload = {
        content: optimisticReply.content,
        restaurantId: review.commentedOn?.node?.databaseId,
        parent: review.databaseId,
        authorId: undefined, // Firebase users use UUID, not numeric userId
      };
      const res = await reviewService.postReview(
        payload,
        idToken
      );

      const isSuccess = (status: number | string) => {
        if (typeof status === "number") {
          return status >= 200 && status < 300;
        }
        if (typeof status === "string") {
          const successStatuses = ["approved", "success", "created", "ok"];
          return successStatuses.includes(status.toLowerCase());
        }
        return false;
      };

      if (res.status && isSuccess(res.status)) {
        toast.success(commentedSuccess);
        // Fetch updated replies with userId to get proper like status (now newest first)
        const userUuid = await getUserUuid();
        const updatedReplies = await reviewService.fetchCommentReplies(
          review.id,
          userUuid ?? undefined
        );
        // Replace optimistic reply with fetched replies (newest first from API)
        setReplies(updatedReplies);
        
        // Reinitialize like state with real IDs
        const newLikes: Record<string, number> = {};
        const newUserLiked: Record<string, boolean> = {};
        updatedReplies.forEach((r) => {
          if (r.id) {
            newLikes[r.id] = r.commentLikes ?? 0;
            newUserLiked[r.id] = r.userLiked ?? false;
          }
        });
        setReplyLikes(newLikes);
        setReplyUserLiked(newUserLiked);
        
        if (onCommentCountChangeRef.current) {
          onCommentCountChangeRef.current(updatedReplies.length);
        }
        setCooldown(5);
      } else {
        setReplies((prev) =>
          prev.filter(
            (r) => r.databaseId !== 0 || !r.id.startsWith("optimistic")
          )
        );
        toast.error(errorOccurred);
      }
    } catch (error) {
      console.error("Comment submission error:", error);
      setReplies((prev) =>
        prev.filter(
          (r) => r.databaseId !== 0 || !r.id.startsWith("optimistic")
        )
      );
      toast.error(errorOccurred);
    } finally {
      setIsLoading(false);
    }
  }, [commentText, isLoading, cooldown, user, firebaseUser, review, onCommentCountChange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div className="comments-bottom-sheet">
      {/* Backdrop with fade animation */}
      <div 
        className="comments-bottom-sheet__backdrop"
        style={{
          opacity: isVisible && !isClosing ? 1 : 0,
          transition: 'opacity 300ms ease-in-out'
        }}
        onClick={handleSmoothClose}
      />
      
      {/* Bottom Sheet with smooth slide animation */}
      <div 
        ref={sheetRef}
        className={`comments-bottom-sheet__sheet ${
          isClosing || isAnimatingIn ? 'pointer-events-none' : ''
        }`}
        style={{
          transform: `translateY(${sheetPosition}px)`,
          transition: isDragging 
            ? 'none' 
            : isClosing 
              ? 'transform 300ms cubic-bezier(0.4, 0, 1, 1)' // ease-in for closing
              : 'transform 350ms cubic-bezier(0, 0, 0.2, 1)', // ease-out for opening
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle */}
        <div className="comments-bottom-sheet__handle">
          <div className="comments-bottom-sheet__handle-bar" />
        </div>

        {/* Header */}
        <div className="comments-bottom-sheet__header">
          <h2 className="comments-bottom-sheet__title">
            Comments {isLoadingReplies ? '' : `(${replies.length})`}
          </h2>
          <button
            className="comments-bottom-sheet__close"
            onClick={handleSmoothClose}
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Comment Input */}
        {user ? (
          <div className="comments-bottom-sheet__input-container">
            <div className="comments-bottom-sheet__input-wrapper">
              <input
                type="text"
                className="comments-bottom-sheet__input"
                placeholder={
                  cooldown > 0
                    ? `Please wait ${cooldown}s before commenting again...`
                    : "Add a comment..."
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                maxLength={reviewDescriptionDisplayLimit}
                disabled={cooldown > 0}
              />
              <button
                className="comments-bottom-sheet__send-btn"
                onClick={handleCommentSubmit}
                disabled={!commentText.trim() || isLoading || cooldown > 0}
                aria-label="Send comment"
              >
                <FiSend className={`w-4 h-4 ${commentText.trim() ? 'text-blue-500' : 'text-gray-300'}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className="comments-bottom-sheet__login-prompt">
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

        {/* Replies List */}
        <div className="comments-bottom-sheet__content">
          {isLoadingReplies ? (
            <ReplySkeleton count={3} />
          ) : replies.length > 0 ? (
            replies.map((reply, index) => (
              <ReplyItem
                key={reply.id || `reply-${index}-${reply.databaseId}`}
                reply={{
                  ...reply,
                  commentLikes: replyLikes[reply.id || String(reply.databaseId)] ?? reply.commentLikes ?? 0,
                  userLiked: replyUserLiked[reply.id || String(reply.databaseId)] ?? reply.userLiked ?? false,
                }}
                onLike={handleReplyLike}
                onProfileClick={() => {}}
                isLoading={replyLoading[reply.id || String(reply.databaseId)] ?? false}
              />
            ))
          ) : (
            <div className="comments-bottom-sheet__empty">
              <div className="comments-bottom-sheet__empty-content">
                <p className="comments-bottom-sheet__empty-text">
                  No Comments Yet
                </p>
                <p className="comments-bottom-sheet__empty-subtext">
                  Be the first to comment!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsBottomSheet;

