"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useFollowContext } from "../../FollowContext";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from "@/services/user/userService";
import { FollowService } from "@/services/follow/followService";
import { ReviewModalProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { stripTags, formatDate, PAGE, capitalizeWords, truncateText, generateProfileUrl } from "../../../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { palateFlagMap } from "@/utils/palateFlags";
import { responseStatusCode as code } from "@/constants/response";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "../Image/FallbackImage";
import { DEFAULT_REVIEW_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { authorIdMissing, commentedSuccess, commentLikedSuccess, commentUnlikedSuccess, errorOccurred, maximumCommentReplies, updateLikeFailed } from "@/constants/messages";
import SignupModal from "../../auth/SignupModal";
import SigninModal from "../../auth/SigninModal";
import ReplyItem from "../../review/ReplyItem";
import ReplySkeleton from "../Skeleton/ReplySkeleton";
import BottomSheet from "./BottomSheet";
import toast from 'react-hot-toast';

// Icons
import { 
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMore,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineStar,
  AiFillStar
} from 'react-icons/ai';

const userService = new UserService();
const reviewService = new ReviewService();

const followService = new FollowService();

const ReviewBottomSheet: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
  initialPhotoIndex = 0,
  userLiked: userLikedProp,
  likesCount: likesCountProp,
  onLikeChange,
}) => {
  const { user, firebaseUser } = useFirebaseSession();
  const { setFollowState } = useFollowContext();
  
  // State management
  const [currentImageIndex, setCurrentImageIndex] = useState(initialPhotoIndex);
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLiked, setUserLiked] = useState(userLikedProp ?? false);
  const [likesCount, setLikesCount] = useState(likesCountProp ?? 0);
  const [cooldown, setCooldown] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyLoading, setReplyLoading] = useState<Record<number, boolean>>({});
  const [showFullContent, setShowFullContent] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [pendingShowSignin, setPendingShowSignin] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  // Helper function to format relative time
  const formatRelativeTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Handle different date formats
      let date: Date;
      
      // Check if it's already a valid ISO string
      if (dateString.includes('T') && dateString.includes('Z')) {
        // ISO string with timezone (e.g., '2024-01-15T10:30:00Z')
        date = new Date(dateString);
      } else if (dateString.includes('T')) {
        // ISO string without timezone (e.g., '2024-01-15T10:30:00')
        // Treat as UTC to avoid timezone conversion issues
        date = new Date(dateString + 'Z');
      } else {
        // Try parsing as regular date
        date = new Date(dateString);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try to parse as YYYY-MM-DD format
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
      // Convert to more readable format (e.g., "2 days ago" instead of "2 days")
      return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch {
      return formatDate(dateString);
    }
  }, []);

  const authorUserId = data.userId;
  const images = data.reviewImages || [];
  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s) => capitalizeWords(s.trim()))
    .filter((s) => s.length > 0);

  // Load replies on modal open
  React.useEffect(() => {
    if (isOpen && data?.id) {
      setIsLoadingReplies(true);
      reviewService.fetchCommentReplies(data.id)
        .then(setReplies)
        .catch(error => console.error('Error fetching replies:', error))
        .finally(() => setIsLoadingReplies(false));
    }
  }, [isOpen, data?.id]);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for all code paths
  }, [cooldown]);

  // Handle profile click for non-authenticated users
  const handleProfileClick = useCallback(() => {
    if (!user) {
      setPendingShowSignin(true);
    }
  }, [user]);

  // Handle follow/unfollow
  const handleFollowClick = useCallback(async () => {
    if (!user || !firebaseUser) {
      setIsShowSignin(true);
      return;
    }

    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }

    setFollowLoading(true);
    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      let response;
      if (isFollowing) {
        response = await followService.unfollowUser(Number(authorUserId), idToken);
      } else {
        response = await followService.followUser(Number(authorUserId), idToken);
      }
      
      if (response.status === code.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        setFollowState(Number(authorUserId), newFollowState);
        toast.success(newFollowState ? "Following user!" : "Unfollowed user!");
      } else {
        toast.error(response.message || errorOccurred);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error(errorOccurred);
    } finally {
      setFollowLoading(false);
    }
  }, [user, firebaseUser, authorUserId, isFollowing, setFollowState]);

  // Handle like/unlike main review
  const handleLikeClick = useCallback(async () => {
    if (!user) {
      setIsShowSignin(true);
      return;
    }

    // For now, just toggle the like state locally
    // TODO: Implement actual like API call when available
    const newLikedState = !userLiked;
    setUserLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLikeChange?.(newLikedState, newLikedState ? likesCount + 1 : likesCount - 1);
    toast.success(newLikedState ? commentLikedSuccess : commentUnlikedSuccess);
  }, [user, userLiked, likesCount, onLikeChange]);

  // Handle reply like/unlike
  const handleReplyLike = useCallback(async (replyId: number) => {
    if (!user) {
      setIsShowSignin(true);
      return;
    }

    setReplyLoading(prev => ({ ...prev, [replyId]: true }));
    
    try {
      // For now, just toggle the like state locally
      // TODO: Implement actual like API call when available
      setReplies(prev => prev.map(reply => {
        if (reply.databaseId === replyId) {
          const newLikedState = !reply.userLiked;
          return {
            ...reply,
            userLiked: newLikedState,
            commentLikes: newLikedState ? (reply.commentLikes || 0) + 1 : Math.max(0, (reply.commentLikes || 0) - 1)
          };
        }
        return reply;
      }));
      toast.success(replies.find(r => r.databaseId === replyId)?.userLiked ? commentUnlikedSuccess : commentLikedSuccess);
    } catch (error) {
      console.error('Reply like/unlike error:', error);
      toast.error(updateLikeFailed);
    } finally {
      setReplyLoading(prev => ({ ...prev, [replyId]: false }));
    }
  }, [user, replies]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isLoading || cooldown > 0) return;
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    if (commentText.length > reviewDescriptionDisplayLimit) {
      toast.error(maximumCommentReplies(reviewDescriptionDisplayLimit));
      return;
    }

    setIsLoading(true);
    // Optimistically add reply at the top
    const optimisticReply: GraphQLReview & { isOptimistic: boolean } = {
      id: `optimistic-${Date.now()}`,
      databaseId: 0, // Temporary ID for optimistic updates
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
          databaseId: session.user.userId ? parseInt(String(session.user.userId)) : 0,
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
      isOptimistic: true,
    };
    setReplies(prev => [optimisticReply, ...prev]);
    setCommentText("");

    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      
      const payload = {
        content: optimisticReply.content,
        restaurantId: data.commentedOn?.node?.databaseId,
        parent: data.databaseId,
        authorId: undefined, // Firebase users use UUID, not numeric userId
      };
      const res = await reviewService.postReview(payload, idToken);
      
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

      if (isSuccess(res.status)) {
        console.log('✅ Comment approved successfully with status:', res.status);
        toast.success(commentedSuccess);
        // Remove only the optimistic reply, then merge server replies (avoid duplicates)
        const updatedReplies = await reviewService.fetchCommentReplies(data.id);
        setReplies(prev => {
          // Remove optimistic reply
          const withoutOptimistic = prev.filter(r => !('isOptimistic' in r) || !r.isOptimistic);
          // Merge: add any new replies from server not already in the list
          const merged = updatedReplies.concat(
            withoutOptimistic.filter(
              (local) => !updatedReplies.some((server) => server.id === local.id)
            )
          );
          return merged;
        });
        setCooldown(5);
      } else {
        // Remove optimistic reply on error
        setReplies(prev => prev.filter(r => !('isOptimistic' in r) || !r.isOptimistic));
        toast.error(errorOccurred);
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      // Remove optimistic reply on error
      setReplies(prev => prev.filter(r => !('isOptimistic' in r) || !r.isOptimistic));
      toast.error(errorOccurred);
    } finally {
      setIsLoading(false);
    }
  }, [commentText, isLoading, cooldown, user, firebaseUser, data.commentedOn?.node?.databaseId, data.databaseId, data.id]);

  // Handle signin modal
  React.useEffect(() => {
    if (pendingShowSignin) {
      setIsShowSignin(true);
      setPendingShowSignin(false);
    }
  }, [pendingShowSignin]);

  // Navigation functions
  const nextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [currentImageIndex, images.length]);

  const prevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="90vh">
        {/* Images Section */}
        <div className="relative h-64 bg-black">
          {images.length > 0 ? (
            <div className="relative h-full">
              <Image
                src={images[currentImageIndex]?.sourceUrl || DEFAULT_REVIEW_IMAGE}
                alt={`Review image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                    type="button"
                  >
                    <AiOutlineLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30"
                    type="button"
                  >
                    <AiOutlineRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Image
                src={DEFAULT_REVIEW_IMAGE}
                alt="No image available"
                width={200}
                height={200}
                className="opacity-50"
              />
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {data.author?.node?.id ? (
              user ? (
                <Link
                  href={String(user.id) === String(data.author.node.id) ? PROFILE : generateProfileUrl(data.author.node.id || "")}
                  passHref
                >
                  <FallbackImage
                    src={data.userAvatar || DEFAULT_USER_ICON}
                    alt={data.author?.node?.name || "User"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full cursor-pointer"
                    type={FallbackImageType.Icon}
                  />
                </Link>
              ) : (
                <FallbackImage
                  src={data.userAvatar || DEFAULT_USER_ICON}
                  alt={data.author?.node?.name || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={handleProfileClick}
                  type={FallbackImageType.Icon}
                />
              )
            ) : (
              <FallbackImage
                src={data.userAvatar || DEFAULT_USER_ICON}
                alt={data.author?.node?.name || "User"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                type={FallbackImageType.Icon}
              />
            )}
            
            <div>
                <div className="flex items-center space-x-2">
                {user ? (
                <Link
                  href={String(user.id) === String(data.author.node.id) ? PROFILE : generateProfileUrl(data.author.node.id || "")}
                  passHref
                >
                    <span className="font-semibold text-sm cursor-pointer hover:underline">
                      {data.author?.name || data.author?.node?.name || "Unknown User"}
                    </span>
                  </Link>
                ) : (
                  <span
                    className="font-semibold text-sm cursor-pointer hover:underline"
                    onClick={handleProfileClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProfileClick();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {(!user || (user?.id !== authorUserId)) && (
            <button
              onClick={handleFollowClick}
              disabled={followLoading || !authorUserId}
              className={`px-4 py-2 text-sm font-semibold rounded-full h-fit min-w-[80px] flex items-center justify-center transition-colors ${
                isFollowing 
                  ? 'bg-white text-black border border-black' 
                  : 'bg-[#E36B00] text-[#FCFCFC]'
              } disabled:opacity-50`}
              type="button"
            >
              {followLoading ? (
                <span className="animate-pulse">
                  {isFollowing ? "Unfollowing..." : "Following..."}
                </span>
              ) : isFollowing ? (
                "Following"
              ) : (
                "Follow"
              )}
            </button>
          )}
        </div>

        {/* Reviews Content */}
        <div className="p-4 space-y-4">
          {/* Main Review */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <FallbackImage
                src={data.userAvatar || DEFAULT_USER_ICON}
                alt={data.author?.node?.name || "User"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full flex-shrink-0"
                type={FallbackImageType.Icon}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatRelativeTime(data.date)}
                  </span>
                </div>
                
                {/* Palate Tags */}
                {UserPalateNames && UserPalateNames.length > 0 && (
                  <div className="flex space-x-1 mb-2">
                    {UserPalateNames.slice(0, 2).map((tag: string, index: number) => (
                      <span key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {palateFlagMap[tag.toLowerCase()] && (
                          <Image
                            src={palateFlagMap[tag.toLowerCase()] || '/default-image.png'}
                            alt={`${tag} flag`}
                            width={12}
                            height={8}
                            className="w-3 h-2 rounded object-cover"
                          />
                        )}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Review Title */}
                <p className="text-sm font-medium mb-2">
                  {stripTags(data.reviewMainTitle || "").length > reviewTitleDisplayLimit ? (
                    <>
                      {showFullTitle
                        ? capitalizeWords(stripTags(data.reviewMainTitle || ""))
                        : capitalizeWords(truncateText(stripTags(data.reviewMainTitle || ""), reviewTitleDisplayLimit)) + "…"}
                      <button
                        className="text-blue-500 text-sm ml-1 hover:underline"
                        onClick={() => setShowFullTitle(!showFullTitle)}
                        type="button"
                      >
                        {showFullTitle ? "Show less" : "more"}
                      </button>
                    </>
                  ) : (
                    capitalizeWords(stripTags(data.reviewMainTitle || ""))
                  )}
                </p>
                
                {/* Review Content */}
                <p className="text-sm mb-2">
                  {stripTags(data.content || "").length > reviewDescriptionDisplayLimit ? (
                    <>
                      {showFullContent
                        ? capitalizeWords(stripTags(data.content || ""))
                        : capitalizeWords(truncateText(stripTags(data.content || ""), reviewDescriptionDisplayLimit)) + "…"}
                      <button
                        className="text-blue-500 text-sm ml-1 hover:underline"
                        onClick={() => setShowFullContent(!showFullContent)}
                        type="button"
                      >
                        {showFullContent ? "Show less" : "more"}
                      </button>
                    </>
                  ) : (
                    capitalizeWords(stripTags(data.content || ""))
                  )}
                </p>
                
                {/* Rating */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => {
                      const rating = typeof data.reviewStars === 'string' ? parseFloat(data.reviewStars) : data.reviewStars;
                      const full = i + 1 <= rating;
                      const half = !full && i + 0.5 <= rating;
                      return full ? (
                        <AiFillStar key={i} className="w-4 h-4 text-black" />
                      ) : half ? (
                        <AiFillStar key={i} className="w-4 h-4 text-black opacity-50" />
                      ) : (
                        <AiOutlineStar key={i} className="w-4 h-4 text-gray-300" />
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-500">
                    {typeof data.reviewStars === 'string' ? parseFloat(data.reviewStars) : data.reviewStars}/5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Replies */}
          {isLoadingReplies ? (
            <ReplySkeleton count={3} />
          ) : (
            replies.map((reply, index) => (
              <ReplyItem
                key={index}
                reply={reply}
                onLike={handleReplyLike}
                onProfileClick={handleProfileClick}
                isLoading={!!replyLoading[reply.databaseId]}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Like and Comment Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLikeClick}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                type="button"
              >
                {userLiked ? (
                  <AiFillHeart className="w-6 h-6 text-red-500" />
                ) : (
                  <AiOutlineHeart className="w-6 h-6" />
                )}
              </button>
            </div>
            
            <button className="text-gray-500 hover:text-gray-700 transition-colors" type="button">
              <AiOutlineMore className="w-6 h-6" />
            </button>
          </div>

          {/* Likes Count */}
          <div className="text-sm font-semibold">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>

          {/* Comment Input */}
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="flex-1 text-sm text-gray-500 italic">
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
                  className="flex-1 resize-none border-none outline-none text-sm placeholder-gray-500"
                  rows={1}
                  disabled={cooldown > 0}
                />
                {commentText.trim() && (
                  <button
                    onClick={handleCommentSubmit}
                    disabled={isLoading || cooldown > 0}
                    className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50"
                    type="button"
                  >
                    Post
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Auth Modals */}
      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(false);
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
    </>
  );
};

export default ReviewBottomSheet;
