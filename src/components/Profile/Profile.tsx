"use client";
import React, { useState, useEffect, useMemo } from "react";
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

const Profile = () => {
  const { data: session } = useSession();
  const [palates, setPalates] = useState<string[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>("");
  const [palatesLoading, setPalatesLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [bioLoading, setBioLoading] = useState(true);

  const reviews = getAllReviews();
  const user = session?.user;
  const targetUserId = user?.id;
  const WP_BASE = process.env.NEXT_PUBLIC_WP_API_URL || "";

  // Fetch palates
  const fetchPalates = async () => {
    setPalatesLoading(true);
    try {
      const res = await fetch(
        `${WP_BASE}/wp-json/restaurant/v1/user-palates?user_id=${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.palates)) {
          setPalates(data.palates);
        }
      }
    } catch (err) {
      console.error('Error fetching palates:', err);
    } finally {
      setPalatesLoading(false);
    }
  };

  // Fetch user bio
  const fetchBio = async () => {
    setBioLoading(true);
    try {
      const res = await fetch(
        `${WP_BASE}/wp-json/restaurant/v1/user-bio?user_id=${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setBio(data.bio || "");
      }
    } catch (err) {
      console.error('Error fetching bio:', err);
    } finally {
      setBioLoading(false);
    }
  };

  // Fetch following
  const fetchFollowing = async () => {
    setFollowingLoading(true);
    if (!session?.accessToken || !WP_BASE || !targetUserId) {
      setFollowingLoading(false);
      return [];
    }
    try {
      const res = await fetch(`${WP_BASE}/wp-json/v1/following-list?user_id=${targetUserId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const followingList = Array.isArray(data)
          ? data.map((user: any) => ({
              id: user.id,
              name: user.name,
              cuisines: user.palates || [],
              image: user.image || "/profile-icon.svg",
              isFollowing: true,
            }))
          : [];
        setFollowing(followingList);
        return followingList;
      } else {
        setFollowing([]);
        return [];
      }
    } catch (e) {
      setFollowing([]);
      return [];
    } finally {
      setFollowingLoading(false);
    }
  };

  // Fetch followers
  const fetchFollowers = async (followingList?: any[]) => {
    setFollowersLoading(true);
    if (!session?.accessToken || !WP_BASE || !targetUserId) {
      setFollowersLoading(false);
      return [];
    }
    try {
      const res = await fetch(`${WP_BASE}/wp-json/v1/followers-list?user_id=${targetUserId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const followingArr = followingList || following;
        const followersList = Array.isArray(data)
          ? data.map((user: any) => ({
              id: user.id,
              name: user.name,
              cuisines: user.palates || [],
              image: user.image || "/profile-icon.svg",
              isFollowing: followingArr.some((f: any) => f.id === user.id),
            }))
          : [];
        setFollowers(followersList);
        return followersList;
      } else {
        setFollowers([]);
        return [];
      }
    } catch (e) {
      setFollowers([]);
      return [];
    } finally {
      setFollowersLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.accessToken) return;
    if (!WP_BASE) return;

    setLoading(true);
    // Fetch palates, following, followers, and bio all in parallel
    Promise.all([
      fetchPalates(),
      fetchBio(),
      (async () => {
        setFollowingLoading(true);
        setFollowersLoading(true);
        try {
          // Fetch following and followers in parallel
          const [followingListRaw, followersListRaw] = await Promise.all([
            (async () => {
              const res = await fetch(`${WP_BASE}/wp-json/v1/following-list?user_id=${targetUserId}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
              });
              if (res.ok) {
                const data = await res.json();
                return Array.isArray(data)
                  ? data.map((user: any) => ({
                      id: user.id,
                      name: user.name,
                      cuisines: user.palates || [],
                      image: user.image || "/profile-icon.svg",
                      isFollowing: true,
                    }))
                  : [];
              }
              return [];
            })(),
            (async () => {
              const res = await fetch(`${WP_BASE}/wp-json/v1/followers-list?user_id=${targetUserId}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
              });
              if (res.ok) {
                const data = await res.json();
                return Array.isArray(data)
                  ? data.map((user: any) => ({
                      id: user.id,
                      name: user.name,
                      cuisines: user.palates || [],
                      image: user.image || "/profile-icon.svg",
                    }))
                  : [];
              }
              return [];
            })(),
          ]);
          setFollowing(followingListRaw);
          // Map isFollowing for followers using the just-fetched followingListRaw
          setFollowers(
            followersListRaw.map((user: any) => ({
              ...user,
              isFollowing: followingListRaw.some((f: any) => f.id === user.id),
            }))
          );
        } finally {
          setFollowingLoading(false);
          setFollowersLoading(false);
        }
      })(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [session?.accessToken, WP_BASE, targetUserId]);

  const palateCuisineIds = useMemo(() => {
    return cuisines.filter((c) => palates.includes(c.name)).map((c) => c.id);
  }, [palates]);

  const filteredRestaurants = useMemo(() => {
    if (palateCuisineIds.length === 0) {
      return restaurants;
    }
    return restaurants.filter((rest) =>
      rest.cuisineIds.some((cId) => palateCuisineIds.includes(cId))
    );
  }, [palateCuisineIds]);

  const safeRestaurant = (rest: any) => ({ cuisineNames: [], countries: [], ...rest });
  const safeReviews = reviews.map((r: any, idx: number) => ({
    databasedId: r.databasedId || idx,
    reviewMainTitle: r.reviewMainTitle || r.title || '',
    content: r.content || r.text || '',
    uri: r.uri || '',
    rating: r.rating || 0,
    reviewer: r.reviewer || '',
    date: r.date || '',
    ...r,
  }));

  // Count user reviews (dummy data version)
  const userReviewCount = useMemo(() => {
    if (!user?.id) return 0;
    return reviews.filter((r: any) => r.authorId === user.id).length;
  }, [reviews, user?.id]);

  const handleFollow = async (id: string) => {
    if (!session?.accessToken) return;
    const WP_BASE = process.env.NEXT_PUBLIC_WP_API_URL || "";
    try {
      const res = await fetch(`${WP_BASE}/wp-json/v1/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ user_id: id }),
      });
      if (res.ok) {
        // Refetch following first, then followers with the latest following list
        const newFollowing = await fetchFollowing();
        await fetchFollowers(newFollowing);
      }
    } catch (e) {
      // handle error
    }
  };

  const handleUnfollow = async (id: string) => {
    if (!session?.accessToken) return;
    const WP_BASE = process.env.NEXT_PUBLIC_WP_API_URL || "";
    try {
      const res = await fetch(`${WP_BASE}/wp-json/v1/unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ user_id: id }),
      });
      if (res.ok) {
        // Refetch following first, then followers with the latest following list
        const newFollowing = await fetchFollowing();
        await fetchFollowers(newFollowing);
      }
    } catch (e) {
      // handle error
    }
  };

  // Build tab contents, using filteredRestaurants instead of the full list
  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <Masonry
          items={safeReviews}
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
            <div className="restaurants__grid">
              {filteredRestaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={safeRestaurant(rest)} />
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
            <div className="restaurants__grid">
              {filteredRestaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={safeRestaurant(rest)} />
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
            <div className="restaurants__grid">
              {filteredRestaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={safeRestaurant(rest)} />
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
                {user?.name || "JulienChang"}
              </h2>
              <div className="flex gap-1 mt-2 flex-wrap">
                {palatesLoading ? (
                  <span className="inline-block w-16 h-5 bg-gray-200 rounded animate-pulse align-middle" />
                ) : palates.length > 0 ? (
                  palates.map((palate) => (
                    <span
                      key={palate}
                      className="bg-[#FDF0EF] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]"
                    >
                      {palate}
                    </span>
                  ))
                ) : (
                  <span className="bg-[#FDF0EF] py-1 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]">
                    No palates
                  </span>
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
            {bioLoading ? (
              <span className="inline-block w-40 h-5 bg-gray-200 rounded animate-pulse align-middle" />
            ) : (bio || "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.")}
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
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
      <FollowingModal
        open={showFollowing}
        onClose={() => {
          setShowFollowing(false);
          // Remove unfollowed users after modal closes
          setFollowing((prev) => prev.filter((u) => u.isFollowing));
        }}
        following={following}
        onUnfollow={handleUnfollow}
        onFollow={handleFollow}
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
