"use client";
import React, { useEffect, useState, useRef } from "react";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { stripTags, formatDate, PAGE, capitalizeWords, truncateText } from "../lib/utils";
import Link from "next/link";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { useSession } from "next-auth/react";
import { useFollowContext } from "./FollowContext";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import Slider from "react-slick";
import { ReviewService } from "@/services/Reviews/reviewService";
import { ReviewModalProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import toast from 'react-hot-toast';

//styles
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import CustomModal from "./ui/Modal/Modal";
import { MdOutlineThumbUp } from "react-icons/md";
import { authorIdMissing, commentDuplicateError, commentedSuccess, commentFloodError, commentLikedSuccess, commentUnlikedSuccess, errorOccurred, maximumCommentReplies, updateLikeFailed, userFollowedFailed, userUnfollowedFailed } from "@/constants/messages";
import { palateFlagMap } from "@/utils/palateFlags";
import { responseStatusCode as code } from "@/constants/response";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { DEFAULT_IMAGE, DEFAULT_USER_ICON, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { UserService } from "@/services/user/userService";

const userService = new UserService()
const reviewService = new ReviewService();

const ReviewDetailModal2: React.FC<ReviewModalProps> = ({
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
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(initialPhotoIndex);
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [commentReply, setCommentReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState<Record<number, boolean>>({});
  const [userLiked, setUserLiked] = useState(userLikedProp ?? false);
  const [likesCount, setLikesCount] = useState(likesCountProp ?? 0);
  const [cooldown, setCooldown] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [authorUserId, setAuthorUserId] = useState<string | null>(null);
  const sliderRef = useRef<Slider>(null);

  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s) => capitalizeWords(s.trim()))
    .filter((s) => s.length > 0);

  // Handle profile click for non-authenticated users
  const handleProfileClick = () => {
    if (!session?.user) {
      setIsShowSignin(true);
    }
  };

  // Handle follow/unfollow functionality
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
      const response = await userService.followUser(Number(authorUserId), session.accessToken);
      
      if (response.status === code.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        
        // Update follow state in context
        setFollowState(Number(authorUserId), newFollowState);
        
        toast.success(newFollowState ? userFollowedFailed : userUnfollowedFailed);
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

  // Handle like/unlike functionality
  const handleLikeClick = async () => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    try {
      const response = await reviewService.likeReview(data.databaseId, session.accessToken);
      
      if (response.status === code.success) {
        const newLikedState = !userLiked;
        setUserLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        
        // Notify parent component
        onLikeChange?.(newLikedState, newLikedState ? likesCount + 1 : likesCount - 1);
        
        toast.success(newLikedState ? commentLikedSuccess : commentUnlikedSuccess);
      } else {
        toast.error(updateLikeFailed);
      }
    } catch (error) {
      console.error('Like/unlike error:', error);
      toast.error(updateLikeFailed);
    }
  };

  // Handle reply like/unlike
  const toggleReplyLike = async (replyId: number) => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    setReplyLoading(prev => ({ ...prev, [replyId]: true }));
    
    try {
      const response = await reviewService.likeReview(replyId, session.accessToken);
      
      if (response.status === code.success) {
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
      } else {
        toast.error(updateLikeFailed);
      }
    } catch (error) {
      console.error('Reply like/unlike error:', error);
      toast.error(updateLikeFailed);
    } finally {
      setReplyLoading(prev => ({ ...prev, [replyId]: false }));
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    if (!commentReply.trim()) return;

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before commenting again...`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await reviewService.postReview({
        restaurantId: data.commentedOn?.node?.databaseId,
        authorId: session.user.id,
        content: commentReply,
        parent: data.databaseId,
      }, session.accessToken!);

      if (response.status === code.success) {
        setCommentReply("");
        setCooldown(30); // 30 second cooldown
        
        // Refresh replies
        const repliesData = await reviewService.fetchCommentReplies(data.id);
        setReplies(repliesData);
        
        toast.success(commentedSuccess);
      } else if (response.status === code.badRequest) {
        toast.error(commentFloodError);
      } else if (response.status === code.conflict) {
        toast.error(commentDuplicateError);
      } else if (response.status === code.forbidden) {
        toast.error(maximumCommentReplies(5));
      } else {
        toast.error(errorOccurred);
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      toast.error(errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  // Load replies on component mount
  useEffect(() => {
    if (isOpen && data.id) {
      reviewService.fetchCommentReplies(data.id)
        .then(repliesData => setReplies(repliesData))
        .catch(error => console.error('Error fetching replies:', error));
    }
  }, [isOpen, data.id]);

  // Set author user ID for follow functionality
  useEffect(() => {
    if (data.author?.node?.id) {
      setAuthorUserId(data.author.node.id);
    }
  }, [data.author?.node?.id]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Slider settings
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    beforeChange: (oldIndex: number, newIndex: number) => setCurrentSlide(newIndex),
  };

  const nextSlide = () => {
    sliderRef.current?.slickNext();
  };

  const prevSlide = () => {
    sliderRef.current?.slickPrev();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      setIsOpen={onClose}
      header=""
      content={
        <div className="review-modal2">
          <div className="review-modal2__container">
            {/* Left side - Images */}
            <div className="review-modal2__images">
              {data.reviewImages && data.reviewImages.length > 0 ? (
                <div className="relative">
                  {/* @ts-expect-error Slider component type compatibility issue */}
                  <Slider {...sliderSettings} ref={sliderRef}>
                    {data.reviewImages.map((image, index) => (
                      <div key={index} className="review-modal2__image-container">
                        <FallbackImage
                          src={image.sourceUrl || DEFAULT_IMAGE}
                          alt={`Review image ${index + 1}`}
                          width={600}
                          height={600}
                          className="review-modal2__image"
                          type={FallbackImageType.Default}
                        />
                      </div>
                    ))}
                  </Slider>
                  
                  {/* Navigation arrows */}
                  {data.reviewImages.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="review-modal2__nav review-modal2__nav--prev"
                        disabled={currentSlide === 0}
                      >
                        <RxCaretLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="review-modal2__nav review-modal2__nav--next"
                        disabled={currentSlide === data.reviewImages.length - 1}
                      >
                        <RxCaretRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Slide indicator */}
                  {data.reviewImages.length > 1 && (
                    <div className="review-modal2__indicator">
                      {currentSlide + 1} / {data.reviewImages.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="review-modal2__no-image">
                  <FallbackImage
                    src={DEFAULT_IMAGE}
                    alt="No image available"
                    width={600}
                    height={600}
                    className="review-modal2__image"
                    type={FallbackImageType.Default}
                  />
                </div>
              )}
            </div>

            {/* Right side - Instagram-style layout */}
            <div className="review-modal2__content">
              {/* Header - User info only */}
              <div className="review-modal2__header">
                <div className="review-modal2__user-info">
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
                          className="review-modal2__user-avatar cursor-pointer"
                          type={FallbackImageType.Icon}
                        />
                      </Link>
                    ) : (
                      <FallbackImage
                        src={data.userAvatar || DEFAULT_USER_ICON}
                        alt={data.author?.node?.name || "User"}
                        width={32}
                        height={32}
                        className="review-modal2__user-avatar cursor-pointer"
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
                      className="review-modal2__user-avatar"
                      type={FallbackImageType.Icon}
                    />
                  )}
                  
                  <div className="review-modal2__user-details">
                    {session?.user ? (
                      <Link
                        href={String(session.user.id) === String(data.author.node.id) ? PROFILE : PAGE(PROFILE, [data.author.node.id])}
                        passHref
                      >
                        <span className="review-modal2__username cursor-pointer hover:underline">
                          {data.author?.name || data.author?.node?.name || "Unknown User"}
                        </span>
                      </Link>
                    ) : (
                      <span
                        className="review-modal2__username cursor-pointer hover:underline"
                        onClick={handleProfileClick}
                      >
                        {data.author?.name || data.author?.node?.name || "Unknown User"}
                      </span>
                    )}
                    
                    <div className="review-modal2__palate-tags">
                      {UserPalateNames?.map((tag: string, index: number) => (
                        <span key={index} className="review-modal2__palate-tag">
                          {palateFlagMap[tag.toLowerCase()] && (
                            <Image
                              src={palateFlagMap[tag.toLowerCase()]}
                              alt={`${tag} flag`}
                              width={12}
                              height={8}
                              className="w-3 h-2 rounded object-cover"
                            />
                          )}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Follow button */}
                {(!session?.user || (session?.user?.id !== (data.userId))) && (
                  <button
                    onClick={handleFollowClick}
                    className={`review-modal2__follow-btn ${isFollowing ? 'review-modal2__follow-btn--following' : ''}`}
                    disabled={!!session?.user && (followLoading || !authorUserId)}
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
              <div className="review-modal2__comments">
                {/* Main review as first comment */}
                <div className="review-modal2__comment review-modal2__comment--main">
                  <FallbackImage
                    src={data.userAvatar || DEFAULT_USER_ICON}
                    alt={data.author?.node?.name || "User"}
                    width={32}
                    height={32}
                    className="review-modal2__comment-avatar"
                    type={FallbackImageType.Icon}
                  />
                  
                  <div className="review-modal2__comment-content">
                    <div className="review-modal2__comment-header">
                      <span className="review-modal2__comment-username">
                        {data.author?.name || data.author?.node?.name || "Unknown User"}
                      </span>
                      <span className="review-modal2__comment-timestamp">
                        {formatDate(data.date)}
                      </span>
                    </div>
                    
                    <div className="review-modal2__comment-text">
                      <p className="review-modal2__comment-title">
                        {stripTags(data.reviewMainTitle || "").length > reviewTitleDisplayLimit ? (
                          <>
                            {showFullTitle
                              ? capitalizeWords(stripTags(data.reviewMainTitle || "")) + " "
                              : capitalizeWords(truncateText(stripTags(data.reviewMainTitle || ""), reviewTitleDisplayLimit)) + "… "}
                            <button
                              className="review-modal2__show-more-btn"
                              onClick={() => setShowFullTitle(!showFullTitle)}
                            >
                              {showFullTitle ? "[Show Less]" : "[See More]"}
                            </button>
                          </>
                        ) : (
                          capitalizeWords(stripTags(data.reviewMainTitle || ""))
                        )}
                      </p>

                      <p className="review-modal2__comment-description">
                        {stripTags(data.content || "").length > reviewDescriptionDisplayLimit ? (
                          <>
                            {showFullContent
                              ? capitalizeWords(stripTags(data.content || ""))
                              : capitalizeWords(truncateText(stripTags(data.content || ""), reviewDescriptionDisplayLimit)) + "…"}
                            {" "}
                            <button
                              className="review-modal2__show-more-btn"
                              onClick={() => setShowFullContent(!showFullContent)}
                            >
                              {showFullContent ? "[Show Less]" : "[See More]"}
                            </button>
                          </>
                        ) : (
                          capitalizeWords(stripTags(data.content || ""))
                        )}
                      </p>

                      {/* Rating */}
                      <div className="review-modal2__rating">
                        {Array.from({ length: 5 }, (_, i) => {
                          const rating = typeof data.reviewStars === 'string' ? parseFloat(data.reviewStars) : data.reviewStars;
                          const full = i + 1 <= rating;
                          const half = !full && i + 0.5 <= rating;
                          return full ? (
                            <Image
                              src={STAR_FILLED}
                              key={i}
                              width={12}
                              height={12}
                              className="w-3 h-3"
                              alt="star rating"
                            />
                          ) : half ? (
                            <Image src={STAR_HALF} key={i} width={12} height={12} className="w-3 h-3" alt="half star rating" />
                          ) : (
                            <Image
                              src={STAR}
                              key={i}
                              width={12}
                              height={12}
                              className="w-3 h-3"
                              alt="star rating"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.map((reply, index) => {
                  const replyUserLiked = reply.userLiked ?? false;
                  const replyUserLikedCounts = reply.commentLikes ?? 0;

                  return (
                    <div key={index} className="review-modal2__comment">
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
                              className="review-modal2__comment-avatar cursor-pointer"
                              type={FallbackImageType.Icon}
                            />
                          </Link>
                        ) : (
                          <FallbackImage
                            src={reply.userAvatar || DEFAULT_USER_ICON}
                            alt={reply.author?.node?.name || "User"}
                            width={32}
                            height={32}
                            className="review-modal2__comment-avatar cursor-pointer"
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
                          className="review-modal2__comment-avatar"
                          type={FallbackImageType.Icon}
                        />
                      )}
                      
                      <div className="review-modal2__comment-content">
                        <div className="review-modal2__comment-header">
                          <span className="review-modal2__comment-username">
                            {reply.author?.name || reply.author?.node?.name || "Unknown User"}
                          </span>
                          <span className="review-modal2__comment-timestamp">
                            {formatDate(reply.date)}
                          </span>
                        </div>
                        
                        <p className="review-modal2__comment-text">
                          {capitalizeWords(stripTags(reply.content || ""))}
                        </p>
                        
                        <div className="review-modal2__comment-actions">
                          <button
                            onClick={() => toggleReplyLike(reply.databaseId)}
                            disabled={!!replyLoading[reply.databaseId]}
                            className="review-modal2__like-btn"
                          >
                            {replyLoading[reply.databaseId] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-[2px] border-blue-400 border-t-transparent"></div>
                            ) : (
                              <MdOutlineThumbUp
                                className={`w-3 h-3 ${replyUserLiked ? "text-blue-600" : "text-gray-500"}`}
                              />
                            )}
                          </button>
                          <span className="review-modal2__like-count">
                            {replyUserLikedCounts}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Section */}
              <div className="review-modal2__actions">
                <div className="review-modal2__action-buttons">
                  <button
                    onClick={handleLikeClick}
                    className="review-modal2__action-btn"
                  >
                    <MdOutlineThumbUp
                      className={`w-5 h-5 ${userLiked ? "text-blue-600" : "text-gray-500"}`}
                    />
                  </button>
                  <span className="review-modal2__likes-count">
                    {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                  </span>
                </div>

                <div className="review-modal2__comment-input">
                  {isLoading ? (
                    <div className="review-modal2__input-loading">
                      Sending...
                    </div>
                  ) : (
                    <textarea
                      rows={1}
                      placeholder={
                        cooldown > 0
                          ? `Please wait ${cooldown}s before commenting again...`
                          : "Add a comment"
                      }
                      value={commentReply}
                      onChange={(e) => setCommentReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit();
                        }
                      }}
                      className="review-modal2__textarea"
                      disabled={cooldown > 0}
                    />
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
      }
      baseClass="!max-w-4xl !w-full !h-[90vh] !p-0"
      headerClass="!hidden"
      contentClass="!p-0"
    />
  );
};

export default ReviewDetailModal2;
