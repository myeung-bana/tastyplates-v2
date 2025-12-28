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
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { useFollowContext } from "../FollowContext";
import { capitalizeWords, stripTags, generateProfileUrl } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { FollowButton } from "@/components/ui/follow-button";
import PalateTags from "@/components/ui/PalateTags/PalateTags";

// Helper function to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  if (typeof profileImage === 'string') return profileImage;
  if (typeof profileImage === 'object') {
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  return null;
};
import { authorIdMissing, errorOccurred } from "@/constants/messages";
import { responseStatusCode as code } from "@/constants/response";
import toast from "react-hot-toast";
import ReplyItem from "./ReplyItem";
import ReplySkeleton from "../ui/Skeleton/ReplySkeleton";
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

const SwipeableReviewViewerDesktop: React.FC<SwipeableReviewViewerDesktopProps> = ({
  reviews,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const { user, firebaseUser } = useFirebaseSession();
  const { setFollowState } = useFollowContext();
  
  // Cache user UUID to avoid repeated fetches (performance optimization)
  const userUuidRef = useRef<string | null>(null);
  
  // Cache UUID regex (performance optimization)
  const UUID_REGEX = useMemo(() => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, []);
  
  // Helper to get Firebase ID token for API calls
  const getFirebaseToken = useCallback(async () => {
    // Use firebaseUser directly for more reliable authentication
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return null;
  }, [firebaseUser]);
  
  // Helper to get user UUID once and cache it (performance optimization for likes)
  const getUserUuid = useCallback(async (): Promise<string | null> => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:74',message:'getUserUuid called',data:{hasCached:!!userUuidRef.current,cachedValue:userUuidRef.current,hasUser:!!user?.id,hasFirebaseUser:!!firebaseUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Return cached UUID if available
    if (userUuidRef.current) {
      return userUuidRef.current;
    }

    if (!user?.id || !firebaseUser) return null;

    const userIdStr = String(user.id);
    
    if (UUID_REGEX.test(userIdStr)) {
      userUuidRef.current = userIdStr;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:85',message:'User ID is UUID, cached',data:{userIdStr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return userIdStr;
    }

    try {
      const fetchStartTime = Date.now();
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const fetchDuration = Date.now() - fetchStartTime;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:91',message:'User UUID fetch response',data:{responseOk:response.ok,responseStatus:response.status,fetchDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.ok) {
        const userData = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:96',message:'User UUID parsed',data:{userDataSuccess:userData.success,hasUserId:!!userData.data?.id,userId:userData.data?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (userData.success && userData.data?.id) {
          userUuidRef.current = userData.data.id;
          return userData.data.id;
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:102',message:'User UUID fetch error',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error("Error fetching user UUID:", error);
    }

    return null;
  }, [user?.id, firebaseUser, UUID_REGEX]);
  
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

  // Preload images for current and next reviews (debounced for performance)
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
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
    }, 100); // Debounce by 100ms
    
    return () => clearTimeout(timer);
  }, [currentIndex, isOpen, reviews]);

  // Initialize like states
  useEffect(() => {
    if (reviews.length > 0) {
      const initialLiked: Record<number, boolean> = {};
      const initialCounts: Record<number, number> = {};
      reviews.forEach((review) => {
        initialLiked[review.databaseId] = review.userLiked ?? false;
        // Ensure commentLikes is always an integer
        const commentLikes = review.commentLikes ?? 0;
        initialCounts[review.databaseId] = typeof commentLikes === 'string' 
          ? parseInt(commentLikes, 10) || 0 
          : Number(commentLikes) || 0;
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:195',message:'Initializing like states',data:{reviewsCount:reviews.length,initialLiked,initialCounts,sampleReview:{databaseId:reviews[0]?.databaseId,userLiked:reviews[0]?.userLiked,commentLikes:reviews[0]?.commentLikes}},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      setUserLiked(initialLiked);
      setLikesCount(initialCounts);
    }
  }, [reviews]);

  // Cache to avoid redundant API calls for the same review
  const likeStatusCacheRef = useRef<Record<string, { isLiked: boolean; count: number; timestamp: number }>>({});
  const CACHE_TTL = 30000; // 30 seconds cache

  // Check like status and count when component opens or current review changes (with caching and debouncing)
  useEffect(() => {
    if (!isOpen || !user || !firebaseUser || reviews.length === 0) return;
    
    // Debounce to prevent rapid successive calls
    const timeoutId = setTimeout(async () => {
      const review = reviews[currentIndex];
      if (!review?.id) return;
      
      const reviewId = review.id;
      const isReviewUUID = typeof reviewId === 'string' && UUID_REGEX.test(reviewId);
      if (!isReviewUUID) return;
      
      try {
        const userId = await getUserUuid();
        if (!userId) return;
        
        // Check cache with correct userId (from getUserUuid, not user?.id)
        const cacheKey = `${reviewId}_${userId}`;
        const cached = likeStatusCacheRef.current[cacheKey];
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:225',message:'Using cached like status',data:{reviewId,userId,reviewDatabaseId:review.databaseId,cached,timeSinceCache:now-cached.timestamp},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
          setUserLiked((prev) => ({ ...prev, [review.databaseId]: cached.isLiked }));
          setLikesCount((prev) => ({ ...prev, [review.databaseId]: cached.count }));
          return;
        }
        
        // #region agent log
        const fetchStartTime = Date.now();
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:235',message:'Fetching like status and count',data:{reviewId,userId,reviewDatabaseId:review.databaseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        // Get like status and count using the GET endpoint (now optimized with single query)
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
            
            // Cache the result with correct key
            likeStatusCacheRef.current[cacheKey] = {
              isLiked,
              count: currentCount,
              timestamp: Date.now()
            };
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:255',message:'Like status and count fetched',data:{reviewId,userId,isLiked,currentCount,reviewDatabaseId:review.databaseId,fetchDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            
            setUserLiked((prev) => ({ ...prev, [review.databaseId]: isLiked }));
            setLikesCount((prev) => ({ ...prev, [review.databaseId]: currentCount }));
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:265',message:'Error checking like status',data:{reviewId:review.id,errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        console.error('Error checking like status:', error);
      }
    }, 150); // 150ms debounce to prevent rapid calls
    
    return () => clearTimeout(timeoutId);
  }, [isOpen, currentIndex, reviews, user, firebaseUser, getUserUuid, UUID_REGEX]);

  // Combined effect: Reset states and handle navbar when modal opens/closes (performance optimization)
  useEffect(() => {
    if (isOpen) {
      // Initialize states
      setCurrentIndex(initialIndex);
      setCurrentImageIndex(0);
      setShowComments(true);
      setReplies([]);
      setIsTextExpanded(false);
      
      // Hide navbar
      document.body.classList.add('swipeable-review-viewer-open');
    } else {
      document.body.classList.remove('swipeable-review-viewer-open');
    }

    return () => {
      document.body.classList.remove('swipeable-review-viewer-open');
    };
  }, [isOpen, initialIndex]);

  // Check follow state when review changes
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const review = reviews[currentIndex];
    if (!review?.author?.node?.databaseId) return;

    // Try to get UUID from review.userId first, then fall back to databaseId
    const authorUserId = review.userId || review.author?.node?.databaseId;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = typeof authorUserId === 'string' && UUID_REGEX.test(authorUserId);
    
    // Skip follow check if we don't have a UUID (legacy numeric IDs)
    if (!isUUID) {
      setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
      return;
    }
    
    const currentUserId = user?.id;
    const currentUserIdString = typeof currentUserId === 'string' ? currentUserId : String(currentUserId);

    // Don't check follow state for own profile
    if (currentUserIdString && authorUserId === currentUserIdString) {
      setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
      return;
    }

    // Fetch follow state for current review using new API v1 endpoint
    getFirebaseToken().then(async (token) => {
      if (!token) return;
      
      try {
        // Use new Hasura API endpoint for UUIDs
        const response = await fetch('/api/v1/restaurant-users/check-follow-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: authorUserId })
        });
        
        const result = await response.json();
        if (result.success) {
          setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: !!result.is_following }));
          setFollowState(review.author.node.databaseId, !!result.is_following);
        } else {
          setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
        }
      } catch (err) {
        console.error("Error fetching follow state:", err);
        setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
      }
    });
  }, [currentIndex, isOpen, user, reviews, setFollowState, getFirebaseToken]);

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
          .catch((error: any) => {
            // Check if it's a JSON parsing error
            const errorMessage = error?.message || '';
            const isJsonError = errorMessage.includes('JSON') || 
                               errorMessage.includes('<!DOCTYPE') || 
                               errorMessage.includes('Unexpected token');
            
            if (isJsonError) {
              console.error("Error fetching comment count: API returned non-JSON response (likely HTML error page)", error);
              // Set count to 0 on error instead of leaving it undefined
              setCommentCounts((prev) => ({
                ...prev,
                [review.databaseId]: 0,
              }));
            } else {
              console.error("Error fetching comment count:", error);
            }
            fetchedCommentCountsRef.current.delete(review.databaseId);
          });
      }
    });
  }, [isOpen, visibleIndices, reviews]);

  // Fetch replies automatically when component opens or review changes
  useEffect(() => {
    const review = reviews[currentIndex];
    // Load comments automatically when component is open and comments section is visible
    if (isOpen && showComments && review?.id) {
      setIsLoadingReplies(true);
      reviewService
        .fetchCommentReplies(review.id)
        .then((fetchedReplies) => {
          // Limit to top 5 initially for better performance
          const topReplies = fetchedReplies.slice(0, 5);
          setReplies(topReplies);
          setIsLoadingReplies(false);
        })
        .catch((error: any) => {
          // Check if it's a JSON parsing error
          const errorMessage = error?.message || '';
          const isJsonError = errorMessage.includes('JSON') || 
                             errorMessage.includes('<!DOCTYPE') || 
                             errorMessage.includes('Unexpected token');
          
          if (isJsonError) {
            console.error("Error fetching replies: API returned non-JSON response (likely HTML error page)", error);
          } else {
            console.error("Error fetching replies:", error);
          }
          // Set empty array on error to prevent UI breakage
          setReplies([]);
          setIsLoadingReplies(false);
        });
    } else if (!isOpen) {
      // Clear replies when component closes
      setReplies([]);
    }
  }, [isOpen, showComments, currentIndex, reviews]);

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

  // Handle like/unlike - Optimized with cached user UUID
  const handleLike = useCallback(
    async (review: GraphQLReview) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:355',message:'handleLike called',data:{reviewId:review.id,reviewDatabaseId:review.databaseId,hasUser:!!user,hasFirebaseUser:!!firebaseUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
      if (!user || !firebaseUser) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:357',message:'Auth check failed',data:{hasUser:!!user,hasFirebaseUser:!!firebaseUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        toast.error("Please sign in to like reviews");
        return;
      }

      // Use review.id (UUID) if available, otherwise fall back to databaseId (numeric)
      const reviewId = review.id || String(review.databaseId);
      const isReviewUUID = typeof reviewId === 'string' && UUID_REGEX.test(reviewId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:363',message:'Review ID validation',data:{reviewId,isReviewUUID,reviewDatabaseId:review.databaseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!isReviewUUID) {
        toast.error("Like functionality requires review UUID. Please refresh the page.");
        return;
      }

      // Get user UUID (cached for performance)
      const userIdStartTime = Date.now();
      const userId = await getUserUuid();
      const userIdDuration = Date.now() - userIdStartTime;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:371',message:'getUserUuid result',data:{userId,userIdDuration,hasUserId:!!userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!userId) {
        toast.error("Unable to get user ID. Please try again.");
        return;
      }

      const reviewDatabaseId = review.databaseId;
      const currentLiked = userLiked[reviewDatabaseId] ?? false;
      const currentLikes = likesCount[reviewDatabaseId] ?? 0;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:378',message:'Current state before optimistic update',data:{reviewDatabaseId,currentLiked,currentLikes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Optimistic update
      const newLiked = !currentLiked;
      const newCount = currentLiked ? currentLikes - 1 : currentLikes + 1;
      
      setUserLiked((prev) => ({ ...prev, [reviewDatabaseId]: newLiked }));
      setLikesCount((prev) => ({ ...prev, [reviewDatabaseId]: newCount }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:386',message:'Optimistic update applied',data:{reviewDatabaseId,newLiked,newCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      try {
        const apiStartTime = Date.now();
        // Call new API v1 endpoint
        const result = await reviewV2Service.toggleLike(reviewId, userId);
        const apiDuration = Date.now() - apiStartTime;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:390',message:'API call success',data:{reviewId,userId,result,apiDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        
        // Update cache with correct userId
        const cacheKey = `${reviewId}_${userId}`;
        likeStatusCacheRef.current[cacheKey] = {
          isLiked: result.liked,
          count: result.likesCount,
          timestamp: Date.now()
        };
        
        // Confirm the liked status and count from API
        setUserLiked((prev) => ({ ...prev, [reviewDatabaseId]: result.liked }));
        setLikesCount((prev) => ({ ...prev, [reviewDatabaseId]: result.likesCount }));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:394',message:'State updated from API',data:{reviewDatabaseId,resultLiked:result.liked,resultLikesCount:result.likesCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D,E'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/981a41b5-f391-4324-be30-fb74de0ecca3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeableReviewViewerDesktop.tsx:395',message:'API call error',data:{reviewId,userId,errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        // Revert both on error
        setUserLiked((prev) => ({ ...prev, [reviewDatabaseId]: currentLiked }));
        setLikesCount((prev) => ({ ...prev, [reviewDatabaseId]: currentLikes }));
        
        console.error("Like error:", error);
        toast.error("Failed to update like. Please try again.");
      }
    },
    [user, firebaseUser, userLiked, likesCount, getUserUuid, UUID_REGEX]
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

  // Handle follow/unfollow - Updated to work with FollowButton
  const handleFollowToggle = useCallback(async (isFollowingState: boolean) => {
    if (!user) {
      setIsShowSignin(true);
      return;
    }

    const review = reviews[currentIndex];
    if (!review?.author?.node?.databaseId) {
      toast.error(authorIdMissing);
      return;
    }

    // Try to get UUID from review.userId first, then fall back to databaseId
    const authorUserId = review.userId || review.author?.node?.databaseId;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = typeof authorUserId === 'string' && UUID_REGEX.test(authorUserId);
    
    // Skip follow/unfollow if we don't have a UUID (legacy numeric IDs)
    if (!isUUID) {
      toast.error("Follow functionality requires user UUID. Please refresh the page.");
      return;
    }
    
    const currentUserId = user?.id;
    const currentUserIdString = typeof currentUserId === 'string' ? currentUserId : String(currentUserId);

    // Don't allow following yourself
    if (currentUserIdString && authorUserId === currentUserIdString) {
      return;
    }

    setFollowLoading((prev) => ({ ...prev, [review.author.node.databaseId]: true }));
    try {
      const token = await getFirebaseToken();
      if (!token) {
        toast.error("Authentication required");
        setFollowLoading((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
        return;
      }
      
      // Use new Hasura API endpoints for UUIDs
      const endpoint = isFollowingState
        ? '/api/v1/restaurant-users/unfollow'
        : '/api/v1/restaurant-users/follow';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: authorUserId })
      });
      
      if (!response.ok) {
        const errorData: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isFollowingState ? 'unfollow' : 'follow'} user`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const newFollowState = !isFollowingState;
        setIsFollowing((prev) => ({ ...prev, [review.author.node.databaseId]: newFollowState }));
        setFollowState(review.author.node.databaseId, newFollowState);
        toast.success(newFollowState ? "Following user!" : "Unfollowed user!");
      } else {
        toast.error(result.error || errorOccurred);
      }
    } catch (error) {
      console.error("Follow/unfollow error:", error);
      toast.error(errorOccurred);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [review.author.node.databaseId]: false }));
    }
  }, [user, currentIndex, reviews, setFollowState, getFirebaseToken]);

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
      
      // Get author UUID - user.id should already be a UUID
      const authorId = user?.id;
      if (!authorId) {
        toast.error('User not authenticated or invalid user ID');
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        setIsSubmittingComment(false);
        return;
      }

      // Get parent review ID - review.id should be the UUID
      const parentReviewId = review.id;
      if (!parentReviewId) {
        toast.error('Invalid review ID');
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        setIsSubmittingComment(false);
        return;
      }

      // Validate parent review ID is a UUID
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(parentReviewId)) {
        console.error('Parent review ID is not a valid UUID:', parentReviewId);
        toast.error('Invalid review ID format');
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        setIsSubmittingComment(false);
        return;
      }

      // Use new createComment endpoint
      const res = await reviewService.createComment({
        parent_review_id: parentReviewId,
        author_id: authorId,
        content: optimisticReply.content,
        restaurant_uuid: undefined, // Let API fetch from parent review
      }, token);

      if (res.success) {
        // Refetch replies to get the actual reply with proper ID
        const updatedReplies = await reviewService.fetchCommentReplies(review.id);
        setReplies(updatedReplies);
        setCommentCounts((prev) => ({
          ...prev,
          [review.databaseId]: (prev[review.databaseId] || 0) + 1,
        }));
        setCooldown(3);
      } else {
        setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id));
        toast.error(res.error || "Failed to post comment. Please try again.");
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

  // Memoize current review data to avoid recalculations on every render (performance optimization)
  const currentReviewData = useMemo(() => {
    if (!isOpen || reviews.length === 0 || !reviews[currentIndex]) {
      return null;
    }

    const review = reviews[currentIndex];
    const reviewImages = review.reviewImages || [];
    const currentImage = reviewImages[currentImageIndex]?.sourceUrl || DEFAULT_REVIEW_IMAGE;
    const isLiked = userLiked[review.databaseId] ?? false;
    const likes = Math.max(0, Math.floor(Number(likesCount[review.databaseId] ?? 0)));
    const commentCount = Math.max(0, Math.floor(Number(commentCounts[review.databaseId] ?? 0)));
    
    // Text truncation
    const MAX_CHARS = 300;
    const reviewContent = stripTags(review.content || "");
    const shouldTruncate = reviewContent.length > MAX_CHARS;
    const displayText = isTextExpanded || !shouldTruncate 
      ? reviewContent 
      : reviewContent.slice(0, MAX_CHARS) + "...";

    return {
      review,
      reviewImages,
      hasMultipleImages: reviewImages.length > 1,
      currentImage,
      isLiked,
      likes,
      commentCount,
      reviewContent,
      shouldTruncate,
      displayText
    };
  }, [
    isOpen, 
    reviews, 
    currentIndex, 
    currentImageIndex, 
    userLiked, 
    likesCount, 
    commentCounts, 
    isTextExpanded
  ]);

  // Memoize follow button visibility (performance optimization)
  const shouldShowFollowButton = useMemo(() => {
    if (!currentReviewData || !user?.id || !currentReviewData.review.author?.node) return false;
    
    const authorId = currentReviewData.review.author.node.id;
    const authorDatabaseId = currentReviewData.review.author.node.databaseId;
    const userId = String(user.id);
    const isOwnPost = userId === String(authorId) || userId === String(authorDatabaseId);
    
    return !isOwnPost;
  }, [currentReviewData, user?.id]);

  // Memoize restaurant location data (performance optimization)
  const restaurantLocationData = useMemo(() => {
    if (!currentReviewData) return null;
    
    const review = currentReviewData.review;
    const restaurantTitle = 
      review.commentedOn?.node?.title ||
      (review as any).restaurant?.title ||
      '';
    const restaurantSlug = 
      review.commentedOn?.node?.slug ||
      (review as any).restaurant?.slug ||
      '';
    
    // Debug logging for missing restaurant data (can be removed after verification)
    if (!restaurantTitle && !restaurantSlug) {
      console.log('Restaurant data missing for review:', {
        reviewId: review.id,
        commentedOn: review.commentedOn,
        restaurant: (review as any).restaurant
      });
    }
    
    return restaurantTitle && restaurantSlug ? { title: restaurantTitle, slug: restaurantSlug } : null;
  }, [currentReviewData]);

  // Early return if no data
  if (!currentReviewData) return null;

  const { 
    review: currentReview, 
    reviewImages,
    hasMultipleImages,
    currentImage,
    isLiked,
    likes,
    commentCount,
    shouldTruncate,
    displayText
  } = currentReviewData;

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
                  {/* Follow/Unfollow Button - Hide if viewing your own post */}
                  {shouldShowFollowButton && currentReview.author?.node?.databaseId && (
                    <FollowButton
                      isFollowing={isFollowing[currentReview.author.node.databaseId] ?? false}
                      isLoading={followLoading[currentReview.author.node.databaseId] ?? false}
                      onToggle={handleFollowToggle}
                      size="sm"
                    />
                  )}
                </div>
                {/* Palate Tags - Below username */}
                {(() => {
                  const palateNames = currentReview.palates 
                    ? (typeof currentReview.palates === 'string' 
                        ? currentReview.palates.split('|').map(p => p.trim()).filter(Boolean)
                        : [])
                    : [];
                  return palateNames.length > 0 ? (
                    <div className="mt-2">
                      <PalateTags palateNames={palateNames} maxTags={3} className="mb-0" />
                    </div>
                  ) : null;
                })()}
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
              {restaurantLocationData && (
                <Link 
                  href={`/restaurants/${restaurantLocationData.slug}`}
                  className="swipeable-review-viewer-desktop__restaurant"
                >
                  <FiMapPin className="inline w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  <span className="hover:underline">{restaurantLocationData.title}</span>
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
                  <ReplySkeleton count={3} />
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

