// app/components/Profile.tsx (or wherever you place your reusable components)
"use client";
import React, { useRef, useState, useEffect } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_reviews.scss";
import { Tab, Tabs } from "@heroui/tabs";
import Image from "next/image";
import Link from "next/link";
import ReviewCard from "../ReviewCard";
import { Masonry } from "masonic";
import { useSession } from "next-auth/react";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { ReviewService } from "@/services/Reviews/reviewService";
import { UserService } from "@/services/userService";
import { ReviewedDataProps } from "@/interfaces/Reviews/review";
import { palateFlagMap } from "@/utils/palateFlags";
import { PROFILE_EDIT } from "@/constants/pages";
import toast from "react-hot-toast";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
  averageRating?: number;
  ratingsCount?: number;
}


interface ProfileProps {
  targetUserId: number;
}

// Update the component signature to accept props
const Profile = ({ targetUserId }: ProfileProps) => {
  const { data: session, status } = useSession();

  const [reviews, setReviews] = useState<ReviewedDataProps[]>([]);
  const [nameLoading, setNameLoading] = useState(true);
  const [aboutMeLoading, setAboutMeLoading] = useState(true);
  const [palatesLoading, setPalatesLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [userData, setUserData] = useState<any>(null);
  const [palates, setPalates] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const [wishlist, setWishlist] = useState<Restaurant[]>([]);
  const [listingLoading, setlistingLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [checkins, setCheckins] = useState<Restaurant[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [hasFetchedCheckins, setHasFetchedCheckins] = useState(false);
  const isViewingOwnProfile = session?.user?.id === targetUserId;
  const WELCOME_KEY = 'welcomeMessage';

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image:
        item.featuredImage?.node?.sourceUrl || "/images/default-image.png",
      rating: item.averageRating || 0,
      databaseId: item.databaseId || 0,
      palatesNames:
        Array.isArray(item?.palates?.nodes)
          ? item.palates.nodes.map((p: any) => p?.name ?? "Unknown")
          : [],
      streetAddress:
        item?.listingDetails?.googleMapUrl?.streetAddress || "",
      countries:
        Array.isArray(item?.countries?.nodes)
          ? item.countries.nodes.map((c) => c?.name ?? "Unknown").join(", ")
          : "Default Location",
      priceRange: item.priceRange ?? "N/A",
      averageRating: item.averageRating ?? 0,
      ratingsCount: item.ratingsCount ?? 0,
      status: item.status || "",
    }));
  };

  const statuses = isViewingOwnProfile ? ["PUBLISH", "DRAFT"] : ["PUBLISH"];
  const fetchRestaurants = async (
    first = 8,
    after: string | null = null,
    userId: number | undefined
  ) => {
    setLoading(true);
    setlistingLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(
        "",
        first,
        after,
        [],
        [],
        null,
        null,
        userId,
        null,
        null,
        null,
        statuses
      );
      const transformed = transformNodes(data.nodes);

      setRestaurants((prev) => {
        if (!after) {
          return transformed;
        }
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setAfterCursor(data.pageInfo.endCursor);
      setHasMore(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setlistingLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchRestaurants(8, null, targetUserId);
    }
    return () => {
      setRestaurants([]);
    };
  }, [targetUserId]);

  useEffect(() => {
    const welcomeMessage = localStorage?.getItem(WELCOME_KEY) ?? "";
    if (welcomeMessage) {
      toast.success(welcomeMessage, {
        duration: 3000, // 3 seconds
      });
      localStorage.removeItem(WELCOME_KEY);
    }

    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, []);

  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    setReviews([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    return () => {
      setReviews([]);
      setEndCursor(null);
      isFirstLoad.current = true;
    };
  }, [targetUserId]);

  useEffect(() => {
    setReviews([]);
    if (status !== "loading" && targetUserId) {
      loadMore();
    }
  }, [status, targetUserId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading]);

  const loadMore = async () => {
    if (loading || !hasNextPage || !targetUserId || status === "loading")
      return;
    setLoading(true);

    try {
      const first = isFirstLoad.current ? 16 : 8;
      const { reviews: newReviews, pageInfo, userCommentCount } =
        await ReviewService.fetchUserReviews(targetUserId, first, endCursor);

      if (isFirstLoad.current) {
        setReviews([]);
        setTimeout(() => {
          setReviews(newReviews);
        }, 0);
      } else {
        const existingIds = new Set(reviews.map((review) => review.id));
        const uniqueNewReviews = newReviews.filter(
          (review: any) => !existingIds.has(review.id)
        );
        setReviews((prev) => [...prev, ...uniqueNewReviews]);
      }

      setUserReviewCount(userCommentCount);
      setEndCursor(pageInfo.endCursor);
      setHasNextPage(pageInfo.hasNextPage);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => {
    const fetchPublicUserData = async () => {
      setNameLoading(true);
      setAboutMeLoading(true);
      setPalatesLoading(true);
      try {
        const publicUser = await UserService.getUserById(targetUserId);
        setUserData(publicUser);
      } catch (error) {
        console.error("Error fetching public user data:", error);
        setUserData(null);
      } finally {
        setNameLoading(false);
        setAboutMeLoading(false);
        setPalatesLoading(false);
      }
    };
    if (targetUserId) {
      fetchPublicUserData();
    } else {
      setUserData(null);
      setNameLoading(false);
      setAboutMeLoading(false);
      setPalatesLoading(false);
    }
  }, [targetUserId]);

  const fetchFollowing = async (forceRefresh = false) => {
    setFollowingLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowingLoading(false);
      return [];
    }
    try {
      const followingList = await UserService.getFollowingList(targetUserId, session.accessToken);
      setFollowing(followingList);
      return followingList;
    } finally {
      setFollowingLoading(false);
    }
  };

  const fetchFollowers = async (forceRefresh = false, followingList?: any[]) => {
    setFollowersLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowersLoading(false);
      return [];
    }
    try {
      const followersList = await UserService.getFollowersList(
        targetUserId,
        followingList || following,
        session.accessToken
      );
      setFollowers(followersList);
      return followersList;
    } finally {
      setFollowersLoading(false);
    }
  };

  useEffect(() => {
    // Only set userData from session.user if viewing own profile
    if (isViewingOwnProfile && session?.user) {
      setUserData(session.user);
      setNameLoading(false);
      setAboutMeLoading(false);
      setPalatesLoading(false);
    }
  }, [isViewingOwnProfile, session?.user]);
  useEffect(() => {
    if (!session?.accessToken || !targetUserId) return;
    const loadFollowData = async () => {
      setLoading(true);
      setFollowingLoading(true);
      setFollowersLoading(true);
      try {
        const followingList = await fetchFollowing();
        await fetchFollowers(false, followingList);
      } finally {
        setFollowingLoading(false);
        setFollowersLoading(false);
        setLoading(false);
      }
    };
    loadFollowData();
  }, [session?.accessToken, targetUserId]);
  useEffect(() => {
    // No cache sync needed, always fetch fresh
  }, [targetUserId]);

  const handleFollow = async (id: string) => {
    if (!session?.accessToken) return;
    const userIdNum = Number(id);
    if (isNaN(userIdNum)) return;
    const success = await UserService.followUser(userIdNum, session.accessToken);
    if (success) {
      localStorage.removeItem(`following_${targetUserId}`);
      localStorage.removeItem(`followers_${targetUserId}`);
      const [newFollowing, newFollowers] = await Promise.all([
        fetchFollowing(true),
        fetchFollowers(true)
      ]);
      setFollowers(prev => prev.map(user => ({
        ...user,
        isFollowing: (newFollowing || []).some((f: any) => f.id === user.id)
      })));
      localStorage.setItem('follow_sync', Date.now().toString());
    }
  };

  const handleUnfollow = async (id: string) => {
    if (!session?.accessToken) return;
    const userIdNum = Number(id);
    if (isNaN(userIdNum)) return;
    const success = await UserService.unfollowUser(userIdNum, session.accessToken);
    if (success) {
      localStorage.removeItem(`following_${targetUserId}`);
      localStorage.removeItem(`followers_${targetUserId}`);
      const [newFollowing, newFollowers] = await Promise.all([
        fetchFollowing(true),
        fetchFollowers(true)
      ]);
      setFollowers(prev => prev.map(user => ({
        ...user,
        isFollowing: (newFollowing || []).some((f: any) => f.id === user.id)
      })));
      localStorage.setItem('follow_sync', Date.now().toString());
    }
  };

  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };

  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <>
          {reviews.length > 0 ? (
            <Masonry
              items={reviews}
              render={ReviewCard}
              columnGutter={width > 1280 ? 32 : width > 767 ? 20 : 12}
              maxColumnWidth={304}
              columnCount={getColumns()}
              maxColumnCount={4}
            />
          ) : (
            !loading && (
              <div className="col-span-full text-center text-gray-400 py-12">
                No Reviews Yet.
              </div>
            )
          )}
          <div
            ref={observerRef}
            className="flex justify-center text-center mt-6 min-h-[40px]"
          >
            {loading && (
              <>
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin mr-2"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="164"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Loading...</span>
              </>
            )}
          </div>
        </>
      ),
    },
    {
      id: "listings",
      label: "Listings",
      content: (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {restaurants.length > 0 ? (
              restaurants.map((rest) => (
                <RestaurantCard
                  key={rest.id}
                  restaurant={rest}
                  profileTablist="listings"
                />
              ))
            ) : (
              !listingLoading && (
                <div className="col-span-full text-center text-gray-400 py-12">
                  No Listings Yet.
                </div>
              )
            )}
          </div>
          <div className="flex justify-center text-center mt-6 min-h-[40px]">
            {listingLoading && restaurants.length === 0 && (
              <>
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin mr-2"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="164"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Loading...</span>
              </>
            )}
          </div>
        </>
      ),
    },
    {
      id: "wishlists",
      label: "Wishlists",
      content: (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {wishlist.length > 0 ? (
              wishlist.map((rest) => (
                <RestaurantCard
                  key={rest.id}
                  restaurant={rest}
                  profileTablist="wishlists"
                  initialSavedStatus={true}
                />
              ))
            ) : (
              !wishlistLoading && (
                <div className="col-span-full text-center text-gray-400 py-12">
                  No Wishlisted Restaurants Yet.
                </div>
              )
            )}
          </div>
          <div className="flex justify-center text-center mt-6 min-h-[40px]">
            {wishlistLoading && wishlist.length === 0 && (
              <>
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin mr-2"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="164"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Loading...</span>
              </>
            )}
          </div>
        </>
      ),
    },
    {
      id: "checkin",
      label: "Check-in",
      content: (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {checkins.length > 0 ? (
              checkins.map((rest) => (
                <RestaurantCard
                  key={rest.id}
                  restaurant={rest}
                  profileTablist="checkin"
                  initialSavedStatus={wishlist.some(w => w.databaseId === rest.databaseId)}
                />
              ))
            ) : (
              !checkinsLoading && hasFetchedCheckins && (
                <div className="col-span-full text-center text-gray-400 py-12">
                  No Check-ins Yet.
                </div>
              )
            )}
          </div>
          <div className="flex justify-center text-center mt-6 min-h-[40px]">
            {checkinsLoading && !hasFetchedCheckins && (
              <>
                <svg
                  className="w-5 h-5 text-gray-500 animate-spin mr-2"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="164"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Loading...</span>
              </>
            )}
          </div>
        </>
      ),
    },
  ];

  const [hasFetchedWishlist, setHasFetchedWishlist] = useState(false);
  useEffect(() => {
    const fetchWishlist = async () => {
      if (hasFetchedWishlist) return; // Only fetch if not already fetched
      setWishlistLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorites/?user_id=${targetUserId}`,
          {
            headers: session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {},
            credentials: "include",
          }
        );
        const data = await res.json();
        const favoriteIds = data.favorites || [];
        if (favoriteIds.length === 0) {
          setWishlist([]);
        } else {
          const results = await Promise.all(
            favoriteIds.map((id: number) =>
              RestaurantService.fetchRestaurantById(String(id), "DATABASE_ID").catch(() => null)
            )
          );
          const validResults = results.filter(r => r && typeof r === "object" && r.id);
          const transformed = transformNodes(validResults);
          setWishlist(transformed);
        }
        setHasFetchedWishlist(true);
      } catch (e) {
        console.error("Error fetching wishlist:", e);
        setWishlist([]);
      } finally {
        setWishlistLoading(false);
      }
    };
    if (session && targetUserId) fetchWishlist();
    else {
      setWishlist([]);
      setHasFetchedWishlist(false);
    }
  }, [session, targetUserId, hasFetchedWishlist]);

  useEffect(() => {
    let didCancel = false;
    const fetchCheckins = async () => {
      if (hasFetchedCheckins) return; // Only fetch if not already fetched
      setCheckinsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/checkins/?user_id=${targetUserId}`,
          {
            headers: session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {},
            credentials: "include",
          }
        );
        const data = await res.json();
        const checkinIds = data.checkins || [];
        if (!didCancel) {
          if (checkinIds.length === 0) {
            setCheckins([]);
          } else {
            const results = await Promise.all(
              checkinIds.map((id: number) =>
                RestaurantService.fetchRestaurantById(String(id), "DATABASE_ID").catch(() => null)
              )
            );
            const validResults = results.filter(r => r && typeof r === "object" && r.id);
            const transformed = transformNodes(validResults);
            setCheckins(transformed);
          }
          setHasFetchedCheckins(true);
        }
      } catch (e) {
        if (!didCancel) setCheckins([]);
      } finally {
        if (!didCancel) setCheckinsLoading(false);
      }
    };
    if (session && targetUserId) {
      fetchCheckins();
    } else {
      setCheckins([]);
      setHasFetchedCheckins(false);
    }
    return () => {
      didCancel = true;
    };
  }, [session, targetUserId, hasFetchedCheckins]);

  // Reset all relevant state when targetUserId changes
  useEffect(() => {
    // Only reset state when targetUserId actually changes, not on window focus
    setUserData(null);
    setReviews([]);
    setRestaurants([]);
    setWishlist([]);
    setCheckins([]);
    setFollowers([]);
    setFollowing([]);
    setUserReviewCount(0);
    setEndCursor(null);
    setHasNextPage(true);
    setHasFetchedCheckins(false);
    setHasFetchedWishlist(false);
    setLoading(true);
    setNameLoading(true);
    setAboutMeLoading(true);
    setPalatesLoading(true);
  }, [targetUserId]);

  // Removed window focus refetch effect. User data is now only fetched on targetUserId change.

  return (
    <>
      <div className="w-full flex flex-row self-center justify-center items-start md:items-center sm:items-start gap-4 sm:gap-8 mt-6 sm:mt-10 mb-4 sm:mb-8 max-w-[624px] px-3 sm:px-0">
        <div className="w-20 h-20 sm:w-[120px] sm:h-[120px] relative">
          <FallbackImage
            src={
              userData?.image ||
              (userData?.userProfile?.profileImage?.node?.mediaItemUrl ?? DEFAULT_USER_ICON)
            }
            fill
            className="rounded-full object-cover"
            alt="profile"
            type={FallbackImageType.Avatar}
          />
        </div>
        <div className="flex flex-col justify-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto text-left">
          <div className="flex flex-row justify-between items-start md:items-center sm:items-start w-full">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-xl font-medium truncate">
                {nameLoading ? (
                  <span className="inline-block w-32 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  userData?.display_name || userData?.name || ""
                )}
              </h2>
              <div className="flex gap-1 mt-2 flex-wrap justify-start">
                {palatesLoading ? (
                  <>
                    <span className="inline-block w-16 h-5 bg-gray-200 rounded-[50px] animate-pulse" />
                    <span className="inline-block w-20 h-5 bg-gray-200 rounded-[50px] animate-pulse" />
                  </>
                ) : (
                  (userData?.userProfile?.palates || userData?.palates) ? (
                    (userData.userProfile?.palates || userData.palates)
                      .split(/[|,]\s*/)
                      .filter((palate: string) => palate.trim().length > 0)
                      .map((palate: string, index: number) => {
                        const capitalizedPalate = palate
                          .trim()
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ");
                        const flagSrc = palateFlagMap[capitalizedPalate.toLowerCase()];
                        return (
                          <span
                            key={index}
                            className="bg-[#1b1b1b] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00] flex items-center gap-1"
                          >
                            {flagSrc && (
                              <img
                                src={flagSrc}
                                alt={`${capitalizedPalate} flag`}
                                width={18}
                                height={10}
                                className="w-[18px] h-[10px] rounded object-cover"
                              />
                            )}
                            {capitalizedPalate}
                          </span>
                        );
                      })
                  ) : (
                    <span className="text-gray-400 text-xs">No palates set</span>
                  )
                )}
              </div>
            </div>
            {isViewingOwnProfile && (
              <div className="sm:ml-auto">
                <Link
                  href={PROFILE_EDIT}
                  className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-[50px] border-[1.2px] border-[#494D5D] text-[#494D5D] font-semibold text-xs sm:text-sm whitespace-nowrap"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
          <p className="text-[10px] md:text-sm">
            {aboutMeLoading ? (
              <span className="inline-block w-full h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              userData?.userProfile?.aboutMe || userData?.about_me || <span className="text-gray-400">No bio set</span>
            )}
          </p>
          <div className="flex gap-4 sm:gap-6 mt-2 sm:mt-4 text-base sm:text-lg items-center justify-start">
            <span className="cursor-default">
              <span className="text-xs md:text-base font-semibold cursor-default">
                {loading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  userReviewCount
                )}
              </span>{" "}
              <span className="cursor-default text-[10px] md:text-sm">
                Reviews
              </span>
            </span>
            <button
              type="button"
              className="text-primary focus:outline-none"
              onClick={() => {
                if (followers.length > 0) {
                  setShowFollowers(true);
                }
              }}
              disabled={followersLoading || followers.length === 0}
            >
              <span className="text-xs md:text-base font-semibold cursor-default">
                {followersLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  followers.length
                )}
              </span>{" "}
              <span
                className={`${followersLoading || followers.length === 0
                  ? "cursor-default"
                  : "cursor-pointer"
                  } text-[10px] md:text-sm`}
              >
                Followers
              </span>
            </button>
            <button
              type="button"
              className="text-primary focus:outline-none"
              onClick={() => {
                if (following.length > 0) {
                  setShowFollowing(true);
                }
              }}
              disabled={followingLoading || following.length === 0}
            >
              <span className="text-xs md:text-base font-semibold cursor-default">
                {followingLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  following.length
                )}
              </span>{" "}
              <span
                className={`${followingLoading || following.length === 0
                  ? "cursor-default"
                  : "cursor-pointer"
                  } text-[10px] md:text-sm`}
              >
                Following
              </span>
            </button>
          </div>
          {!isViewingOwnProfile && userData?.databaseId && session?.accessToken && (
            <div className="mt-4">
              {following.some((f: any) => f.id === userData.databaseId) ? (
                <button
                  onClick={() => handleUnfollow(String(userData.databaseId))}
                  className="py-2 px-4 rounded-[50px] border-[1.2px] border-red-500 text-red-500 font-semibold text-sm whitespace-nowrap"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(String(userData.databaseId))}
                  className="py-2 px-4 rounded-[50px] bg-blue-500 text-white font-semibold text-sm whitespace-nowrap"
                >
                  Follow
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <FollowersModal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        followers={followers}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
      <FollowingModal
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        following={following}
        onUnfollow={handleUnfollow}
        onFollow={handleFollow}
      />
      <Tabs
        aria-label="Dynamic tabs"
        items={tabs}
        classNames={{
          tabWrapper: "w-full",
          base: "w-full border-b justify-center min-w-max sm:min-w-0 px-0",
          panel:
            "py-4 px-0 justify-start px-3 md:px-4 lg:px-6 xl:px-0 w-full max-w-[82rem] mx-auto",
          tabList:
            "gap-0 md:gap-4 w-fit relative rounded-none p-0 flex no-scrollbar sm:overflow-x-hidden",
          cursor: "w-full bg-[#31343F]",
          tab: "px-4 sm:px-6 py-3 h-[44px] font-semibold font-inter whitespace-nowrap",
          tabContent:
            "group-data-[selected=true]:text-[#31343F] text-xs sm:text-base font-semibold",
        }}
        variant="underlined"
      >
        {(item) => (
          <Tab key={item.id} title={item.label}>
            <div className="bg-none rounded-none">
              {item.content}
            </div>
          </Tab>
        )}
      </Tabs>
    </>
  );
};

export default Profile;