"use client";
import React, { useEffect, useState } from "react";
import { FiX, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import "@/styles/components/_review-modal.scss";
import Image from "next/image";
import { stripTags, formatDate } from "../lib/utils"
import SignupModal from "./SignupModal";
import SigninModal from "./SigninModal";
import { RxCaretLeft, RxCaretRight } from "react-icons/rx";
import Slider from "react-slick";
import { ReviewService } from "@/services/Reviews/reviewService";
import { BsStarFill, BsStarHalf, BsStar } from 'react-icons/bs';
import { ReviewModalProps } from "@/interfaces/Reviews/review";
import { GraphQLReview } from "@/types/graphql";
import { useSession } from "next-auth/react";
import { useFollowContext } from "./FollowContext";

//styles
import 'slick-carousel/slick/slick-theme.css'
import 'slick-carousel/slick/slick.css'
import toast from "react-hot-toast";
import { authorIdMissing, userFollowedFailed, userUnfollowedFailed } from "@/constants/messages";
import FallbackImage, { FallbackImageType } from "./ui/Image/FallbackImage";
import { DEFAULT_IMAGE, DEFAULT_USER_ICON } from "@/constants/images";
import { UserService } from "@/services/user/userService";
import { responseStatusCode as code } from "@/constants/response";

const userService = new UserService();
const reviewService = new ReviewService();

const ReviewDetailModal: React.FC<ReviewModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const { setFollowState } = useFollowContext();
  const [replies, setReplies] = useState<GraphQLReview[]>([]);
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
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
      reviewService.fetchCommentReplies(data.id as string).then(setReplies);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    // Only run this once the modal is open, we have a session token,
    // and we can reliably read the author’s databaseId.
    if (!isOpen) return;
    if (!session?.accessToken) return;
    // prefer `data.author.node.databaseId`, fallback to data.author.databaseId
    const authorUserId = data.author?.node?.databaseId;
    if (!authorUserId) {
      setIsFollowing(false);
      return;
    }

    (async () => {
      try {
        const result = await userService.isFollowingUser(authorUserId as number, session.accessToken);        
        setIsFollowing(!!result.is_following);
        setFollowState(authorUserId as number, !!result.is_following);
      } catch (err) {
        console.error('Error fetching follow state:', err);
        setIsFollowing(false);
      }
    })();
  }, [isOpen, session?.accessToken, data.author, setFollowState]);

  const handleResize = () => {
    // Handle resize logic if needed
  };
  const NextArrow = (props: Record<string, unknown>) => {
    const { onClick, length } = props;
    const display = activeSlide === (length as number) - 1 ? "none" : "block";

    return (
      <div
        className={`absolute !right-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick as React.MouseEventHandler<HTMLDivElement>}
        style={{ display: display }}
      >
        <RxCaretRight className="h-11 w-11 stroke-black" />
      </div>
    );
  };

  const PrevArrow = (props: Record<string, unknown>) => {
    const { onClick } = props;
    const display = activeSlide === 0 ? "none" : "block";

    return (
      <div
        className={`absolute !left-0 z-10 top-1/2 h-[44px!important] w-[44px!important] transform bg-white rounded-full`}
        onClick={onClick as React.MouseEventHandler<HTMLDivElement>}
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
    responsive: Record<string, unknown>;
    variableWidth: boolean;
    swipeToSlide: boolean;
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
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 375,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          centerMode: false,
        },
      },
    ] as unknown as Record<string, unknown>,
  };

  const UserPalateNames = data.palates
    ?.split("|")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
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


  const handleFollowAuthor = async () => {
    if (!session?.accessToken) {
      setIsShowSignup(true);
      return;
    }
    // Always use the correct user id for the author (databaseId, integer)
    const authorUserId = data.author?.node?.databaseId;
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const result = await userService.followUser(authorUserId as number, session.accessToken);
      if (result.status !== code.success || result?.result !== "followed") {
        console.error("Follow failed", result);
        toast.error(result?.message || userFollowedFailed);
        setIsFollowing(false);
      } else {
        setIsFollowing(true);
        setFollowState(authorUserId as number, true);
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
    // Always use the correct user id for the author (databaseId, integer)
    const authorUserId = data.author?.node?.databaseId;
    if (!authorUserId) {
      toast.error(authorIdMissing);
      return;
    }
    setFollowLoading(true);
    try {
      const result = await userService.unfollowUser(authorUserId as number, session.accessToken);
      if (result.status !== code.success || result?.result !== "unfollowed") {
        console.error("Unfollow failed", result);
        toast.error(result?.message || userUnfollowedFailed);
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
        setFollowState(authorUserId as number, false);
      }
    } catch (err) {
      console.error("Unfollow error", err);
      toast.error(userUnfollowedFailed);
      setIsFollowing(true);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="review-modal !max-w-[1280px] h-[520px] lg:h-[640px] xl:h-[720px] !p-0 !rounded-3xl overflow-hidden font-inter">
        <button className="review-modal__close !top-6" onClick={onClose}>
          <FiX />
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 !h-[520px] lg:h-[640px]  xl:!h-[720px] w-full">
          <div className="review-card__image-container overflow-hidden">
            {/* @ts-expect-error react-slick Slider component type issue */}
            <Slider
              {...settings}
              nextArrow={<NextArrow length={data?.reviewImages?.length || 0} />}
              prevArrow={<PrevArrow />}
              beforeChange={(current: number) => {
                setActiveSlide(current + 1);
              }}
              // afterChange={(current: any) => {
              //   setActiveSlide(current);
              // }}
              lazyLoad="progressive"
            >
              {Array.isArray(data?.reviewImages) && data.reviewImages.length > 0 ? (
                data.reviewImages.map((image, index: number) => (
                  <FallbackImage
                    key={index}
                    src={image.sourceUrl}
                    alt="Review"
                    width={400}
                    height={400}
                    className="review-card__image !h-[520px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover !rounded-t-3xl sm:!rounded-l-3xl sm:rounded-t-none"
                  />
                ))
              ) : (
                <Image
                  src={DEFAULT_IMAGE}
                  alt="Default"
                  width={400}
                  height={400}
                  className="review-card__image !h-[520px] lg:!h-[640px]  xl:!h-[720px] !w-full !object-cover !rounded-t-3xl sm:!rounded-l-3xl sm:rounded-t-none"
                />
              )}
            </Slider>
          </div>
          <div className="review-card__content !m-2 sm:!m-0 !pb-10">
            <div className="flex justify-between pr-10 items-center">
              <div className="review-card__user">
                <FallbackImage
                  src={data.author?.node?.avatar?.url || DEFAULT_USER_ICON}
                  alt={data.author?.node?.name || "User"}
                  width={32}
                  height={32}
                  className="review-card__user-image !rounded-2xl"
                  type={FallbackImageType.Icon}
                />
                <div className="review-card__user-info">
                  <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                    {data.author?.name || data.author?.node?.name || "Unknown User"}
                  </h3>
                  <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                    {UserPalateNames?.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]"
                      >
                        {tag} {" "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!session?.accessToken) {
                    setIsShowSignin(true);
                  } else if (isFollowing) {
                    handleUnfollowAuthor();
                  } else {
                    handleFollowAuthor();
                  }
                }}
                className="px-4 py-2 bg-[#E36B00] text-xs font-semibold rounded-[50px] h-fit min-w-[80px] flex items-center justify-center"
                disabled={followLoading}
              >
                {followLoading ? (
                  <span className="animate-pulse">{isFollowing ? "Unfollowing..." : "Following..."}</span>
                ) : isFollowing ? "Following" : "Follow"}
              </button>
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

            <br></br>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="overflow-y-auto grow pr-1">
                  <div className="shrink-0">
                    <p className="text-sm font-semibold w-[304px] line-clamp-1">
                      {stripTags((data.reviewMainTitle as string) || "") || "Dorem ipsum dolor title."}
                    </p>
                    <p className="review-card__text w-[304] text-sm font-normal">
                      {stripTags((data.content as string) || "") || "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}
                    </p>
                    <div className="review-card__rating pb-4 border-b border-[#CACACA] flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => {
                        const full = i + 1 <= (data.reviewStars as number);
                        const half = !full && i + 0.5 <= (data.reviewStars as number);
                        return full ? (
                          <BsStarFill key={i} className="text-[#31343F]" />
                        ) : half ? (
                          <BsStarHalf key={i} className="text-[#31343F]" />
                        ) : (
                          <BsStar key={i} className="text-[#31343F]" />
                        );
                      })}
                      <span className="review-card__timestamp ml-2">{formatDate(data.date as string)}</span>
                    </div>
                    {replies.length > 0 && (
                      <div className="overflow-y-auto grow mt-4 border-t pt-4 pr-1">
                        {replies.map((reply, index) => {
                          const UserPalateNames = reply.palates
                            ?.split("|")
                            .map((s: string) => s.trim())
                            .filter((s: string) => s.length > 0);

                          return (
                            <div key={index} className="reply flex items-start gap-3 mb-3">
                              <FallbackImage
                                src={reply.author?.node?.avatar?.url || DEFAULT_USER_ICON}
                                alt={reply.author?.node?.name || "User"}
                                width={28}
                                height={28}
                                className="rounded-full"
                                type={FallbackImageType.Icon}
                              />
                              <div className="review-card__user-info">
                                <h3 className="review-card__username !text-['Inter,_sans-serif'] !text-base !font-bold">
                                  {reply.author?.node?.name || "Unknown User"}
                                </h3>

                                <div className="review-block__palate-tags flex flex-row flex-wrap gap-1">
                                  {UserPalateNames?.map((tag: string, tagIndex: number) => (
                                    <span
                                      key={tagIndex}
                                      className="review-block__palate-tag !text-[8px] text-white px-2 py-1 font-medium !rounded-[50px] bg-[#D56253]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <p className="review-card__text w-[304] text-sm font-normal">
                                  {stripTags((reply.content as string) || "") || "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."}
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
              <div className="shrink-0 border-t border-[#CACACA] pt-3 pb-10">
                <div className="flex flex-row justify-start items-center gap-10">
                  <textarea
                    rows={1}
                    cols={30}
                    placeholder="Add a comment"
                    className="p-2 border border-[#CACACA] resize-none"
                  ></textarea>
                  <div className="flex gap-2 flex-row items-center">
                    <div className="relative text-center">
                      <button className="mt-2">
                        <FiThumbsUp className="shrink-0 stroke-[#31343F]" />
                      </button>
                      <span className="ml-2">13</span>
                    </div>
                    <div className="relative text-center">
                      <button className="mt-2">
                        <FiMessageSquare className="shrink-0 stroke-[#31343F]" />
                      </button>
                      <span className="ml-2">10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
