"use client";
import React, { useEffect, useState } from "react";
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

//styles
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import CustomModal from "./ui/Modal/Modal";
import { MdOutlineComment, MdOutlineThumbUp } from "react-icons/md";

const ReviewDetailModal: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const { getFollowState, setFollowState } = useFollowContext();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
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
  const [likesCount, setLikesCount] = useState(data.commentLikes ?? 0);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

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
      console.log("userLiked on open:", data.userLiked);
      setUserLiked(data.userLiked ?? false);
      setLikesCount(data.likesCount ?? data.commentLikes ?? 0);
    }
  }, [isOpen, data]);

  useEffect(() => {
    // Fetch initial follow state when modal opens and author is available
    if (!isOpen) return;
    if (!session?.accessToken) return;
    const authorUserId = data.author?.node?.databaseId || data.userId;
    if (!authorUserId) {
      setIsFollowing(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/is-following`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ user_id: authorUserId }),
          }
        );
        const result = await res.json();
        setIsFollowing(!!result.is_following);
        setFollowState(authorUserId, !!result.is_following);
      } catch (err) {
        console.error('Error fetching follow state:', err);
        setIsFollowing(false);
      }
    })();
  }, [isOpen, session?.accessToken, data.author]);

  const handleFollowAuthor = async () => {
    if (!session?.accessToken) {
      setIsShowSignup(true);
      return;
    }
    const authorUserId = data.author?.node?.databaseId || data.userId;
    if (!authorUserId) {
      alert("Author user ID is missing.");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ user_id: authorUserId }),
      });
      const result = await res.json();
      if (!res.ok || result?.result !== "followed") {
        console.error("Follow failed", result);
        alert(result?.message || "Failed to follow user. Please try again.");
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
        localStorage.setItem('follow_sync', Date.now().toString());
      }
    } catch (err) {
      console.error("Follow error", err);
      alert("Failed to follow user. Please try again.");
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
    const authorUserId = data.author?.node?.databaseId || data.userId;
    if (!authorUserId) {
      alert("Author user ID is missing.");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ user_id: authorUserId }),
      });
      const result = await res.json();
      if (!res.ok || result?.result !== "unfollowed") {
        console.error("Unfollow failed", result);
        alert(result?.message || "Failed to unfollow user. Please try again.");
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
        localStorage.setItem('follow_sync', Date.now().toString());
      }
    } catch (err) {
      console.error("Unfollow error", err);
      alert("Failed to unfollow user. Please try again.");
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
    swipe: boolean
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
        breakpoint: 375,
        settings: {
          arrows: false,
        },
      },
    ],
  };

  const UserPalateNames = data?.palates
    ?.split("|")
    .map((s: any) => s.trim())
    .filter((s: any) => s.length > 0);
  //   .map((id) => {
  //     const palate = palates.find((p) => p.id === id);
  //     return palate ? palate.name : null;
  //   })
  //   .filter((name) => name);

  // const restaurantPalateNames = restaurant?.cuisineIds
  //   .map((rid) => {
  //     const palate = palates.find((p) => p.cuisineId === rid);
  //     return palate ? palate.name : null;
  //   })
  //   .filter((name) => name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleCommentReplySubmit = async () => {
    if (!commentReply.trim() || isLoading || cooldown > 0) return;

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
      } else {
        // Not liked yet, so like
        response = await ReviewService.likeComment(
          data.databaseId,
          session.accessToken ?? ""
        );
      }

      setUserLiked(response.userLiked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error(error);
      alert('Error updating like');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <CustomModal
        header={<></>}
        content={
          <div className="grid grid-cols-1 grid-rows-2 md:grid-rows-1 sm:grid-cols-2 !h-full md:!h-[520px]  xl:!h-[720px] w-full auto-rows-min">
            <div>
              <div className="justify-between px-3 py-2 pr-16 items-center flex md:hidden">
                <div className="review-card__user">
                  <Image
                    src={data.userAvatar || "/profile-icon.svg"}
                    alt={data.author?.node?.name || "User"}
                    width={32}
                    height={32}
                    className="review-card__user-image"
                  />
                  <div className="review-card__user-info">
                    <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                      {data.author?.name || "Unknown User"}
                    </h3>
                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                      {UserPalateNames?.map((tag: any, index: number) => (
                        <span
                          key={index}
                          className="review-block__palate-tag !text-[8px] text-white px-2 font-medium !rounded-[50px] bg-[#D56253]"
                        >
                          {tag} {" "}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Hide follow button if user is the reviewer */}
                {(!session?.user || (session?.user?.id !== (data.author?.node?.databaseId || data.author?.databaseId))) && (
                  <button
                    onClick={handleFollowClick}
                    className={`px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center ${isFollowing ? 'bg-[#494D5D] text-white' : ''}`}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <span className="animate-pulse">{isFollowing ? "Unfollowing..." : "Following..."}</span>
                    ) : isFollowing ? "Following" : "Follow"}
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
              <div className="review-card__image-container">
                <Slider
                  {...settings}
                  nextArrow={
                    <NextArrow length={data?.reviewImages?.length || 0} />
                  }
                  prevArrow={<PrevArrow />}
                  beforeChange={(current: any) => {
                    setActiveSlide(current + 1);
                  }}
                  // afterChange={(current: any) => {
                  //   setActiveSlide(current);
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
                        className="review-card__image !h-[530px] lg:!h-[640px] xl:!h-[720px] !w-full !object-cover sm:!rounded-l-3xl"
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
            </div>
            <div className="review-card__content h-full md:h-[530px] lg:h-[640px] xl:h-[720px] !m-3 md:!m-0 md:!pt-4 md:!pb-14 md:relative overflow-y-auto">
              <div className="justify-between pr-10 items-center hidden md:flex">
                <div className="review-card__user">
                  <Image
                    src={data.userAvatar || "/profile-icon.svg"}
                    alt={data.author?.node?.name || "User"}
                    width={32}
                    height={32}
                    className="review-card__user-image"
                  />
                  <div className="review-card__user-info">
                    <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                      {data.author?.name || "Unknown User"}
                    </h3>
                    <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                      {UserPalateNames?.map((tag: any, index: number) => (
                        <span
                          key={index}
                          className="review-block__palate-tag !text-[8px] text-white px-2 font-medium !rounded-[50px] bg-[#D56253]"
                        >
                          {tag} {" "}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Hide follow button if user is the reviewer */}
                {(!session?.user || (session?.user?.id !== (data.author?.node?.databaseId || data.author?.databaseId))) && (
                  <button
                    onClick={handleFollowClick}
                    className={`px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center ${isFollowing ? 'bg-[#494D5D] text-white' : ''}`}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <span className="animate-pulse">{isFollowing ? "Unfollowing..." : "Following..."}</span>
                    ) : isFollowing ? "Following" : "Follow"}
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
              <div className="flex flex-col overflow-hidden md:mt-4">
                <div className="flex flex-col h-full">
                  <div className="overflow-y-auto grow pr-1">
                    <div className="shrink-0">
                      <p className="text-sm font-semibold w-[304px] line-clamp-2 md:line-clamp-3">
                        {stripTags(data.reviewMainTitle || "") ||
                          "Dorem ipsum dolor title."}
                      </p>
                      <p className="review-card__text w-[304] mt-2 text-sm font-normal line-clamp-3 md:line-clamp-4">
                        {stripTags(data.content || "") ||
                          "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}
                      </p>
                      <div className="review-card__rating pb-4 border-b border-[#CACACA] flex items-center gap-2">
                        {Array.from({ length: 5 }, (_, i) => {
                          const full = i + 1 <= data.reviewStars;
                          const half = !full && i + 0.5 <= data.reviewStars;
                          return full ? (
                            <Image src="/star-filled.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
                          ) : (
                            <Image src="/star.svg" key={i} width={16} height={16} className="size-4" alt="star rating" />
                          );
                        })}
                        <span className="text-[#494D5D] text-[10px] md:text-sm">&#8226;</span>
                        <span className="review-card__timestamp">
                          {formatDate(data.date)}
                        </span>
                      </div>
                      {replies.length > 0 && (
                        <div className="overflow-y-auto grow pt-4 pr-1 pb-3 h-[350px]">
                          {replies.map((reply, index) => {
                            const UserPalateNames = reply?.palates
                              ?.split("|")
                              .map((s: string) => s.trim())
                              .filter((s: string) => s.length > 0);

                            return (
                              <div
                                key={index}
                                className="reply flex items-start gap-3 mb-3"
                              >
                                <Image
                                  src={
                                    reply.userAvatar ||
                                    "/profile-icon.svg"
                                  }
                                  alt={reply.author?.node?.name || "User"}
                                  width={28}
                                  height={28}
                                  className="review-card__user-image"
                                />
                                <div className="review-card__user-info">
                                  <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                                    {reply.author?.node?.name || "Unknown User"}
                                  </h3>

                                  <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                                    {UserPalateNames?.map(
                                      (tag: string, tagIndex: number) => (
                                        <span
                                          key={tagIndex}
                                          className="review-block__palate-tag !text-[8px] text-white px-2 font-medium !rounded-[50px] bg-[#D56253]"
                                        >
                                          {tag}
                                        </span>
                                      )
                                    )}
                                  </div>

                                  <p className="review-card__text w-[304] text-sm font-normal">
                                    {stripTags(reply.content || "") ||
                                      "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* {replies.length > 0 && (
                      <div className="overflow-y-auto grow mt-4 border-t pt-4 pr-1">
                        {replies.map((reply, index) => (
                          
                          <div key={index} className="reply flex items-start gap-3 mb-3">
                            <Image
                              src={reply.author?.node?.avatar?.url || "/profile-icon.svg"}
                              alt={reply.author?.name || "User"}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                            <div className="review-card__user-info">
                              <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                                {reply.author?.name || "Unknown User"}
                              </h3>
                              <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                                {UserPalateNames?.map((tag: any, index: number) => (
                                  <span
                                    key={index}
                                    className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]"
                                  >
                                    {tag}{" "}
                                  </span>
                                ))}
                              </div>
                              <p className="review-card__text w-[304] text-sm font-normal">{stripTags(reply.content || "") || "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )} */}
                    </div>
                  </div>
                </div>
                {/* <div className="review-card__header">
              <div className="review-card__user-info">
                <h3>{restaurant?.name}</h3>
                <Link
                  href={`/restaurants/${data.id}`}
                  className="review-card__restaurant"
                >
                  {restaurant?.address}
                </Link>
              </div>
              </div> */}
                <div className="w-full shrink-0 border-t border-[#CACACA] p-4 md:p-6 absolute inset-x-0 bottom-6">
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
                        className="py-3 px-4 w-full border border-[#CACACA] resize-none rounded-[10px]"
                      />
                    )}
                    <div className="flex gap-2 flex-row items-center">
                      <div className="flex items-center relative text-center">
                        <button
                          onClick={toggleLike}
                          disabled={loading}
                          aria-pressed={userLiked}
                          aria-label={userLiked ? "Unlike comment" : "Like comment"}
                          className="focus:outline-none cursor-pointer"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-[2px] border-blue-400 border-t-transparent"></div>
                          ) : (
                            <MdOutlineThumbUp
                              className={`shrink-0 size-6 stroke-[#494D5D] transition-colors duration-200 ${userLiked ? 'text-blue-600' : ''
                                }`}
                            />
                          )}
                        </button>
                        <span className="ml-2">{likesCount}</span>
                      </div>
                      <div className="flex items-center relative text-center">
                        <button>
                          <MdOutlineComment className="shrink-0 size-6 stroke-[#494D5D]" />
                        </button>
                        <span className="ml-2">{replies ? replies.length : 0}</span>
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
        baseClass="h-full md:h-3/4 !max-w-[1060px] max-h-full md:max-h-[530px] lg:max-h-[640px] xl:max-h-[720px] m-0 rounded-none relative md:rounded-3xl"
        closeButtonClass="!top-5 md:!top-6 !right-3 z-10"
        headerClass="border-none !p-0"
        contentClass="!p-0"
        hasFooter={true}
        footer={<></>}
        footerClass="!p-0 hidden"
      />
    </>
  );
};

export default ReviewDetailModal;
