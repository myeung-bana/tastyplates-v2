"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiX, FiStar, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { stripTags, formatDate } from "../lib/utils";
import Link from "next/link";
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { useSession } from "next-auth/react";
import { useFollowContext } from "./FollowContext";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import Slider from "react-slick";
import { ReviewService } from "@/services/Reviews/reviewService";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";
import { ReviewModalProps } from "@/interfaces/Reviews/review";
import toast from 'react-hot-toast';

//styles
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import CustomModal from "./ui/Modal/Modal";
import { MdOutlineComment, MdOutlineThumbUp } from "react-icons/md";
import { authorIdMissing, commentedSuccess, commentLikedSuccess, commentUnlikedSuccess, updateLikeFailed, userFollowedFailed, userUnfollowedFailed } from "@/constants/messages";
import { palateFlagMap } from "@/utils/palateFlags";

const ReviewDetailModal: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
  initialPhotoIndex = 0,
}) => {
  const { data: session } = useSession();
  const { getFollowState, setFollowState } = useFollowContext();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [pendingShowSignup, setPendingShowSignup] = useState(false);
  // Effect to show signup modal
  useEffect(() => {
    if (pendingShowSignup) {
      setIsShowSignup(true);
      setPendingShowSignup(false);
    }
  }, [pendingShowSignup]);

  // Handler for profile image click (author or commenter)
  const handleProfileClick = (userId: number) => {
    if (!session?.user) {
      setPendingShowSignup(true);
    }
  };
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [commentReply, setCommentReply] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userLiked, setUserLiked] = useState(data.userLiked ?? false);
  // const [userLikedComment, setUserComment] = useState(replies.userLiked ?? false);
  const [likesCount, setLikesCount] = useState(data.commentLikes ?? 0);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState<{ [id: string]: boolean }>({});
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const authorUserId = data.userId;
  const defaultImage = "/images/default-image.png"
  const sliderRef = useRef<any>(null);

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
      ReviewService.fetchCommentReplies(data.id).then(setReplies);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    let timer: any;
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/is-following`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ user_id: authorUserId }),
          }
        );
        const result = await res.json();
        setIsFollowing(!!result.is_following);
        setFollowState(authorUserId, !!result.is_following);
      } catch (err) {
        console.error("Error fetching follow state:", err);
        setIsFollowing(false);
      }
    })();
  }, [isOpen, session?.accessToken, data.author]);

  const handleFollowAuthor = async () => {
    if (!session?.accessToken) {
      setIsShowSignup(true);
      return;
    }
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/follow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ user_id: authorUserId }),
        }
      );
      const result = await res.json();
      if (!res.ok || result?.result !== "followed") {
        console.error("Follow failed", result);
        toast.error(result?.message || userFollowedFailed);
        setIsFollowing(false);
      } else {
        setIsFollowing(true);
        setFollowState(authorUserId, true);
        // Invalidate cache and trigger sync for current user
        const currentUserId = session?.user?.id;
        if (currentUserId) {
          localStorage.removeItem(`following_${currentUserId}`);
          localStorage.removeItem(`followers_${currentUserId}`);
        }
        localStorage.setItem("follow_sync", Date.now().toString());
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
      setIsShowSignup(true);
      return;
    }
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/unfollow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ user_id: authorUserId }),
        }
      );
      const result = await res.json();
      if (!res.ok || result?.result !== "unfollowed") {
        console.error("Unfollow failed", result);
        toast.error(result?.message || userUnfollowedFailed);
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
        setFollowState(authorUserId, false);
        // Invalidate cache and trigger sync for current user
        const currentUserId = session?.user?.id;
        if (currentUserId) {
          localStorage.removeItem(`following_${currentUserId}`);
          localStorage.removeItem(`followers_${currentUserId}`);
        }
        localStorage.setItem("follow_sync", Date.now().toString());
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
      setIsShowSignup(true);
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

  const NextArrow = (props: any) => {
    const { className, style, onClick, length } = props;
    const display = activeSlide === length - 1 ? "none" : "block";

    return (
      <div
        className={`absolute !right-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretRight className="h-11 w-11 stroke-black" />
      </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    const display = activeSlide === 0 ? "none" : "block";

    return (
      <div
        className={`absolute !left-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick}
        style={{ display: display }}
      >
        <RxCaretLeft className="h-11 w-11 stroke-black" />
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
    responsive: any;
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
    .map((s: any) => s.trim())
    .filter((s: any) => s.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleCommentReplySubmit = async () => {
    if (!commentReply.trim() || isLoading || cooldown > 0) return;

    if (!session?.user) {
      setIsShowSignup(true);
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const payload = {
        content: commentReply,
        restaurantId: data.commentedOn?.node?.databaseId,
        parent: data.databaseId,
        author: session?.user?.userId,
      };

      await ReviewService.postReview(payload, session?.accessToken ?? "");
      toast.success(commentedSuccess)
      setCommentReply("");

      const updatedReplies = await ReviewService.fetchCommentReplies(data.id);
      setReplies(updatedReplies);
      setCooldown(5);
    } catch (err) {
      console.error("Failed to post reply", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async () => {
    if (loading) return;

    if (!session?.user) {
      setIsShowSignup(true);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (userLiked) {
        // Already liked, so unlike
        response = await ReviewService.unlikeComment(
          data.databaseId,
          session.accessToken ?? ""
        );
        toast.success(commentUnlikedSuccess)
      } else {
        // Not liked yet, so like
        response = await ReviewService.likeComment(
          data.databaseId,
          session.accessToken ?? ""
        );
        toast.success(commentLikedSuccess)
      }

      setUserLiked(response.userLiked);
      setLikesCount(response.likesCount);
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
      setIsShowSignup(true);
      return;
    }
    setReplyLoading((prev) => ({ ...prev, [dbId]: true }));
    try {
      let response;
      if (reply?.userLiked) {
        response = await ReviewService.unlikeComment(dbId, session.accessToken ?? "");
        toast.success(commentUnlikedSuccess)
      } else {
        response = await ReviewService.likeComment(dbId, session.accessToken ?? "");
        toast.success(commentLikedSuccess)
      }
      setReplies(prev =>
        prev.map(r =>
          (r.id === replyId || r.databaseId === dbId)
            ? {
              ...r,
              userLiked: response.userLiked,
              commentLikes: response.likesCount
            }
            : r
        )
      );
    } finally {
      setReplyLoading((prev) => ({ ...prev, [dbId]: false }));
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
                    <Image
                      src={data.userAvatar || "/profile-icon.svg"}
                      alt={data.author?.node?.name || "User"}
                      width={32}
                      height={32}
                      className="review-card__user-image !size-8 md:!size-11"
                    />
                  ) : (
                    <Image
                      src={data.userAvatar || "/profile-icon.svg"}
                      alt={data.author?.node?.name || "User"}
                      width={32}
                      height={32}
                      className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                      onClick={() => handleProfileClick(data.author?.node?.databaseId)}
                    />
                  )}
                  <div className="review-card__user-info">
                    <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                      {data.author?.name || "Unknown User"}
                    </h3>
                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                      {UserPalateNames?.map((tag: any, index: number) => (
                        <span
                          key={index}
                          className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#1b1b1b] flex items-center gap-1"
                        >
                          {palateFlagMap[tag.toLowerCase()] && (
                            <Image
                              src={palateFlagMap[tag.toLowerCase()]}
                              alt={`${tag} flag`}
                              width={12}
                              height={12}
                              className="rounded-full"
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
              <div className="review-card__image-container bg-black overflow-hidden hidden md:block">
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
                    data.reviewImages.map((image: any, index: number) => (
                      <Image
                        key={index}
                        src={image?.sourceUrl}
                        alt="Review"
                        width={400}
                        height={400}
                        className="review-card__image !h-[530px] lg:!h-[640px] xl:!h-[720px] !w-full !object-contain sm:!rounded-l-3xl"
                      />
                    ))
                  ) : (
                    <Image
                      src={defaultImage}
                      alt="Default"
                      width={400}
                      height={400}
                      className="review-card__image !h-[530px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover sm:!rounded-l-3xl"
                    />
                  )}
                </Slider>
              </div>
            </div>
            <div>
              <div className="review-card__image-container bg-black overflow-hidden md:!hidden">
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
                    data.reviewImages.map((image: any, index: number) => (
                      <Image
                        key={index}
                        src={image?.sourceUrl}
                        alt="Review"
                        width={400}
                        height={400}
                        className="review-card__image !h-[530px] lg:!h-[640px] xl:!h-[720px] !w-full !object-contain sm:!rounded-l-3xl"
                      />
                    ))
                  ) : (
                    <Image
                      src="http://localhost/wordpress/wp-content/uploads/2024/07/default-image.png"
                      alt="Default"
                      width={400}
                      height={400}
                      className="review-card__image !h-[530px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover sm:!rounded-l-3xl"
                    />
                  )}
                </Slider>
              </div>
              <div className="review-card__content h-fit md:h-[530px] lg:h-[640px] xl:h-[720px] !m-3 md:!m-0 md:!pt-4 md:!pb-14 md:relative overflow-y-auto md:overflow-y-hidden">
                <div className="justify-between pr-10 items-center hidden md:flex">
                  <div className="review-card__user">
                    {data.author?.node?.databaseId ? (
                      session?.user ? (
                        <Link
                          href={String(session.user.id) === String(data.author.node.databaseId) ? "/profile" : `/profile/${data.author.node.databaseId}`}
                          passHref
                        >
                          <Image
                            src={data.userAvatar || "/profile-icon.svg"}
                            alt={data.author?.node?.name || "User"}
                            width={32}
                            height={32}
                            className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                            style={{ cursor: "pointer" }}
                          />
                        </Link>
                      ) : (
                        <Image
                          src={data.userAvatar || "/profile-icon.svg"}
                          alt={data.author?.node?.name || "User"}
                          width={32}
                          height={32}
                          className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                          onClick={() => handleProfileClick(data.author?.node?.databaseId)}
                        />
                      )
                    ) : (
                      <Image
                        src={data.userAvatar || "/profile-icon.svg"}
                        alt={data.author?.node?.name || "User"}
                        width={32}
                        height={32}
                        className="review-card__user-image !size-8 md:!size-11"
                      />
                    )}
                    <div className="review-card__user-info">
                      <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                        {data.author?.name || "Unknown User"}
                      </h3>
                      <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                        {UserPalateNames?.map((tag: any, index: number) => (
                          <span
                            key={index}
                            className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#1b1b1b] flex items-center gap-1"
                          >
                            {palateFlagMap[tag.toLowerCase()] && (
                              <Image
                                src={palateFlagMap[tag.toLowerCase()]}
                                alt={`${tag} flag`}
                                width={12}
                                height={12}
                                className="rounded-full"
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
                        <p className="text-sm font-semibold w-[304px] line-clamp-2 md:line-clamp-3">
                          {stripTags(data.reviewMainTitle || "") ||
                            ""}
                        </p>
                        <p className="review-card__text w-full mt-2 text-sm font-normal line-clamp-3 md:line-clamp-4">
                          {stripTags(data.content || "") ||
                            ""}
                        </p>
                        <div className="review-card__rating pb-4 border-b border-[#CACACA] flex items-center gap-2">
                          {Array.from({ length: 5 }, (_, i) => {
                            const full = i + 1 <= data.reviewStars;
                            const half = !full && i + 0.5 <= data.reviewStars;
                            return full ? (
                              <Image
                                src="/star-filled.svg"
                                key={i}
                                width={16}
                                height={16}
                                className="size-4"
                                alt="star rating"
                              />
                            ) : (
                              <Image
                                src="/star.svg"
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
                          <div className="pt-4 pr-1 pb-3 h-full md:max-h-[280px] lg:max-h-[370px] xl:max-h-[460px] overflow-y-auto">
                            {replies.map((reply, index) => {
                              const replyUserLiked = reply.userLiked ?? false;
                              const replyUserLikedCounts = reply.commentLikes ?? 0;
                              const UserPalateNames = reply?.palates
                                ?.split("|")
                                .map((s: string) => s.trim())
                                .filter((s: string) => s.length > 0);

                              return (
                                <div key={index} className="flex items-start gap-2 mb-4">
                                  {reply.author?.node?.databaseId ? (
                                    session?.user ? (
                                      <Link
                                        href={String(session.user.id) === String(reply.author.node.databaseId) ? "/profile" : `/profile/${reply.author.node.databaseId}`}
                                        passHref
                                      >
                                        <Image
                                          src={reply.userAvatar || "/profile-icon.svg"}
                                          alt={reply.author?.node?.name || "User"}
                                          width={44}
                                          height={44}
                                          className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                        />
                                      </Link>
                                    ) : (
                                      <Image
                                        src={reply.userAvatar || "/profile-icon.svg"}
                                        alt={reply.author?.node?.name || "User"}
                                        width={44}
                                        height={44}
                                        className="review-card__user-image !size-8 md:!size-11 cursor-pointer"
                                        onClick={() => handleProfileClick(reply.author.node.databaseId)}
                                      />
                                    )
                                  ) : (
                                    <Image
                                      src={reply.userAvatar || "/profile-icon.svg"}
                                      alt={reply.author?.node?.name || "User"}
                                      width={44}
                                      height={44}
                                      className="review-card__user-image !size-8 md:!size-11"
                                    />
                                  )}
                                  <div className="review-card__user-info">
                                    <h3 className="review-card__username !text-xs md:!text-base !font-semibold">
                                      {reply.author?.node?.name || "Unknown User"}
                                    </h3>
                                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                                      {reply?.palates?.split("|").map((tag: string, tagIndex: number) => (
                                        <span
                                          key={tagIndex}
                                          className="review-block__palate-tag !text-[8px] leading-[14px] md:py-[3px] md:px-2 md:!text-xs text-white px-2 font-medium !rounded-[50px] bg-[#000000] flex items-center gap-1"
                                        >
                                          {palateFlagMap[tag.toLowerCase()] && (
                                            <Image
                                              src={palateFlagMap[tag.toLowerCase()]}
                                              alt={`${tag} flag`}
                                              width={12}
                                              height={12}
                                              className="rounded-full"
                                            />
                                          )}
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <p className="review-card__text w-full text-[10px] md:text-sm font-normal mt-1 text-[#494D5D] leading-[1.5]">
                                      {stripTags(reply.content || "") ||
                                        "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}
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
                          disabled={cooldown > 0}
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
        baseClass="h-full !max-w-[1060px] h-full md:h-[530px] lg:h-[640px] xl:h-[720px] m-0 rounded-none relative md:rounded-3xl"
        closeButtonClass="!top-5 md:!top-6 !right-3 z-10"
        headerClass="border-none !p-0"
        contentClass="!p-0 overflow-y-auto md:overflow-hidden"
        hasFooter={true}
        footer={<></>}
        footerClass="!p-0 hidden"
        overlayClass="!z-[1010]"
        wrapperClass="!z-[1010]"
      />
    </>
  );
};

export default ReviewDetailModal;
