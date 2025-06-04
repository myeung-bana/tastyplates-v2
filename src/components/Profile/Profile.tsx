"use client";
import React, {  useRef, useState, useEffect, useMemo } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
import "@/styles/pages/_reviews.scss";
import { restaurants } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import { Tab, Tabs } from "@heroui/tabs";
import Image from "next/image";
import Link from "next/link";
import ReviewCard from "../ReviewCard";
import { Masonry } from "masonic";
import { getAllReviews } from "@/utils/reviewUtils";
import { useSession } from "next-auth/react";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";

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
import { UserService } from '@/services/userService';

const Profile = () => {
  const { data: session } = useSession();
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

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
    // 
  };

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, []);

  const reviews = getAllReviews();
  const user = session?.user;
  const targetUserId = user?.id;

  // Fetch following
  const fetchFollowing = async () => {
    setFollowingLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowingLoading(false);
      return [];
    }
    const followingList = await UserService.getFollowingList(targetUserId, session.accessToken);
    setFollowing(followingList);
    return followingList;
  };

  // Fetch followers
  const fetchFollowers = async (followingList?: any[]) => {
    setFollowersLoading(true);
    if (!session?.accessToken || !targetUserId) {
      setFollowersLoading(false);
      return [];
    }
    const followersList = await UserService.getFollowersList(
      targetUserId,
      followingList || following,
      session.accessToken
    );
    setFollowers(followersList);
    return followersList;
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

    setLoading(true);
    Promise.all([
      (async () => {
        setFollowingLoading(true);
        setFollowersLoading(true);
        try {
          const [followingList, followersList] = await Promise.all([
            UserService.getFollowingList(targetUserId, session.accessToken),
            UserService.getFollowersList(targetUserId, [], session.accessToken)
          ]);

          setFollowing(followingList);
          setFollowers(followersList.map(user => ({
            ...user,
            isFollowing: followingList.some(f => f.id === user.id)
          })));
        } finally {
          setFollowingLoading(false);
          setFollowersLoading(false);
        }
      })(),
    ]).finally(() => {
      setLoading(false);
    });
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
      const newFollowing = await fetchFollowing();
      await fetchFollowers(newFollowing);
    }
  };

  const handleUnfollow = async (id: number) => {
    if (!session?.accessToken) return;
    const success = await UserService.unfollowUser(id, session.accessToken);
    if (success) {
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
        <Masonry
          items={reviews as any}
          render={ReviewCard}
          columnGutter={32}
          maxColumnWidth={304}
          columnCount={4}
          maxColumnCount={4}
        />
      ),
    },
    {
      id: "listings",
      label: "Listings",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "wishlists",
      label: "Wishlists",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "checkin",
      label: "Check-in",
      content: (
        <div className="restaurants__container">
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex self-center justify-center items-center gap-8 mt-10 mb-8 max-w-[624px]">
        <Image
          src={user?.image || "/profile-icon.svg"}
          width={120}
          height={120}
          className="rounded-full"
          alt="profile"
        />
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex gap-4 items-start w-full">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-medium truncate">
                {nameLoading ? (
                  <span className="inline-block w-32 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  userData?.display_name || ""
                )}
              </h2>
              <div className="flex gap-1 mt-2 flex-wrap">
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
            <div className="ml-auto">
              <Link
                href="/profile/edit"
                className="py-2 px-4 rounded-[50px] border-[1.2px] border-[#494D5D] text-[#494D5D] font-semibold text-sm whitespace-nowrap"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <p className="text-sm">
            {aboutMeLoading ? (
              <span className="inline-block w-full h-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              userData?.about_me
            )}
          </p>
          <div className="flex gap-6 mt-4 text-lg items-center">
            <span>
              <span className="font-bold">
                {loading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : userReviewCount}
              </span> Reviews
            </span>
            <button
              type="button"
              className="text-primary focus:outline-none"
              onClick={() => setShowFollowers(true)}
            >
              <span className="font-bold">
                {followersLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : followers.length}
              </span> Followers
            </button>
            <button
              type="button"
              className="text-primary focus:outline-none"
              onClick={() => setShowFollowing(true)}
            >
              <span className="font-bold">
                {followingLoading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : following.length}
              </span> Following
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
          base: "w-full border-b justify-center",
          panel: "py-4 px-0 justify-start px-10 w-full max-w-[80rem] mx-auto",
          tabList: "gap-4 w-fit relative rounded-none p-0 overflow-x-hidden",
          cursor: "w-full bg-[#31343F]",
          tab: "px-6 py-3 h-[44px] font-semibold font-inter",
          tabContent:
            "group-data-[selected=true]:text-[#31343F] text-[#494D5D] text-base font-semibold",
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
