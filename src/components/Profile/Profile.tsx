"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { UserService } from '@/services/userService';
import { ReviewedDataProps } from "@/interfaces/Reviews/review";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
  databaseId: number;
}

const Profile = () => {
  const { data: session, status } = useSession(); // Add status from useSession
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
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [palates, setPalates] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const user = session?.user;
  const targetUserId = user?.id;
  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
      rating: 4.5,
      databaseId: item.databaseId || 0, // Default to 0 if not present
      cuisineNames: item.cuisines || [],
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: "$$"
    }));
  };

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes);

      setRestaurants(prev => {
        if (!after) {
          // New search: replace list
          return transformed;
        }
        // Pagination: append unique restaurants only
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map(r => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setAfterCursor(data.pageInfo.endCursor);
      setHasMore(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, []);

  // Reset reviews when user changes or component unmounts
  useEffect(() => {
    setReviews([]);
    setEndCursor(null);
    setHasNextPage(true);
    isFirstLoad.current = true;
    return () => {
      // Cleanup when component unmounts
      setReviews([]);
      setEndCursor(null);
      isFirstLoad.current = true;
    };
  }, [targetUserId]);

  useEffect(() => {
    // Clear data immediately on tab/page change
    setReviews([]);
    if (status !== "loading" && targetUserId) {
      loadMore(); // Only load when session is ready and we have the userId
    }
  }, [status, targetUserId]); // Add dependencies

  // Setup Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
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
    if (loading || !hasNextPage || !targetUserId || status === "loading") return;
    setLoading(true);

    try {
      const first = isFirstLoad.current ? 16 : 8;
      const { reviews: newReviews, pageInfo } = await ReviewService.fetchUserReviews(
        targetUserId,
        first,
        endCursor
      );

      // Reset reviews array before setting new data
      if (isFirstLoad.current) {
        setReviews([]); // Clear existing reviews
        setTimeout(() => {
          setReviews(newReviews); // Set new reviews after a brief delay
        }, 0);
      } else {
        const existingIds = new Set(reviews.map(review => review.id));
        const uniqueNewReviews = newReviews.filter((review: any) => !existingIds.has(review.id));
        setReviews(prev => [...prev, ...uniqueNewReviews]);
      }

      setEndCursor(pageInfo.endCursor);
      setHasNextPage(pageInfo.hasNextPage);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    }
  };

  // Fetch following with cache
  const fetchFollowing = async () => {
    setFollowingLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowingLoading(false);
      return [];
    }

    // Try to get from cache first
    const cacheKey = `following_${targetUserId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Check if cache is less than 5 minutes old
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setFollowing(data);
        setFollowingLoading(false);
        return data;
      }
    }

    try {
      const followingList = await UserService.getFollowingList(targetUserId, session.accessToken);
      // Cache the new data
      localStorage.setItem(cacheKey, JSON.stringify({
        data: followingList,
        timestamp: Date.now()
      }));
      setFollowing(followingList);
      return followingList;
    } finally {
      setFollowingLoading(false);
    }
  };

  // Fetch followers with cache
  const fetchFollowers = async (followingList?: any[]) => {
    setFollowersLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowersLoading(false);
      return [];
    }

    // Try to get from cache first
    const cacheKey = `followers_${targetUserId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Check if cache is less than 1 minutes old
      if (Date.now() - timestamp < 1 * 60 * 1000) {
        setFollowers(data);
        setFollowersLoading(false);
        return data;
      }
    }

    try {
      const followersList = await UserService.getFollowersList(
        targetUserId,
        followingList || following,
        session.accessToken
      );
      // Cache the new data
      localStorage.setItem(cacheKey, JSON.stringify({
        data: followersList,
        timestamp: Date.now()
      }));
      setFollowers(followersList);
      return followersList;
    } finally {
      setFollowersLoading(false);
    }
  };

  // Separate effect for user data loading states
  useEffect(() => {
    if (!session?.user) {
      setNameLoading(true);
      setAboutMeLoading(true);
      setPalatesLoading(true);
      return;
    }
    setUserData(session.user);
    setNameLoading(false);
    setAboutMeLoading(false);
    setPalatesLoading(false);
  }, [session?.user]);

  useEffect(() => {
    if (!session?.accessToken || !targetUserId) return;

    const loadFollowData = async () => {
      setLoading(true);
      setFollowingLoading(true);
      setFollowersLoading(true);

      try {
        // Try to get following from cache first
        const followingCacheKey = `following_${targetUserId}`;
        const followersCacheKey = `followers_${targetUserId}`;
        let followingList = [];
        let followersList = [];

        const cachedFollowing = localStorage.getItem(followingCacheKey);
        const cachedFollowers = localStorage.getItem(followersCacheKey);

        if (cachedFollowing && cachedFollowers) {
          const { data: followingData, timestamp: followingTimestamp } = JSON.parse(cachedFollowing);
          const { data: followersData, timestamp: followersTimestamp } = JSON.parse(cachedFollowers);

          // Check if cache is less than 5 minutes old
          if (Date.now() - followingTimestamp < 5 * 60 * 1000 &&
            Date.now() - followersTimestamp < 5 * 60 * 1000) {
            setFollowing(followingData);
            setFollowers(followersData);
            return;
          }
        }

        // If cache miss or expired, fetch fresh data
        [followingList, followersList] = await Promise.all([
          UserService.getFollowingList(targetUserId, session.accessToken),
          UserService.getFollowersList(targetUserId, [], session.accessToken)
        ]);

        // Update state and cache
        setFollowing(followingList);
        setFollowers(followersList.map(user => ({
          ...user,
          isFollowing: followingList.some(f => f.id === user.id)
        })));

        // Cache the new data
        localStorage.setItem(followingCacheKey, JSON.stringify({
          data: followingList,
          timestamp: Date.now()
        }));
        localStorage.setItem(followersCacheKey, JSON.stringify({
          data: followersList,
          timestamp: Date.now()
        }));
      } finally {
        setFollowingLoading(false);
        setFollowersLoading(false);
        setLoading(false);
      }
    };

    loadFollowData();
  }, [session?.accessToken, targetUserId]);

  // const palateCuisineIds = useMemo(() => {
  //   return cuisines.filter((c) => palates.includes(c.name)).map((c) => c.id);
  // }, [palates]);

  // const filteredRestaurants = useMemo(() => {
  //   if (palateCuisineIds.length === 0) {
  //     return restaurants;
  //   }
  //   return restaurants.filter((rest) =>
  //     rest.cuisineIds.some((cId) => palateCuisineIds.includes(cId))
  //   );
  // }, [palateCuisineIds]);

  // Count user reviews (dummy data version)
  const userReviewCount = useMemo(() => {
    if (!user?.id) return 0;
    return reviews.filter((r: any) => r.authorId === user.id).length;
  }, [reviews, user?.id]);

  const handleFollow = async (id: number) => {
    if (!session?.accessToken) return;
    const success = await UserService.followUser(id, session.accessToken);
    if (success) {
      // Clear caches to force refresh
      localStorage.removeItem(`following_${targetUserId}`);
      localStorage.removeItem(`followers_${targetUserId}`);
      const newFollowing = await fetchFollowing();
      await fetchFollowers(newFollowing);
    }
  };

  const handleUnfollow = async (id: number) => {
    if (!session?.accessToken) return;
    const success = await UserService.unfollowUser(id, session.accessToken);
    if (success) {
      // Clear caches to force refresh
      localStorage.removeItem(`following_${targetUserId}`);
      localStorage.removeItem(`followers_${targetUserId}`);
      const newFollowing = await fetchFollowing();
      await fetchFollowers(newFollowing);
    }
  };

  // Build tab contents, using filteredRestaurants instead of the full list
  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} data={review} index={0} width={0} />
            ))}
          </div>
          <div ref={observerRef} className="flex justify-center text-center mt-6 min-h-[40px]">
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} profileTablist="listings" />
          ))}
        </div>
      ),
    },
    {
      id: "wishlists",
      label: "Wishlists",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} profileTablist="wishlists" />
          ))}
        </div>
      ),
    },
    {
      id: "checkin",
      label: "Check-in",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {restaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row self-center justify-center items-center sm:items-start gap-4 sm:gap-8 mt-6 sm:mt-10 mb-4 sm:mb-8 max-w-[624px] px-4 sm:px-0">
        <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] relative">
          <Image
            src={user?.image || "/profile-icon.svg"}
            fill
            className="rounded-full object-cover"
            alt="profile"
          />
        </div>
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 w-full sm:w-auto text-center sm:text-left">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start w-full">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-medium truncate">
                {nameLoading ? (
                  <span className="inline-block w-32 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  userData?.display_name || userData?.name || ""
                )}
              </h2>
              <div className="flex gap-1 mt-2 flex-wrap justify-center sm:justify-start">
                {palatesLoading ? (
                  <>
                    <span className="inline-block w-16 h-5 bg-gray-200 rounded-[50px] animate-pulse" />
                    <span className="inline-block w-20 h-5 bg-gray-200 rounded-[50px] animate-pulse" />
                  </>
                ) : (
                  userData?.palates?.split(/[|,]\s*/).map((palate: string, index: number) => {
                    const capitalizedPalate = palate
                      .trim()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                    return (
                      <span
                        key={index}
                        className="bg-[#FDF0EF] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]"
                      >
                        {capitalizedPalate}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div className="sm:ml-auto">
              <Link
                href="/profile/edit"
                className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-[50px] border-[1.2px] border-[#494D5D] text-[#494D5D] font-semibold text-xs sm:text-sm whitespace-nowrap"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <p className="text-sm px-4 sm:px-0">
            {aboutMeLoading ? (
              <span className="inline-block w-full h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              userData?.about_me
            )}
          </p>
          <div className="flex gap-4 sm:gap-6 mt-2 sm:mt-4 text-base sm:text-lg items-center justify-center sm:justify-start">
            <span className="cursor-default">
              <span className="font-bold cursor-default">
                {loading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  userReviewCount
                )}
              </span>{" "}
              <span className="cursor-default">Reviews</span>
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
              <span className="font-bold cursor-default">
                {followersLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  followers.length
                )}
              </span>{" "}
              <span
                className={
                  followersLoading || followers.length === 0
                    ? "cursor-default"
                    : "cursor-pointer"
                }
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
              <span className="font-bold cursor-default">
                {followingLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : (
                  following.length
                )}
              </span>{" "}
              <span
                className={
                  followingLoading || following.length === 0
                    ? "cursor-default"
                    : "cursor-pointer"
                }
              >
                Following
              </span>
            </button>
          </div>
        </div>
      </div>
      <FollowersModal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        followers={followers}
        onFollow={() => handleFollow}
        onUnfollow={() => handleUnfollow}
      />
      <FollowingModal
        open={showFollowing}
        onClose={() => {
          setShowFollowing(false);
          // Remove unfollowed users after modal closes
          setFollowing((prev) => prev.filter((u) => u.isFollowing));
        }}
        following={following}
        onUnfollow={() => handleUnfollow}
        onFollow={() => handleFollow}
      />
      <Tabs
        aria-label="Dynamic tabs"
        items={tabs}
        classNames={{
          tabWrapper: "w-full",
          base: "w-full border-b justify-start sm:justify-center min-w-max sm:min-w-0 px-4 sm:px-0",
          panel: "py-4 px-4 sm:px-10 w-full max-w-[80rem] mx-auto",
          tabList: "gap-4 w-fit relative rounded-none p-0 flex no-scrollbar sm:overflow-x-hidden",
          cursor: "w-full bg-[#31343F]",
          tab: "px-4 sm:px-6 py-3 h-[44px] font-semibold font-inter whitespace-nowrap",
          tabContent:
            "group-data-[selected=true]:text-[#31343F] text-[#494D5D] text-sm sm:text-base font-semibold",
        }}
        variant="underlined"
      >
        {(item) => (
          <Tab key={item.id} title={item.label}>
            <div className="bg-none rounded-none">
              <div>{item.content}</div>
            </div>
          </Tab>
        )}
      </Tabs>
    </>
  );
};

export default Profile;
