"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { GraphQLReview } from "@/types/graphql";
import { useSession } from "next-auth/react";
import { ReviewService } from "@/services/Reviews/reviewService";
import { FiX } from "react-icons/fi";
import ReplyItem from "./ReplyItem";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { DEFAULT_USER_ICON } from "@/constants/images";
import { reviewDescriptionDisplayLimit } from "@/constants/validation";
import {
  commentedSuccess,
  errorOccurred,
  maximumCommentReplies,
} from "@/constants/messages";
import toast from "react-hot-toast";
import "@/styles/components/_comments-slide-in.scss";

interface CommentsSlideInProps {
  review: GraphQLReview;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

const reviewService = new ReviewService();

const CommentsSlideIn: React.FC<CommentsSlideInProps> = ({
  review,
  isOpen,
  onClose,
  onCommentCountChange,
}) => {
  const { data: session } = useSession();
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Load replies when panel opens
  useEffect(() => {
    if (isOpen && review?.id) {
      setIsLoadingReplies(true);
      reviewService
        .fetchCommentReplies(review.id)
        .then((fetchedReplies) => {
          setReplies(fetchedReplies);
          // Notify parent of comment count change
          if (onCommentCountChange) {
            onCommentCountChange(fetchedReplies.length);
          }
        })
        .catch((error) => console.error("Error fetching replies:", error))
        .finally(() => setIsLoadingReplies(false));
    }
  }, [isOpen, review?.id]); // Removed onCommentCountChange from deps to prevent re-renders

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Spring animation for slide-in
  const [{ y }, api] = useSpring(() => ({
    y: 100,
    config: { tension: 300, friction: 30 },
  }));

  // Animate panel open/close
  useEffect(() => {
    if (isOpen) {
      // Reset and animate in
      api.start({ 
        y: 0,
        immediate: false,
      });
    } else {
      // Animate out
      api.start({ 
        y: 100,
        immediate: false,
      });
    }
  }, [isOpen, api]);

  // Gesture handler for swipe down to close (only on handle area)
  const handleRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const bind = useDrag(
    ({ movement: [, my], direction: [, dy], velocity, canceled, first, last, event }) => {
      // Only allow gestures that start on the handle area
      if (first && event.target) {
        const target = event.target as HTMLElement;
        const isOnHandle = handleRef.current?.contains(target) || 
                          target.closest('.comments-slide-in__handle') ||
                          target.closest('.comments-slide-in__header');
        if (!isOnHandle) {
          return;
        }
      }

      if (my < 0) return; // Only allow downward swipes

      const threshold = 80; // Reduced threshold for easier closing
      const velocityThreshold = 0.3; // Lower velocity threshold

      // Update position during drag
      if (!first && !last && !canceled) {
        // Calculate percentage based on panel height
        const panelHeight = panelRef.current?.offsetHeight || window.innerHeight * 0.85;
        const percentage = Math.max(0, Math.min(100, (my / panelHeight) * 100));
        api.start({
          y: percentage,
          immediate: true,
        });
      }

      // On release, check if we should close
      if (last && !canceled) {
        const shouldClose =
          my > threshold || (dy > 0 && Math.abs(velocity[1]) > velocityThreshold);

        if (shouldClose) {
          onClose();
        } else {
          // Snap back to open position
          api.start({ y: 0, immediate: false });
        }
      }
    },
    {
      axis: "y",
      filterTaps: true,
    }
  );

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isLoading || cooldown > 0) return;
    if (!session?.user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (commentText.length > reviewDescriptionDisplayLimit) {
      toast.error(maximumCommentReplies(reviewDescriptionDisplayLimit));
      return;
    }

    setIsLoading(true);
    const optimisticReply: GraphQLReview = {
      id: `optimistic-${Date.now()}`,
      databaseId: 0,
      reviewMainTitle: "",
      commentLikes: 0,
      userLiked: false,
      reviewStars: "0",
      date: new Date().toISOString(),
      content: commentText,
      reviewImages: [],
      palates: session.user.palates || "",
      userAvatar: session.user.image || DEFAULT_USER_ICON,
      author: {
        name: session.user.name || "Unknown User",
        node: {
          id: String(session.user.id || ""),
          databaseId: session.user.userId
            ? parseInt(String(session.user.userId))
            : 0,
          name: session.user.name || "Unknown User",
          avatar: {
            url: session.user.image || DEFAULT_USER_ICON,
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
    setCommentText("");

    try {
      const payload = {
        content: optimisticReply.content,
        restaurantId: review.commentedOn?.node?.databaseId,
        parent: review.databaseId,
        authorId: session?.user?.userId,
      };
      const res = await reviewService.postReview(
        payload,
        session?.accessToken ?? ""
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

      if (isSuccess(res.status)) {
        toast.success(commentedSuccess);
        const updatedReplies = await reviewService.fetchCommentReplies(
          review.id
        );
        setReplies((prev) => {
          const withoutOptimistic = prev.filter(
            (r) => r.databaseId !== 0 || !r.id.startsWith("optimistic")
          );
          const merged = updatedReplies.concat(
            withoutOptimistic.filter(
              (local) =>
                !updatedReplies.some((server) => server.id === local.id)
            )
          );
          return merged;
        });
        // Update comment count in parent
        if (onCommentCountChange) {
          onCommentCountChange(updatedReplies.length);
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
  }, [commentText, isLoading, cooldown, session, review]);

  if (!isOpen) return null;

  return (
    <div 
      className="comments-slide-in__backdrop" 
      onClick={(e) => {
        // Only close if clicking directly on backdrop, not on panel
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <animated.div
        ref={panelRef}
        className="comments-slide-in__panel"
        style={{
          transform: y.to((val) => `translateY(${val}%)`),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle - with gesture binding */}
        <div 
          ref={handleRef}
          className="comments-slide-in__handle"
          {...bind()}
        >
          <div className="comments-slide-in__handle-bar" />
        </div>

        {/* Header - also draggable */}
        <div 
          className="comments-slide-in__header"
          {...bind()}
        >
          <h2 className="comments-slide-in__title">Comments</h2>
          <button
            className="comments-slide-in__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Replies List */}
        <div className="comments-slide-in__content">
          {isLoadingReplies ? (
            <ReplySkeleton count={3} />
          ) : replies.length > 0 ? (
            replies.map((reply, index) => (
              <ReplyItem
                key={reply.id || index}
                reply={reply}
                onLike={() => {}}
                onProfileClick={() => {}}
                isLoading={false}
              />
            ))
          ) : (
            <div className="comments-slide-in__empty">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        {session?.user && (
          <div className="comments-slide-in__input-container">
            <textarea
              className="comments-slide-in__input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              maxLength={reviewDescriptionDisplayLimit}
            />
            <button
              className="comments-slide-in__submit"
              onClick={handleCommentSubmit}
              disabled={!commentText.trim() || isLoading || cooldown > 0}
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        )}
      </animated.div>
    </div>
  );
};

export default CommentsSlideIn;

