"use client";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { GraphQLReview } from "@/types/graphql";
import { FiX, FiMessageCircle, FiHeart, FiMapPin, FiStar } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import Link from "next/link";
import { useNhostSession } from "@/hooks/useNhostSession";
import { nhost } from "@/lib/nhost";
import { ReviewService } from "@/services/Reviews/reviewService";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { capitalizeWords, stripTags, generateProfileUrl, formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import toast from "react-hot-toast";
import CommentsBottomSheet from "@/components/review/CommentsBottomSheet";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import PalateTags from "../ui/PalateTags/PalateTags";
import { useFollowContext } from "../FollowContext";
import { FollowButton } from "@/components/ui/follow-button";
import SigninModal from "../auth/SigninModal";
import SignupModal from "../auth/SignupModal";
import ReviewEngagementAuthModal from "./ReviewEngagementAuthModal";
import { getEngagementAuthorFromReview } from "@/utils/reviewEngagementAuthor";
import "@/styles/components/_review-screen.scss";

interface ReviewScreenProps {
  reviews: GraphQLReview[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onLoadMore?: () => Promise<{ reviews: GraphQLReview[]; hasNextPage: boolean }>;
  hasNextPage?: boolean;
  onActiveIndexChange?: (index: number) => void;
}

const reviewService = new ReviewService();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ReviewScreen: React.FC<ReviewScreenProps> = ({
  reviews: initialReviews,
  initialIndex,
  isOpen,
  onClose,
  onLoadMore,
  hasNextPage = false,
  onActiveIndexChange,
}) => {
  const { user, nhostUser } = useNhostSession();
  const [reviews, setReviews] = useState<GraphQLReview[]>(initialReviews);
  const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [firstComments, setFirstComments] = useState<Record<string, GraphQLReview | null>>({});
  const [loadingFirstComments, setLoadingFirstComments] = useState<Record<string, boolean>>({});
  // Comment like state (similar to review likes)
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({});
  const [replyUserLiked, setReplyUserLiked] = useState<Record<string, boolean>>({});
  const [replyLikeLoading, setReplyLikeLoading] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GraphQLReview | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Record<number, HTMLDivElement>>({});
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const activeIndexRef = useRef<number>(initialIndex);
  const userUuidRef = useRef<string | null>(null);
  const likeStatusCacheRef = useRef<Record<string, { isLiked: boolean; count: number; timestamp: number }>>({});
  const CACHE_TTL = 30000; // 30s
  /** Pending like toggles: prevents double-tap and shows disabled state */
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(new Set());
  const { setFollowState, getFollowState } = useFollowContext();
  const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
  const followInFlightRef = useRef(false);
  const followCheckCacheRef = useRef<Record<number, { isFollowing: boolean; ts: number }>>({});
  const FOLLOW_CACHE_MS = 5 * 60 * 1000;
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);
  const [engagementAuthor, setEngagementAuthor] = useState<
    ReturnType<typeof getEngagementAuthorFromReview> | null
  >(null);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);

  // Used to re-bind observers when the *windowed* review list changes (not just its length).
  const reviewsKey = useMemo(
    () => reviews.map((r) => r.id || String(r.databaseId)).join("|"),
    [reviews]
  );

  // Get Nhost user UUID directly
  const getUserUuid = useCallback(async (): Promise<string | null> => {
    if (!user?.user_id) return null;
    return user.user_id;
  }, [user?.user_id]);

  // Get Nhost access token
  const getNhostToken = useCallback(async (): Promise<string | null> => {
    const session = nhost.auth.getSession();
    return session?.accessToken || null;
  }, []);

  // Update reviews when initialReviews changes
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Initialize likes and seed comment counts from the feed payload
  useEffect(() => {
    if (reviews.length > 0) {
      const initialLiked: Record<number, boolean> = {};
      const initialLikesCount: Record<number, number> = {};
      const initialCommentCounts: Record<number, number> = {};

      // Pre-seed the like status cache so the background sync skips the first API call
      const userIdForSeed = user?.user_id && UUID_REGEX.test(String(user.user_id)) ? String(user.user_id) : null;

      reviews.forEach((review) => {
        initialLiked[review.databaseId] = review.userLiked ?? false;
        initialLikesCount[review.databaseId] = review.commentLikes ?? 0;
        // Seed from repliesCount so we avoid an extra round-trip for the count
        const seeded = (review as any).repliesCount;
        if (typeof seeded === 'number') {
          initialCommentCounts[review.databaseId] = seeded;
        }
        // Pre-seed like status cache so background sync skips first API call
        if (userIdForSeed && review.id) {
          const reviewId = review.id || String(review.databaseId);
          if (UUID_REGEX.test(String(reviewId))) {
            likeStatusCacheRef.current[`${reviewId}_${userIdForSeed}`] = {
              isLiked: review.userLiked ?? false,
              count: review.commentLikes ?? 0,
              timestamp: Date.now()
            };
          }
        }
      });

      setUserLiked(initialLiked);
      setLikesCount(initialLikesCount);
      setCommentCounts((prev) => ({ ...prev, ...initialCommentCounts }));
    }
  }, [reviews, user?.user_id]);

  // Background sync: like status for initial + adjacent (no blocking before first paint)
  useEffect(() => {
    if (!isOpen || !user || reviews.length === 0) return;

    const syncOne = async (review: GraphQLReview) => {
      const reviewId = review.id || String(review.databaseId);
      if (!UUID_REGEX.test(String(reviewId))) return;

      const userId = await getUserUuid();
      if (!userId) return;

      const cacheKey = `${reviewId}_${userId}`;
      const cached = likeStatusCacheRef.current[cacheKey];
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        setUserLiked((prev) => ({ ...prev, [review.databaseId]: cached.isLiked }));
        setLikesCount((prev) => ({ ...prev, [review.databaseId]: cached.count }));
        return;
      }

      const token = await getNhostToken();
      if (!token) return;
      const res = await fetch(`/api/v1/restaurant-reviews/toggle-like?review_id=${reviewId}&user_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json?.success || !json?.data) return;

      const isLiked = json.data.liked ?? false;
      const count = json.data.likesCount ?? 0;
      likeStatusCacheRef.current[cacheKey] = { isLiked, count, timestamp: Date.now() };

      setUserLiked((prev) => ({ ...prev, [review.databaseId]: isLiked }));
      setLikesCount((prev) => ({ ...prev, [review.databaseId]: count }));
    };

    const indices = [initialIndex, initialIndex - 1, initialIndex + 1].filter(
      (i) => i >= 0 && i < reviews.length
    );

    const t = setTimeout(() => {
      indices.forEach((i) => {
        const r = reviews[i];
        if (r) void syncOne(r);
      });
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, initialIndex, reviews, user, getUserUuid, getNhostToken]);

  // Follow state for active + adjacent reviews: seed from context/cache, then background fetch
  useEffect(() => {
    if (!isOpen || !user || reviews.length === 0) return;

    const currentUserIdString = nhostUser?.id != null ? String(nhostUser.id) : "";

    const syncFollowForReview = (review: GraphQLReview) => {
      if (!review?.author?.node?.databaseId) return;
      const authorDatabaseId = review.author.node.databaseId;
      const authorUserIdRaw = review.userId ?? review.author?.node?.id ?? "";
      const authorUserId = typeof authorUserIdRaw === "string" ? authorUserIdRaw : String(authorUserIdRaw ?? "");
      const isUUID = authorUserId.length > 0 && UUID_REGEX.test(authorUserId);
      if (!isUUID) {
        setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: false }));
        return;
      }
      if (currentUserIdString && authorUserId === currentUserIdString) {
        setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: false }));
        return;
      }

      const fromContext = getFollowState(authorDatabaseId);
      setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: fromContext }));

      const cached = followCheckCacheRef.current[authorDatabaseId];
      if (cached && Date.now() - cached.ts < FOLLOW_CACHE_MS) {
        setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: cached.isFollowing }));
        setFollowState(authorDatabaseId, cached.isFollowing);
        return;
      }

      getNhostToken().then(async (token) => {
        if (!token) return;
        try {
          const response = await fetch("/api/v1/restaurant-users/check-follow-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: authorUserId }),
          });
          const result = await response.json();
          const isFollowingValue = result.success && !!result.is_following;
          setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: isFollowingValue }));
          setFollowState(authorDatabaseId, isFollowingValue);
          followCheckCacheRef.current[authorDatabaseId] = { isFollowing: isFollowingValue, ts: Date.now() };
        } catch (err) {
          console.error("Error fetching follow state:", err);
          followCheckCacheRef.current[authorDatabaseId] = { isFollowing: fromContext, ts: Date.now() };
        }
      });
    };

    const indices = [activeIndex, activeIndex - 1, activeIndex + 1].filter((i) => i >= 0 && i < reviews.length);
    indices.forEach((i) => {
      const r = reviews[i];
      if (r) syncFollowForReview(r);
    });
  }, [activeIndex, isOpen, user, reviews, setFollowState, getFollowState, getNhostToken, nhostUser?.id]);

  // Helper function to fetch first comment for a review
  const fetchFirstCommentForReview = useCallback(async (reviewId: string, databaseId: number) => {
    if (!reviewId || loadingFirstComments[reviewId]) return;
    
    setLoadingFirstComments((prev) => ({ ...prev, [reviewId]: true }));
    
    try {
      // Pass userId to check which comments the user has liked
      const userId = await getUserUuid();
      const replies = await reviewService.fetchCommentReplies(reviewId, userId || undefined);
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

  // Keep ref in sync so we don't have to rebuild observers on every activeIndex change.
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // When the window changes, reset the active index to the new initialIndex.
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(initialIndex);
    activeIndexRef.current = initialIndex;
  }, [isOpen, initialIndex, reviewsKey]);

  // Track which post is "active" (most visible) to support windowed paging viewers.
  useEffect(() => {
    if (!isOpen) return;
    const root = scrollContainerRef.current;
    if (!root) return;

    const elementToIndex = new Map<Element, number>();
    Object.entries(postRefs.current).forEach(([idx, el]) => {
      if (el) elementToIndex.set(el, Number(idx));
    });

    if (elementToIndex.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio above threshold
        let best: { idx: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = elementToIndex.get(entry.target);
          if (typeof idx !== 'number') continue;
          const ratio = entry.intersectionRatio || 0;
          if (ratio < 0.6) continue;
          if (!best || ratio > best.ratio) best = { idx, ratio };
        }

        if (best && best.idx !== activeIndexRef.current) {
          activeIndexRef.current = best.idx;
          setActiveIndex(best.idx);
          onActiveIndexChange?.(best.idx);
        }
      },
      { root, threshold: [0.6, 0.75, 0.9] }
    );

    elementToIndex.forEach((_, el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen, reviewsKey, onActiveIndexChange]);

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

  const openEngagementFromReview = useCallback((review: GraphQLReview) => {
    setEngagementAuthor(getEngagementAuthorFromReview(review));
    setEngagementModalOpen(true);
  }, []);

  const openEngagementForSelectedReview = useCallback(() => {
    if (selectedReview) {
      setEngagementAuthor(getEngagementAuthorFromReview(selectedReview));
      setEngagementModalOpen(true);
    }
  }, [selectedReview]);

  // Handle like (pending lock prevents double-tap)
  const handleLike = useCallback(async (review: GraphQLReview): Promise<void> => {
    if (!user) {
      openEngagementFromReview(review);
      return;
    }

    const reviewId = review.id || String(review.databaseId);
    if (likePendingIds.has(reviewId)) return;

    setLikePendingIds((prev) => new Set(prev).add(reviewId));

    const isLiked = userLiked[review.databaseId] ?? false;
    const currentLikes = likesCount[review.databaseId] ?? 0;
    const reviewDatabaseId = review.databaseId;

    setUserLiked((prev) => ({ ...prev, [review.databaseId]: !isLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [review.databaseId]: isLiked ? currentLikes - 1 : currentLikes + 1,
    }));

    try {
      const UUID_REGEX_LOCAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = typeof reviewId === "string" && UUID_REGEX_LOCAL.test(reviewId);

      if (isUUID) {
        const userId = await getUserUuid();
        if (!userId) {
          openEngagementFromReview(review);
          setLikePendingIds((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
          return;
        }
        const result = await reviewV2Service.toggleLike(reviewId, userId);
        setUserLiked((prev) => ({ ...prev, [review.databaseId]: result.liked }));
        setLikesCount((prev) => ({ ...prev, [review.databaseId]: result.likesCount }));
        // Update like status cache so background sync won't overwrite this action
        likeStatusCacheRef.current[`${reviewId}_${userId}`] = {
          isLiked: result.liked,
          count: result.likesCount,
          timestamp: Date.now()
        };
      } else {
        const token = await getNhostToken();
        if (!token) {
          openEngagementFromReview(review);
          setLikePendingIds((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
          return;
        }
        if (isLiked) {
          await reviewService.unlikeComment(reviewId, token);
        } else {
          await reviewService.likeComment(reviewId, token);
        }
      }
    } catch (error: unknown) {
      setUserLiked((prev) => ({ ...prev, [review.databaseId]: isLiked }));
      setLikesCount((prev) => ({ ...prev, [review.databaseId]: currentLikes }));
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("JSON") || msg.includes("<!DOCTYPE")) {
        toast.error("Failed to update like. Please try again.");
      } else {
        toast.error("Failed to update like");
      }
    } finally {
      setLikePendingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  }, [user, userLiked, likesCount, likePendingIds, getUserUuid, getNhostToken, openEngagementFromReview]);

  const handleFollowToggle = useCallback(
    async (review: GraphQLReview, isFollowingState: boolean) => {
      if (followInFlightRef.current) return;
      if (!user) {
        toast.error("Please sign in to follow users");
        return;
      }
      if (!review?.author?.node?.databaseId) {
        toast.error("Unable to follow this user");
        return;
      }
      const authorDatabaseId = review.author.node.databaseId;
      const authorUserIdRaw = review.userId ?? review.author?.node?.id ?? "";
      const authorUserId = typeof authorUserIdRaw === "string" ? authorUserIdRaw : String(authorUserIdRaw ?? "");
      const isUUID = authorUserId.length > 0 && UUID_REGEX.test(authorUserId);
      if (!isUUID) {
        toast.error("Follow requires a valid user. Please refresh.");
        return;
      }
      const currentUserIdString = nhostUser?.id != null ? String(nhostUser.id) : "";
      if (currentUserIdString && authorUserId === currentUserIdString) return;

      const newFollowState = !isFollowingState;
      followInFlightRef.current = true;
      setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: newFollowState }));
      setFollowState(authorDatabaseId, newFollowState);

      try {
        const token = await getNhostToken();
        if (!token) {
          toast.error("Authentication required");
          setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: isFollowingState }));
          setFollowState(authorDatabaseId, isFollowingState);
          return;
        }
        const endpoint = isFollowingState
          ? "/api/v1/restaurant-users/unfollow"
          : "/api/v1/restaurant-users/follow";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: authorUserId }),
        });
        if (!response.ok) {
          const errorData: { error?: string } = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update follow");
        }
        const result = await response.json();
        if (result.success) {
          followCheckCacheRef.current[authorDatabaseId] = { isFollowing: newFollowState, ts: Date.now() };
        } else {
          setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: isFollowingState }));
          setFollowState(authorDatabaseId, isFollowingState);
          followCheckCacheRef.current[authorDatabaseId] = { isFollowing: isFollowingState, ts: Date.now() };
          toast.error(result.error || "Failed to update follow");
        }
      } catch (error) {
        setIsFollowing((prev) => ({ ...prev, [authorDatabaseId]: isFollowingState }));
        setFollowState(authorDatabaseId, isFollowingState);
        followCheckCacheRef.current[authorDatabaseId] = { isFollowing: isFollowingState, ts: Date.now() };
        console.error("Follow/unfollow error:", error);
        toast.error("Failed to update follow");
      } finally {
        followInFlightRef.current = false;
      }
    },
    [user, setFollowState, getNhostToken, nhostUser?.id]
  );

  // Handle comment/reply like - Same pattern as review likes
  const handleCommentLike = useCallback(
    async (reply: GraphQLReview) => {
      if (!user) {
        openEngagementFromReview(
          selectedReview ?? reviews[activeIndex] ?? reply
        );
        return;
      }

      const replyId = reply.id;
      if (!replyId || !UUID_REGEX.test(replyId)) {
        toast.error("Cannot like this comment. Please refresh.");
        return;
      }

      // Get user UUID
      const userId = await getUserUuid();
      if (!userId) {
        toast.error("Unable to get user ID. Please try again.");
        return;
      }

      const currentLiked = replyUserLiked[replyId] ?? false;
      const currentCount = replyLikes[replyId] ?? 0;

      // Optimistic update
      const newLiked = !currentLiked;
      const newCount = currentLiked ? currentCount - 1 : currentCount + 1;
      
      setReplyUserLiked((prev) => ({ ...prev, [replyId]: newLiked }));
      setReplyLikes((prev) => ({ ...prev, [replyId]: newCount }));

      try {
        // Use the SAME endpoint as review likes (comments are reviews!)
        const result = await reviewV2Service.toggleLike(replyId, userId);
        
        // Confirm with API response
        setReplyUserLiked((prev) => ({ ...prev, [replyId]: result.liked }));
        setReplyLikes((prev) => ({ ...prev, [replyId]: result.likesCount }));
      } catch (error) {
        // Revert on error
        setReplyUserLiked((prev) => ({ ...prev, [replyId]: currentLiked }));
        setReplyLikes((prev) => ({ ...prev, [replyId]: currentCount }));
        
        console.error("Comment like error:", error);
        toast.error("Failed to like comment. Please try again.");
      }
    },
    [
      user,
      replyUserLiked,
      replyLikes,
      getUserUuid,
      openEngagementFromReview,
      selectedReview,
      reviews,
      activeIndex,
    ]
  );

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
        document.body.classList.add("review-screen-open");
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
            document.body.classList.remove("review-screen-open");
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
  if (typeof document === "undefined") return null;

  const content = (
    <>
      <div className="review-screen" ref={scrollContainerRef}>
        {/* Close Button */}
        <button
          className="review-screen__close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Scroll Container */}
        <div className="review-screen__scroll-container">
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
                className="review-screen__post"
              >
                {/* Image Section - 60-70% */}
                <div className="review-screen__image-section">
                  <FallbackImage
                    src={mainImage}
                    alt={stripTags(review.reviewMainTitle || "Review")}
                    fill
                    className="review-screen__image"
                    priority={index < 3}
                  />
                </div>

                {/* Content Section - 30-40% */}
                <div className="review-screen__content-section">
                  {/* User Info */}
                  <div className="review-screen__user-info">
                    {review.author?.node?.databaseId ? (
                      nhostUser?.id &&
                      String(nhostUser.id) === String(review.author?.node?.databaseId) ? (
                        <Link href={PROFILE}>
                          <FallbackImage
                            src={review.userAvatar || DEFAULT_USER_ICON}
                            alt={review.author?.node?.name || "User"}
                            width={40}
                            height={40}
                            className="review-screen__avatar"
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
                            className="review-screen__avatar"
                            type={FallbackImageType.Icon}
                          />
                        </Link>
                      ) : (
                        <FallbackImage
                          src={review.userAvatar || DEFAULT_USER_ICON}
                          alt={review.author?.node?.name || "User"}
                          width={40}
                          height={40}
                          className="review-screen__avatar"
                          type={FallbackImageType.Icon}
                        />
                      )
                    ) : (
                      <FallbackImage
                        src={review.userAvatar || DEFAULT_USER_ICON}
                        alt={review.author?.node?.name || "User"}
                        width={40}
                        height={40}
                        className="review-screen__avatar"
                        type={FallbackImageType.Icon}
                      />
                    )}

                    <div className="review-screen__user-details">
                      <div className="review-screen__user-header">
                        <div className="review-screen__user-info-left">
                          <div className="flex items-center gap-2">
                            <h3 className="review-screen__username">
                              {review.author?.node?.name || review.author?.name || "Unknown User"}
                            </h3>
                            {/* Palate Tags - Inline with username */}
                            {(() => {
                              const palateNames = review.palates 
                                ? (typeof review.palates === 'string' 
                                    ? review.palates.split('|').map(p => p.trim()).filter(Boolean)
                                    : [])
                                : [];
                              return palateNames.length > 0 ? (
                                <PalateTags palateNames={palateNames} maxTags={2} className="mb-0" />
                              ) : null;
                            })()}
                          </div>
                          {review.commentedOn?.node?.title && (
                            <Link
                              href={`/restaurants/${review.commentedOn.node.slug}`}
                              className="review-screen__restaurant-link"
                            >
                              <FiMapPin className="w-3 h-3" />
                              <span>{review.commentedOn.node.title}</span>
                            </Link>
                          )}
                        </div>
                        <div className="review-screen__user-header-right">
                          {nhostUser?.id &&
                            review.author?.node?.databaseId &&
                            String(nhostUser.id) !== String(review.author.node.id) &&
                            String(nhostUser.id) !== String(review.author.node.databaseId) && (
                              <FollowButton
                                isFollowing={isFollowing[review.author.node.databaseId] ?? false}
                                onToggle={(isFollowingState) => handleFollowToggle(review, isFollowingState)}
                                size="sm"
                              />
                            )}
                          {review.date && (
                            <span className="review-screen__timestamp">
                              {formatRelativeTime(review.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="review-screen__review-content">
                    {review.reviewMainTitle && (
                      <h2 className="review-screen__title">
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
                        <div className="review-screen__text-container">
                          <p className="review-screen__text">
                            {displayText}
                          </p>
                          {shouldTruncate && (
                            <button
                              className="review-screen__see-more"
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
                      <div className="review-screen__rating">
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
                        <div className="review-screen__comment-preview">
                          <ReplySkeleton count={1} />
                        </div>
                      );
                    }
                    
                    // Show first comment if it exists
                    if (firstComment) {
                      return (
                        <div className="review-screen__comment-preview">
                          <div className="review-screen__comment-item">
                            <FallbackImage
                              src={firstComment.userAvatar || DEFAULT_USER_ICON}
                              alt={firstComment.author?.node?.name || "User"}
                              width={24}
                              height={24}
                              className="review-screen__comment-avatar"
                              type={FallbackImageType.Icon}
                            />
                            <div className="review-screen__comment-content">
                              <span className="review-screen__comment-author">
                                {firstComment.author?.node?.name || firstComment.author?.name || "Unknown"}
                              </span>
                              <span className="review-screen__comment-text">
                                {stripTags(firstComment.content || "")}
                              </span>
                            </div>
                          </div>
                          {reviewCommentCount > 1 && (
                            <button
                              className="review-screen__view-all-comments"
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
                  <div className="review-screen__actions">
                    <button
                      className="review-screen__action-btn"
                      onClick={() => handleLike(review)}
                      type="button"
                    >
                      {reviewIsLiked ? (
                        <AiFillHeart className="w-6 h-6 text-red-500" />
                      ) : (
                        <FiHeart className="w-6 h-6" />
                      )}
                      <span>{reviewLikes}</span>
                    </button>

                    <button
                      className="review-screen__action-btn"
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
            <div ref={observerRef} className="review-screen__load-more">
              {loadingMore && (
                <div className="review-screen__skeleton-post">
                  <div className="review-screen__skeleton-image" />
                  <div className="review-screen__skeleton-content">
                    <div className="review-screen__skeleton-avatar" />
                    <div className="review-screen__skeleton-text" />
                    <div className="review-screen__skeleton-text" />
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
          onAuthRequired={openEngagementForSelectedReview}
          onCommentCountChange={(count) => {
            setCommentCounts((prev) => ({
              ...prev,
              [selectedReview.databaseId]: count,
            }));
            // Refresh first comment if count changed
            if (count > 0 && !firstComments[selectedReview.id || ""]) {
              // Pass userId to check which comments the user has liked
              (async () => {
                const userId = await getUserUuid();
                return reviewService.fetchCommentReplies(selectedReview.id || "", userId || undefined);
              })()
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

      <ReviewEngagementAuthModal
        isOpen={engagementModalOpen}
        onClose={() => {
          setEngagementModalOpen(false);
          setEngagementAuthor(null);
        }}
        username={engagementAuthor?.username ?? "this creator"}
        avatarUrl={engagementAuthor?.avatarUrl ?? DEFAULT_USER_ICON}
        profileHref={engagementAuthor?.profileHref ?? null}
        onSignUp={() => {
          setEngagementModalOpen(false);
          setEngagementAuthor(null);
          setIsShowSignup(true);
        }}
        onLogIn={() => {
          setEngagementModalOpen(false);
          setEngagementAuthor(null);
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
      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(false);
          setIsShowSignin(true);
        }}
      />
    </>
  );

  // Render into document.body to avoid being constrained by transformed/virtualized ancestors
  return createPortal(content, document.body);
};

export default ReviewScreen;
