"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFollowContext } from "./FollowContext";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from "@/services/user/userService";
import { ReviewModalProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { stripTags, formatDate, PAGE, capitalizeWords, truncateText } from "../lib/utils";
import { palateFlagMap } from "@/utils/palateFlags";
import { responseStatusCode as code } from "@/constants/response";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { DEFAULT_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { authorIdMissing, commentDuplicateError, commentedSuccess, commentFloodError, commentLikedSuccess, commentUnlikedSuccess, errorOccurred, maximumCommentReplies, updateLikeFailed } from "@/constants/messages";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import toast from 'react-hot-toast';

// Icons
import { 
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineSend,
  AiOutlineMore,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineStar,
  AiFillStar
} from 'react-icons/ai';

const userService = new UserService();
const reviewService = new ReviewService();

const InstagramReviewModal: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
  initialPhotoIndex = 0,
  userLiked: userLikedProp,
  likesCount: likesCountProp,
  onLikeChange,
}) => {
  const { data: session } = useSession();
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

  const authorUserId = data.userId;
  const images = data.reviewImages || [];
  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s) => capitalizeWords(s.trim()))
    .filter((s) => s.length > 0);

  // Load replies on modal open
  useEffect(() => {
    if (isOpen && data?.id) {
      reviewService.fetchCommentReplies(data.id)
        .then(setReplies)
        .catch(error => console.error('Error fetching replies:', error));
    }
  }, [isOpen, data?.id]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle profile click for non-authenticated users
  const handleProfileClick = () => {
    if (!session?.user) {
      setPendingShowSignin(true);
    }
  };

  // Handle follow/unfollow
  const handleFollowClick = async () => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }

    setFollowLoading(true);
    try {
      const response = await userService.followUser(Number(authorUserId), session.accessToken || "");
      
      if (response.status === code.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        setFollowState(Number(authorUserId), newFollowState);
        toast.success(newFollowState ? "Following user!" : "Unfollowed user!");
      } else {
        toast.error(errorOccurred);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error(errorOccurred);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle like/unlike main review
  const handleLikeClick = async () => {
    if (!session?.user) {
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
  };

  // Handle reply like/unlike
  const handleReplyLike = async (replyId: number) => {
    if (!session?.user) {
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
  };

  // Handle comment submission - FIXED VERSION
  const handleCommentSubmit = async () => {
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
      const payload = {
        content: optimisticReply.content,
        restaurantId: data.commentedOn?.node?.databaseId,
        parent: data.databaseId,
        authorId: session?.user?.userId,
      };
      console.log('📝 Comment payload:', payload);
      console.log('🔑 Access token:', session?.accessToken ? 'Present' : 'Missing');
      const res = await reviewService.postReview(payload, session?.accessToken ?? "");
      console.log('📤 Comment response:', res);
      console.log('📊 Response status:', res.status);
      console.log('📊 Expected status (created):', code.created);
      
      // Check for success status codes - HANDLE BOTH NUMERIC AND STRING STATUSES
      const isSuccess = (status: any) => {
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
        console.log('❌ Comment submission failed with status:', res.status);
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
  };

  // Handle signin modal
  useEffect(() => {
    if (pendingShowSignin) {
      setIsShowSignin(true);
      setPendingShowSignin(false);
    }
  }, [pendingShowSignin]);

  // Navigation functions
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[35rem] min-h-[35rem] flex mx-4 shadow-2xl">
        {/* Left Side - Images */}
        <div className="flex-1 bg-black relative min-h-0">
          {images.length > 0 ? (
            <div className="relative h-full">
              <Image
                src={images[currentImageIndex]?.sourceUrl || DEFAULT_IMAGE}
                alt={`Review image ${currentImageIndex + 1}`}
                fill
                className="object-contain max-h-full"
                priority
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <AiOutlineLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <AiOutlineRight className="w-6 h-6" />
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
                src={DEFAULT_IMAGE}
                alt="No image available"
                width={400}
                height={400}
                className="opacity-50"
              />
            </div>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="w-[25rem] flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {data.author?.node?.id ? (
                session?.user ? (
                  <Link
                    href={String(session.user.id) === String(data.author.node.id) ? PROFILE : PAGE(PROFILE, [data.author.node.id])}
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
                  {session?.user ? (
                    <Link
                      href={String(session.user.id) === String(data.author.node.id) ? PROFILE : PAGE(PROFILE, [data.author.node.id])}
                      passHref
                    >
                      <span className="font-semibold text-xs cursor-pointer hover:underline">
                        {data.author?.name || data.author?.node?.name || "Unknown User"}
                      </span>
                    </Link>
                  ) : (
                    <span
                      className="font-semibold text-xs cursor-pointer hover:underline"
                      onClick={handleProfileClick}
                    >
                      {data.author?.name || data.author?.node?.name || "Unknown User"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Follow Button */}
            {(!session?.user || (session?.user?.id !== authorUserId)) && (
              <button
                onClick={handleFollowClick}
                disabled={followLoading || !authorUserId}
                className={`px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center transition-colors ${
                  isFollowing 
                    ? 'bg-[#494D5D] text-white' 
                    : 'text-[#FCFCFC]'
                } disabled:opacity-50 disabled:pointer-events-none`}
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

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {/* Main Review as First Comment */}
            <div className="space-y-2">
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
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-xs">
                      {data.author?.name || data.author?.node?.name || "Unknown User"}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(data.date)}
                    </span>
                  </div>
                  
                  {/* Palate Tags */}
                  {UserPalateNames && UserPalateNames.length > 0 && (
                    <div className="flex space-x-1 mb-2">
                      {UserPalateNames.slice(0, 2).map((tag: string, index: number) => (
                        <span key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {palateFlagMap[tag.toLowerCase()] && (
                            <Image
                              src={palateFlagMap[tag.toLowerCase()]}
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
                  <p className="text-xs font-medium mb-2">
                    {stripTags(data.reviewMainTitle || "").length > reviewTitleDisplayLimit ? (
                      <>
                        {showFullTitle
                          ? capitalizeWords(stripTags(data.reviewMainTitle || ""))
                          : capitalizeWords(truncateText(stripTags(data.reviewMainTitle || ""), reviewTitleDisplayLimit)) + "…"}
                        <button
                          className="text-blue-500 text-xs ml-1 hover:underline"
                          onClick={() => setShowFullTitle(!showFullTitle)}
                        >
                          {showFullTitle ? "Show less" : "more"}
                        </button>
                      </>
                    ) : (
                      capitalizeWords(stripTags(data.reviewMainTitle || ""))
                    )}
                  </p>
                  
                  {/* Review Content */}
                  <p className="text-xs mb-2">
                    {stripTags(data.content || "").length > reviewDescriptionDisplayLimit ? (
                      <>
                        {showFullContent
                          ? capitalizeWords(stripTags(data.content || ""))
                          : capitalizeWords(truncateText(stripTags(data.content || ""), reviewDescriptionDisplayLimit)) + "…"}
                        <button
                          className="text-blue-500 text-xs ml-1 hover:underline"
                          onClick={() => setShowFullContent(!showFullContent)}
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
                          <AiFillStar key={i} className="w-4 h-4 text-yellow-400" />
                        ) : half ? (
                          <AiFillStar key={i} className="w-4 h-4 text-yellow-400 opacity-50" />
                        ) : (
                          <AiOutlineStar key={i} className="w-4 h-4 text-gray-300" />
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-500">
                      {typeof data.reviewStars === 'string' ? parseFloat(data.reviewStars) : data.reviewStars}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Replies */}
            {replies.map((reply, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start space-x-3">
                  {reply.author?.node?.id ? (
                    session?.user ? (
                      <Link
                        href={String(session.user.id) === String(reply.author.node.id) ? PROFILE : PAGE(PROFILE, [reply.author.node.id])}
                        passHref
                      >
                        <FallbackImage
                          src={reply.userAvatar || DEFAULT_USER_ICON}
                          alt={reply.author?.node?.name || "User"}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full cursor-pointer flex-shrink-0"
                          type={FallbackImageType.Icon}
                        />
                      </Link>
                    ) : (
                      <FallbackImage
                        src={reply.userAvatar || DEFAULT_USER_ICON}
                        alt={reply.author?.node?.name || "User"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full cursor-pointer flex-shrink-0"
                        onClick={handleProfileClick}
                        type={FallbackImageType.Icon}
                      />
                    )
                  ) : (
                    <FallbackImage
                      src={reply.userAvatar || DEFAULT_USER_ICON}
                      alt={reply.author?.node?.name || "User"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      type={FallbackImageType.Icon}
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-xs">
                        {reply.author?.name || reply.author?.node?.name || "Unknown User"}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(reply.date)}
                      </span>
                    </div>
                    
                    <p className="text-xs mb-2">
                      {capitalizeWords(stripTags(reply.content || ""))}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleReplyLike(reply.databaseId)}
                        disabled={!!replyLoading[reply.databaseId]}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        {replyLoading[reply.databaseId] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                        ) : reply.userLiked ? (
                          <AiFillHeart className="w-4 h-4 text-red-500" />
                        ) : (
                          <AiOutlineHeart className="w-4 h-4" />
                        )}
                        <span className="text-xs">
                          {reply.commentLikes || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Like and Comment Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLikeClick}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  {userLiked ? (
                    <AiFillHeart className="w-6 h-6 text-red-500" />
                  ) : (
                    <AiOutlineHeart className="w-6 h-6" />
                  )}
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors">
                  <AiOutlineComment className="w-6 h-6" />
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors">
                  <AiOutlineSend className="w-6 h-6" />
                </button>
              </div>
              
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <AiOutlineMore className="w-6 h-6" />
              </button>
            </div>

            {/* Likes Count */}
            <div className="text-xs font-semibold">
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </div>

            {/* Comment Input */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
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
                    className="flex-1 resize-none border-none outline-none text-xs placeholder-gray-500"
                    rows={1}
                    disabled={cooldown > 0}
                  />
                  {commentText.trim() && (
                    <button
                      onClick={handleCommentSubmit}
                      disabled={isLoading || cooldown > 0}
                      className="text-blue-500 font-semibold text-xs hover:text-blue-600 disabled:opacity-50"
                    >
                      Post
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default InstagramReviewModal;
