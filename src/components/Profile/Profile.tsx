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

  const reviews = getAllReviews();
  const user = session?.user;
  const targetUserId = 29; // The user ID we want to view

  useEffect(() => {
    if (!session?.accessToken) return;
    const WP_BASE = process.env.NEXT_PUBLIC_WP_API_URL || "";
    if (!WP_BASE) return;

    // Fetch palates
    const fetchPalates = async () => {
      try {
        const res = await fetch(
          `${WP_BASE}/wp-json/restaurant/v1/user-palates?user_id=${targetUserId}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`
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
      }
    };

    // Fetch followers
    const fetchFollowers = async () => {
      try {
        const res = await fetch(`${WP_BASE}/wp-json/v1/followers-list?user_id=${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFollowers(
            Array.isArray(data)
              ? data.map((user: any) => ({
                  id: user.id,
                  name: user.name,
                  cuisines: user.palates || [],
                  image: user.image || "/profile-icon.svg",
                  isFollowing: true,
                }))
              : []
          );
        } else {
          setFollowers([]);
        }
      } catch (e) {
        setFollowers([]);
      }
    };
    
    // Fetch following
    const fetchFollowing = async () => {
      try {
        const res = await fetch(`${WP_BASE}/wp-json/v1/following-list?user_id=${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFollowing(
            Array.isArray(data)
              ? data.map((user: any) => ({
                  id: user.id,
                  name: user.name,
                  cuisines: user.palates || [],
                  image: user.image || "/profile-icon.svg",
                  isFollowing: true,
                }))
              : []
          );
        } else {
          setFollowing([]);
        }
      } catch (e) {
        setFollowing([]);
      }
    };

    // Fetch all user data
    const fetchUserData = async () => {
      try {
        await Promise.all([
          fetchPalates(),
          fetchFollowers(),
          fetchFollowing()
        ]);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session?.accessToken]);

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

  const handleFollow = (id: string) => {
    // Implement follow logic here
    alert(`Follow user ${id}`);
  };
  const handleUnfollow = (id: string) => {
    // Implement unfollow logic here
    alert(`Unfollow user ${id}`);
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
                {palates.length > 0 ? (
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
            {user && 'bio' in user && user.bio
              ? user.bio
              : "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos."}
          </p>
          <div className="flex gap-6 mt-4 text-lg items-center">
            <span>
              <span className="font-bold">10</span> Reviews
            </span>
            <button
              type="button"
              className="font-bold text-primary hover:underline focus:outline-none"
              onClick={() => setShowFollowers(true)}
            >
              <span className="font-bold">{followers.length}</span> Followers
            </button>
            <button
              type="button"
              className="font-bold text-primary hover:underline focus:outline-none"
              onClick={() => setShowFollowing(true)}
            >
              <span className="font-bold">{following.length}</span> Following
            </button>
          </div>
        </div>
      </div>
      <FollowersModal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        followers={followers}
        onFollow={handleFollow}
      />
      <FollowingModal
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        following={following}
        onUnfollow={handleUnfollow}
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
