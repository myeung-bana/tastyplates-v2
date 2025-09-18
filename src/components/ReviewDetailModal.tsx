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
import toast from 'react-hot-toast';

//styles
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import CustomModal from "./ui/Modal/Modal";
import { MdOutlineComment, MdOutlineThumbUp } from "react-icons/md";
import { authorIdMissing, commentDuplicateError, commentedSuccess, commentFloodError, commentLikedSuccess, commentUnlikedSuccess, errorOccurred, maximumCommentReplies, updateLikeFailed, userFollowedFailed, userUnfollowedFailed } from "@/constants/messages";
import { palateFlagMap } from "@/utils/palateFlags";
import { responseStatusCode as code } from "@/constants/response";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { DEFAULT_IMAGE, DEFAULT_USER_ICON, STAR, STAR_FILLED, STAR_HALF } from "@/constants/images";
import { reviewDescriptionDisplayLimit, reviewTitleDisplayLimit } from "@/constants/validation";
import { UserService } from "@/services/user/userService";
import { FOLLOW_SYNC_KEY, FOLLOWERS_KEY, FOLLOWING_KEY } from "@/constants/session";

const userService = new UserService()
const reviewService = new ReviewService();

const ReviewDetailModal: React.FC<ReviewModalProps> = ({
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
  const [pendingShowSignin, setPendingShowSignin] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<{ [replyId: string]: boolean }>({});
  // Effect to show signin modal
  useEffect(() => {
    if (pendingShowSignin) {
      setIsShowSignin(true);
      setPendingShowSignin(false);
    }
  }, [pendingShowSignin]);

  // Handler for profile image click (author or commenter)
  const handleProfileClick = () => {
    if (!session?.user) {
      setPendingShowSignin(true);
    }
  };
  const toggleReplyContent = (replyId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [commentReply, setCommentReply] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userLiked, setUserLiked] = useState(data.userLiked ?? false);
  const [likesCount, setLikesCount] = useState(data.commentLikes ?? 0);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState<{ [id: string]: boolean }>({});
  const authorUserId = data.userId;
  const sliderRef = useRef<Record<string, unknown>>(null);

  useEffect(() => {
    window.addEventListener("load", () => {
      if (typeof window !== "undefined") {
        handleResize();
      }
    });
    window.addEventListener("resize", () => {
      handleResize();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, [data]);

  useEffect(() => {
    if (isOpen && data?.id) {
      reviewService.fetchCommentReplies(data.id).then(setReplies);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (isOpen && data) {
      setUserLiked(data.userLiked ?? false);
      setLikesCount(data.likesCount ?? data.commentLikes ?? 0);
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (isOpen && (typeof userLiked === 'boolean')) {
      setUserLiked(userLiked);
    }
  }, [isOpen, userLiked]);

  useEffect(() => {
    if (isOpen && typeof likesCount === 'number') {
      setLikesCount(likesCount);
    }
  }, [isOpen, likesCount]);

  useEffect(() => {
    // Fetch initial follow state when modal opens and author is available
    if (!isOpen) return;
    if (!session?.accessToken) return;
    if (!authorUserId) {
      setIsFollowing(false);
      return;
    }
    if (authorUserId === session?.user?.id) {
      setIsFollowing(false);
      return;
    }
    (async () => {
      try {
        const result = await userService.isFollowingUser(authorUserId, session.accessToken);
        setIsFollowing(!!result.is_following);
        setFollowState(authorUserId, !!result.is_following);
      } catch (err) {
        console.error("Error fetching follow state:", err);
        setIsFollowing(false);
      }
    })();
  }, [isOpen, session?.accessToken, data.author, authorUserId, session?.user?.id, setFollowState]);

  const handleFollowAuthor = async () => {
    if (!session?.accessToken) {
      setIsShowSignin(true);
      return;
    }
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const result = await userService.followUser(authorUserId, session.accessToken);
      if (result.status !== code.success || result?.result !== "followed") {
        console.error("Follow failed", result);
        toast.error(result?.message || userFollowedFailed);
        setIsFollowing(false);
      } else {
        setIsFollowing(true);
        setFollowState(authorUserId, true);
        // Invalidate cache and trigger sync for current user
        const currentUserId = session?.user?.id;
        if (currentUserId) {
          localStorage.removeItem(FOLLOWING_KEY(currentUserId));
          localStorage.removeItem(FOLLOWERS_KEY(currentUserId));
        }
        localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
      }
    } catch (err) {
      console.error("Follow error", err);
      toast.error(userFollowedFailed);
      setIsFollowing(false);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowAuthor = async () => {
    if (!session?.accessToken) {
      setIsShowSignin(true);
      return;
    }
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const result = await userService.unfollowUser(authorUserId, session.accessToken);
      if (result.status !== code.success || result?.result !== "unfollowed") {
        console.error("Unfollow failed", result);
        toast.error(result?.message || userUnfollowedFailed);
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
        setFollowState(authorUserId, false);
        // Invalidate cache and trigger sync for current user
        const currentUserId = session?.user?.id;
        if (currentUserId) {
          localStorage.removeItem(FOLLOWING_KEY(currentUserId));
          localStorage.removeItem(FOLLOWERS_KEY(currentUserId));
        }
        localStorage.setItem(FOLLOW_SYNC_KEY, Date.now().toString());
      }
    } catch (err) {
      console.error("Unfollow error", err);
      toast.error(userUnfollowedFailed);
      setIsFollowing(true);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowClick = () => {
    if (!session?.accessToken) {
      setIsShowSignin(true);
      return;
    }
    if (isFollowing) {
      handleUnfollowAuthor();
    } else {
      handleFollowAuthor();
    }
  };

  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  const NextArrow = (props: Record<string, unknown>) => {
    const { onClick, length } = props;
    const display = activeSlide === length - 1 ? "none" : "block";

    return (
      <div
        className={`absolute !right-3 md:!right-6 z-10 top-1/2 size-8 md:h-[44px!important] md:w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretRight className="size-8 md:h-11 md:w-11 stroke-[#31343F]" />
      </div>
    );
  };

  const PrevArrow = (props: Record<string, unknown>) => {
    const { onClick } = props;
    const display = activeSlide === 0 ? "none" : "block";

    return (
      <div
        className={`absolute !left-3 md:!left-6 z-10 top-1/2 size-8 md:h-[44px!important] md:w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretLeft className="size-8 md:h-11 md:w-11 stroke-[#31343F]" />
      </div>
    );
  };

  type settings = {
    accessiblity: boolean;
    dots: boolean;
    arrows: boolean;
    infinite: boolean;
    speed: number;
    slidesToShow: number;
    slidesToScroll: number;
    centerMode: boolean;
    initialSlide: number;
    lazyLoad: boolean;
    responsive: Record<string, unknown>;
    variableWidth: boolean;
    swipeToSlide: boolean;
    swipe: boolean;
  };

  const settings: settings = {
    accessiblity: true,
    dots: true,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: false,
    initialSlide: 0,
    lazyLoad: false,
    variableWidth: false,
    swipeToSlide: false,
    swipe: false,
    responsive: [
      {
        breakpoint: 425,
        settings: {
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s: string) => capitalizeWords(s.trim()))
    .filter((s: string) => s.length > 0);


  const handleCommentReplySubmit = async () => {
    if (!commentReply.trim() || isLoading || cooldown > 0) return;
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    if (commentReply.length > reviewDescriptionDisplayLimit) {
      toast.error(maximumCommentReplies(reviewDescriptionDisplayLimit));
      return;
    }

    setIsLoading(true); // Ensure loading is set before optimistic update
    // Optimistically add reply at the top
    const optimisticReply = {
      id: `optimistic-${Date.now()}`,
      content: commentReply,
      author: { node: { name: session.user.name, databaseId: session.user.userId } },
      userAvatar: session.user.image || DEFAULT_USER_ICON,
      createdAt: new Date().toISOString(),
      userLiked: false,
      commentLikes: 0,
      isOptimistic: true,
      palates: session.user.palates || ""
    };
    setReplies(prev => [optimisticReply, ...prev]);
    setCommentReply("");

    try {
      const payload = {
        content: optimisticReply.content,
        restaurantId: data.commentedOn?.node?.databaseId,
        parent: data.databaseId,
        author: session?.user?.userId,
      };
      const res = await reviewService.postReview(payload, session?.accessToken ?? "");
      if (res.status === code.created) {
        toast.success(commentedSuccess);
        // Remove only the optimistic reply, then merge server replies (avoid duplicates)
        const updatedReplies = await reviewService.fetchCommentReplies(data.id);
        setReplies(prev => {
          // Remove optimistic reply
          const withoutOptimistic = prev.filter(r => !r.isOptimistic);
          // Merge: add any new replies from server not already in the list
          const merged = updatedReplies.concat(
            withoutOptimistic.filter(
              (local) => !updatedReplies.some((server: Record<string, unknown>) => server.id === local.id)
            )
          );
        setCooldown(5);
          return merged;
        });
      } else if (res.data?.code === 'comment_flood') {
        toast.error(commentFloodError);
        setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
      } else if (res.status === code.conflict) {
        toast.error(commentDuplicateError);
        setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
      } else {
        toast.error(errorOccurred);
        setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
      }
    } catch {
      console.error("Failed to post reply", err);
      toast.error(errorOccurred);
      setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
    } finally {
      setIsLoading(false); // Always reset loading
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveSlide(initialPhotoIndex);
      if (sliderRef.current) {
        sliderRef.current.slickGoTo(initialPhotoIndex);
      }
    }
  }, [isOpen, initialPhotoIndex]);

  useEffect(() => {
    if (isOpen && typeof userLikedProp === 'boolean') {
      setUserLiked(userLikedProp);
    }
  }, [isOpen, userLikedProp]);

  useEffect(() => {
    if (isOpen && typeof likesCountProp === 'number') {
      setLikesCount(likesCountProp);
    }
  }, [isOpen, likesCountProp]);

  const toggleLike = async () => {
    if (loading) return;

    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (userLiked) {
        // Already liked, so unlike
        response = await reviewService.unlikeComment(
          data.databaseId,
          session.accessToken ?? ""
        );
        if (response?.status === code.success) {
          toast.success(commentUnlikedSuccess)
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      } else {
        // Not liked yet, so like
        response = await reviewService.likeComment(
          data.databaseId,
          session.accessToken ?? ""
        );
        if (response?.status === code.success) {
          toast.success(commentLikedSuccess)
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      }

      setUserLiked(response.data?.userLiked);
      setLikesCount(response.data?.likesCount);
      if (onLikeChange) {
        onLikeChange(response.data?.userLiked, response.data?.likesCount);
      }
    } catch (error) {
      console.error(error);
      toast.error(updateLikeFailed);
    } finally {
      setLoading(false);
    }
  };

  const toggleReplyLike = async (replyId: number) => {
    // Find the reply by id or databaseId
    const reply = replies.find(r => r.id === replyId || r.databaseId === replyId);
    const dbId = reply?.databaseId || replyId;

    if (replyLoading[dbId]) return;

    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }
    setReplyLoading((prev) => ({ ...prev, [dbId]: true }));
    try {
      let response: Record<string, unknown>;
      if (reply?.userLiked) {
        response = await reviewService.unlikeComment(dbId, session.accessToken ?? "");
        if (response?.status === code.success) {
          toast.success(commentUnlikedSuccess)
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      } else {
        response = await reviewService.likeComment(dbId, session.accessToken ?? "");
        if (response?.status === code.success) {
          toast.success(commentLikedSuccess)
        } else {
          toast.error(updateLikeFailed);
          return;
        }
      }
      setReplies(prev =>
        prev.map(r =>
          (r.id === replyId || r.databaseId === dbId)
            ? {
              ...r,
              userLiked: response.data?.userLiked,
              commentLikes: response.data?.likesCount
            }
            : r
        )
      );
    } finally {
      setReplyLoading((prev) => ({ ...prev, [dbId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <CustomModal
        header={<></>}
        content={
          <div className="flex flex-col md:grid grid-cols-1 grid-rows-2 md:grid-rows-1 sm:grid-cols-2 !h-full md:h-[530px] lg:h-[640px] w-full auto-rows-min">
            {/* ================= AUTHOR SECTION ================= */}
            <div>
              <div className="justify-between px-3 py-2 pr-16 items-center flex md:hidden h-[60px] md:h-fit">
                <div className="review-card__user">
                  {session?.user ? (
                    <FallbackImage
                      src={data.userAvatar || DEFAULT_USER_ICON}
                      alt={data.author?.node?.name || "User"}
                      width={32}
                      height={32}
                      className="review-card__user-image !size-8 md:!size-11"
                      type={FallbackImageType.Icon}
                    />
                  ) : (
                    <FallbackImage
                      src={data.userAvatar || DEFAULT_USER_ICON}
                      alt={data.author?.node?.name || "User"}
                      width={32}
                      height={32}
                      className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                      onClick={() => handleProfileClick(data.author?.node?.databaseId)}
                      type={FallbackImageType.Icon}
                    />
                  )}
                  <div className="review-card__user-info">
                    <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                      {data.author?.name || "Unknown User"}
                    </h3>
                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                      {UserPalateNames?.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="review-block__palate-tag"
                        >
                          {palateFlagMap[tag.toLowerCase()] && (
                            <Image
                              src={palateFlagMap[tag.toLowerCase()]}
                              alt={`${tag} flag`}
                              width={18}
                              height={10}
                              className="w-[18px] h-[10px] rounded object-cover"
                            />
                          )}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Hide follow button if user is the reviewer */}
                {(!session?.user || (session?.user?.id !== (data.userId))) && (
                  <button
                    onClick={handleFollowClick}
                    className={`px-4 py-2 bg-[#E36B00] text-xs md:text-sm font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center ${isFollowing ? 'bg-[#494D5D] text-white' : 'text-[#FCFCFC]'} disabled:opacity-50 disabled:pointer-events-none`}
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
              <div className="review-card__image-container relative bg-black overflow-hidden hidden md:block">
                <span className="absolute top-4 right-4 md:top-5 md:right-5 z-10 bg-[#F1F1F1] px-3 py-2 rounded-[50px] text-sm leading-[17px] font-medium">{activeSlide + 1}/{data.reviewImages.length}</span>
                {/* @ts-expect-error react-slick Slider component type issue */}
                <Slider
                  ref={sliderRef}
                  {...settings}
                  initialSlide={initialPhotoIndex}
                  nextArrow={
                    <NextArrow length={data?.reviewImages?.length || 0} />
                  }
                  prevArrow={<PrevArrow />}
                  afterChange={(current: number) => setActiveSlide(current)}
                  // beforeChange={(current: any) => {
                  //   setActiveSlide(current + 1);
                  // }}
                  lazyLoad="progressive"
                >
                  {Array.isArray(data?.reviewImages) &&
                    data.reviewImages.length > 0 ? (
                    data.reviewImages.map((image: Record<string, unknown>, index: number) => (
                      <FallbackImage
                        key={index}
                        src={image?.sourceUrl}
                        alt="Review"
                        width={400}
                        height={400}
                        className="review-card__image !h-[70vh] md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] !w-full !object-contain sm:!rounded-l-3xl"
                      />
                    ))
                  ) : (
                    <Image
                      src={DEFAULT_IMAGE}
                      alt="Default"
                      width={400}
                      height={400}
                      className="review-card__image md:!h-[70vh] !max-h-[530px] lg:!max-h-[640px]  xl:!max-h-[720px] !w-full !object-cover sm:!rounded-l-3xl"
                    />
                  )}
                </Slider>
              </div>
            </div>
            <div>
              <div className="review-card__image-container bg-black overflow-hidden md:!hidden">
                <span className="absolute top-4 right-4 z-10 bg-[#F1F1F1] px-2 py-1 rounded-[50px] text-[10px] leading-3 font-medium">{activeSlide + 1}/{data.reviewImages.length}</span>
                {/* @ts-expect-error react-slick Slider component type issue */}
                <Slider
                  ref={sliderRef}
                  {...settings}
                  initialSlide={initialPhotoIndex}
                  nextArrow={
                    <NextArrow length={data?.reviewImages?.length || 0} />
                  }
                  prevArrow={<PrevArrow />}
                  afterChange={(current: number) => setActiveSlide(current)}
                  // beforeChange={(current: any) => {
                  //   setActiveSlide(current + 1);
                  // }}
                  lazyLoad="progressive"
                >
                  {Array.isArray(data?.reviewImages) &&
                    data.reviewImages.length > 0 ? (
                    data.reviewImages.map((image: Record<string, unknown>, index: number) => (
                      <FallbackImage
                        key={index}
                        src={image?.sourceUrl}
                        alt="Review"
                        width={400}
                        height={400}
                        className="review-card__image !h-[70vh] md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] !w-full !object-contain sm:!rounded-l-3xl"
                      />
                    ))
                  ) : (
                    <Image
                      src={DEFAULT_IMAGE}
                      alt="Default"
                      width={400}
                      height={400}
                      className="review-card__image !h-[530px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover sm:!rounded-l-3xl"
                    />
                  )}
                </Slider>
              </div>
              <div className="review-card__content h-fit md:h-[70vh] md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] !m-3 md:!m-0 md:!pt-4 md:!pb-14 md:relative overflow-y-auto md:overflow-y-hidden">
                <div className="justify-between pr-10 items-center hidden md:flex">
                  <div className="review-card__user">
                    {(data.author?.node?.id || data.id) ? (
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
                            className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                            style={{ cursor: "pointer" }}
                            type={FallbackImageType.Icon}
                          />
                        </Link>
                      ) : (
                        <FallbackImage
                          src={data.userAvatar || DEFAULT_USER_ICON}
                          alt={data.author?.node?.name || "User"}
                          width={32}
                          height={32}
                          className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                          onClick={() => handleProfileClick(data.author?.node?.id)}
                          type={FallbackImageType.Icon}
                        />
                      )
                    ) : (
                      <FallbackImage
                        src={data.userAvatar || DEFAULT_USER_ICON}
                        alt={data.author?.node?.name || "User"}
                        width={32}
                        height={32}
                        className="review-card__user-image !size-8 md:!size-11"
                        type={FallbackImageType.Icon}
                      />
                    )}
                    <div className="review-card__user-info">
                      {session?.user ? (
                        <Link
                          href={String(session.user.id) === String(data.author.node.id) ? PROFILE : PAGE(PROFILE, [data.author.node.id])}
                          passHref
                        >
                          <span className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold cursor-pointer hover:underline">
                            {data.author?.name || data.author?.node?.name || "Unknown User"}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold cursor-pointer hover:underline"
                          onClick={() => handleProfileClick(data.author?.node?.id)}
                        >
                          {data.author?.name || data.author?.node?.name || "Unknown User"}
                        </span>
                      )}
                      <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                        {UserPalateNames?.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="review-block__palate-tag"
                          >
                            {palateFlagMap[tag.toLowerCase()] && (
                              <Image
                                src={palateFlagMap[tag.toLowerCase()]}
                                alt={`${tag} flag`}
                                width={18}
                                height={10}
                                className="w-[18px] h-[10px] rounded object-cover"
                              />
                            )}
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Hide follow button if user is the reviewer */}
                  {(!session?.user || (session?.user?.id !== (data.userId))) && (
                    <button
                      onClick={handleFollowClick}
                      className={`px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center ${isFollowing ? 'bg-[#494D5D] text-white' : 'text-[#FCFCFC]'} disabled:opacity-50 disabled:pointer-events-none`}
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
                <div className="pb-16 overflow-hidden md:mt-4">
                  {/* ================= COMMENT SECTION ================= */}
                  <div className="h-full">
                    <div className="overflow-y-auto grow pr-1">
                      <div className="shrink-0">
                        <p className="text-sm font-semibold max-w-[450px] break-words">
                          {stripTags(data.reviewMainTitle || "").length > reviewTitleDisplayLimit ? (
                            <>
                              {showFullTitle
                                ? capitalizeWords(stripTags(data.reviewMainTitle || "")) + " "
                                : capitalizeWords(truncateText(stripTags(data.reviewMainTitle || ""), reviewTitleDisplayLimit)) + "… "}
                              <button
                                className="text-xs hover:underline inline font-bold"
                                onClick={() => setShowFullTitle(!showFullTitle)}
                              >
                                {showFullTitle ? "[Show Less]" : "[See More]"}
                              </button>
                            </>
                          ) : (
                            capitalizeWords(stripTags(data.reviewMainTitle || ""))
                          )}
                        </p>

                        <div className="h-full md:max-h-[280px] lg:max-h-[370px] xl:max-h-[380px] overflow-y-auto">
                          <p className="review-card__text w-full mt-2 text-sm font-normal break-words">
                            {stripTags(data.content || "").length > reviewDescriptionDisplayLimit ? (
                              <>
                                {showFullContent
                                  ? capitalizeWords(stripTags(data.content || ""))
                                  : capitalizeWords(truncateText(stripTags(data.content || ""), reviewDescriptionDisplayLimit)) + "…"}
                                {" "}
                                <button
                                  className="text-xs hover:underline inline font-bold"
                                  onClick={() => setShowFullContent(!showFullContent)}
                                >
                                  {showFullContent ? "[Show Less]" : "[See More]"}
                                </button>
                              </>
                            ) : (
                              capitalizeWords(stripTags(data.content || ""))
                            )}
                          </p>
                        </div>
                        <div className="review-card__rating pb-4 border-b border-[#CACACA] flex items-center gap-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const full = i + 1 <= data.reviewStars;
                            const half = !full && i + 0.5 <= data.reviewStars;
                            return full ? (
                              <Image
                                src={STAR_FILLED}
                                key={i}
                                width={16}
                                height={16}
                                className="size-4"
                                alt="star rating"
                              />
                            ) : half ? (
                              <Image src={STAR_HALF} key={i} width={16} height={16} className="size-4" alt="half star rating" />
                            ) : (
                                <Image
                                  src={STAR}
                                  key={i}
                                  width={16}
                                  height={16}
                                  className="size-4"
                                  alt="star rating"
                                />
                              );
                          })}
                          <span className="text-[#494D5D] text-[10px] md:text-sm">
                            &#8226;
                          </span>
                          <span className="review-card__timestamp">
                            {formatDate(data.date)}
                          </span>
                        </div>
                        {replies.length > 0 && (
                          <div className="pt-4 pr-1 pb-3 h-full md:max-h-[280px] lg:max-h-[320px] xl:max-h-[380px] overflow-y-auto overflow-x-hidden">
                            {replies.map((reply, index) => {
                              const replyUserLiked = reply.userLiked ?? false;
                              const replyUserLikedCounts = reply.commentLikes ?? 0;

                              return (
                                <div key={index} className="flex items-start gap-2 mb-4">
                                  {reply.author?.node?.id ? (
                                    session?.user ? (
                                      <Link
                                        href={String(session.user.id) === String(reply.author.node.id) ? PROFILE : PAGE(PROFILE, [reply.author.node.id])}
                                        passHref
                                      >
                                        <FallbackImage
                                          src={reply.userAvatar || DEFAULT_USER_ICON}
                                          alt={reply.author?.node?.name || "User"}
                                          width={44}
                                          height={44}
                                          className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                          type={FallbackImageType.Icon}
                                        />
                                      </Link>
                                    ) : (
                                      <FallbackImage
                                        src={reply.userAvatar || DEFAULT_USER_ICON}
                                        alt={reply.author?.node?.name || "User"}
                                        width={44}
                                        height={44}
                                        className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                        onClick={() => handleProfileClick(reply.author.node.id)}
                                        type={FallbackImageType.Icon}
                                      />
                                    )
                                  ) : reply.id ? (
                                    session?.user ? (
                                      <Link
                                        href={String(session.user.id) === String(reply.id) ? PROFILE : PAGE(PROFILE, [reply.id])}
                                        passHref
                                      >
                                        <FallbackImage
                                          src={reply.userAvatar || DEFAULT_USER_ICON}
                                          alt={reply.author?.node?.name || "User"}
                                          width={44}
                                          height={44}
                                          className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                          type={FallbackImageType.Icon}
                                        />
                                      </Link>
                                    ) : (
                                      <FallbackImage
                                        src={reply.userAvatar || DEFAULT_USER_ICON}
                                        alt={reply.author?.node?.name || "User"}
                                        width={44}
                                        height={44}
                                        className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                        onClick={() => handleProfileClick(reply.id)}
                                        type={FallbackImageType.Icon}
                                      />
                                    )
                                  ) : (
                                    <FallbackImage
                                      src={reply.userAvatar || DEFAULT_USER_ICON}
                                      alt={reply.author?.node?.name || "User"}
                                      width={44}
                                      height={44}
                                      className="review-card__user-image !size-8 md:!size-11"
                                      type={FallbackImageType.Icon}
                                    />
                                  )}
                                  <div className="review-card__user-info">
                                    <h3 className="review-card__username !text-xs md:!text-base !font-semibold">
                                      {session?.user ? (
                                        <Link
                                          href={String(session.user.id) === String(reply.author.node.id) ? PROFILE : PAGE(PROFILE, [reply.author.node.id])}
                                          passHref
                                        >
                                          <span className="review-card__username !text-xs md:!text-sm !font-semibold cursor-pointer hover:underline">
                                            {reply.author?.node?.name || "Unknown User"}
                                          </span>
                                        </Link>
                                      ) : (
                                        <span
                                          className="review-card__username !text-xs md:!text-sm !font-semibold cursor-pointer hover:underline"
                                          onClick={() => handleProfileClick(reply.author?.node?.id)}
                                        >
                                          {reply.author?.node?.name || "Unknown User"}
                                        </span>
                                      )}
                                    </h3>
                                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                                      {reply?.palates?.split("|").map((rawTag: string, tagIndex: number) => {
                                        const tag = rawTag.trim();
                                        return (
                                          <span
                                            key={tagIndex}
                                            className="review-block__palate-tag"
                                          >
                                            {palateFlagMap[tag.toLowerCase()] && (
                                              <Image
                                                src={palateFlagMap[tag.toLowerCase()]}
                                                alt={`${tag} flag`}
                                                width={18}
                                                height={10}
                                                className="w-[18px] h-[10px] rounded object-cover"
                                              />
                                            )}
                                            {capitalizeWords(tag)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <p className="review-card__text text-xs font-normal mt-1 text-[#494D5D] leading-[1.5] max-w-[420px] w-full break-words">
                                      {stripTags(reply.content || "").length > reviewDescriptionDisplayLimit ? (
                                        <>
                                          {expandedReplies[reply.id]
                                            ? capitalizeWords(stripTags(reply.content || ""))
                                            : capitalizeWords(truncateText(stripTags(reply.content || ""), reviewDescriptionDisplayLimit)) + "…"}
                                          {" "}
                                          <button
                                            className="text-xs hover:underline inline font-bold"
                                            onClick={() => toggleReplyContent(reply.id)}
                                          >
                                            {expandedReplies[reply.id] ? "[Show Less]" : "[See More]"}
                                          </button>
                                        </>
                                      ) : (
                                        capitalizeWords(stripTags(reply.content || ""))
                                      )}
                                    </p>
                                    <div className="flex items-center relative text-center">
                                      <button
                                        onClick={() => toggleReplyLike(reply.databaseId)}
                                        disabled={!!replyLoading[reply.databaseId]}
                                        aria-pressed={replyUserLiked}
                                        aria-label={replyUserLiked ? "Unlike comment" : "Like comment"}
                                        className="focus:outline-none cursor-pointer"
                                      >
                                        {replyLoading[reply.databaseId] ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
                                        ) : (
                                          <MdOutlineThumbUp
                                            className={`shrink-0 size-4 stroke-[#494D5D] transition-colors duration-200 ${replyUserLiked ? "text-blue-600" : ""}`}
                                          />
                                        )}
                                      </button>
                                      <span className="text-[#494D5D] ml-2 text-[10px] md:text-xs font-medium">
                                        {replyUserLikedCounts}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full shrink-0 border-t bg-white border-[#CACACA] p-4 md:p-6 absolute inset-x-0 bottom-0">
                    <div className="flex flex-row justify-start items-center gap-4">
                      {isLoading ? (
                        <div className="py-3 px-4 w-full border border-[#CACACA] rounded-[10px] text-gray-500 italic">
                          Sending...
                        </div>
                      ) : (
                        <textarea
                          rows={1}
                          cols={30}
                          placeholder={
                            cooldown > 0
                              ? `Please wait ${cooldown}s before commenting again...`
                              : "Add a comment"
                          }
                          value={commentReply}
                          onChange={(e) => setCommentReply(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentReplySubmit();
                            }
                          }}
                          disabled={cooldown > 0 || isLoading}
                          className="py-[11px] px-4 w-full border border-[#CACACA] text-gray-500 resize-none rounded-[10px]"
                        />
                      )}
                      <div className="flex gap-2 flex-row items-center">
                        <div className="flex items-center relative text-center">
                          <button
                            onClick={toggleLike}
                            disabled={loading}
                            aria-pressed={userLiked}
                            aria-label={
                              userLiked ? "Unlike comment" : "Like comment"
                            }
                            className="focus:outline-none cursor-pointer"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
                            ) : (
                              <MdOutlineThumbUp
                                className={`shrink-0 size-6 stroke-[#494D5D] transition-colors duration-200 ${userLiked ? "text-blue-600" : ""
                                  }`}
                              />
                            )}
                          </button>
                          <span className="ml-2 text-xs md:text-base">
                            {likesCount}
                          </span>
                        </div>
                        <div className="flex items-center relative text-center">
                          <button>
                            <MdOutlineComment className="shrink-0 size-6 stroke-[#494D5D]" />
                          </button>
                          <span className="ml-2 text-xs md:text-base">
                            {replies ? replies.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        isOpen={isOpen}
        setIsOpen={onClose}
        baseClass="h-full !max-w-[1280px] h-full md:h-[70vh] md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] m-0 rounded-none relative md:rounded-3xl"
        closeButtonClass="!top-5 md:!top-6 !right-3 z-10"
        headerClass="border-none !p-0"
        contentClass="!p-0 overflow-y-auto md:overflow-hidden"
        hasFooter={true}
        footer={<></>}
        footerClass="!p-0 hidden"
        overlayClass="!z-[1010]"
        wrapperClass="!z-[1010]"
        backdropClass="!z-[1010]"
      />
    </>
  );
};

export default ReviewDetailModal;
