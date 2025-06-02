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
  const [palates, setPalates] = useState<string[]>(
    () => (session?.user?.palates && Array.isArray(session.user.palates) ? session.user.palates : [])
  );
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const reviews = getAllReviews();
  const user = session?.user;

  useEffect(() => {
    if (
      session?.user?.palates &&
      Array.isArray(session.user.palates) &&
      palates.length === 0
    ) {
      setPalates(session.user.palates);
    }

    const fetchPalates = async () => {
      if (!session?.user?.id) return;
      const WP_BASE = process.env.NEXT_PUBLIC_WP_API_URL || "";
      if (!WP_BASE) return;

      try {
        const res = await fetch(
          `${WP_BASE}/wp-json/restaurant/v1/user-palates?user_id=${session.user.id}`
        );
        if (!res.ok) {
          console.error("Failed to fetch palates:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.palates)) {
          setPalates(data.palates);
        }
      } catch (err) {
        console.error("Error fetching palates:", err);
      }
    };
    fetchPalates();
    // Only re-run if session.user.id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const palateCuisineIds = useMemo(() => {
    return cuisines
      .filter((c) => palates.includes(c.name))
      .map((c) => c.id);
  }, [palates]);

  const filteredRestaurants = useMemo(() => {
    if (palateCuisineIds.length === 0) {
      return restaurants;
    }
    return restaurants.filter((rest) =>
      rest.cuisineIds.some((cId) => palateCuisineIds.includes(cId))
    );
  }, [palateCuisineIds]);

  // Dummy data for demonstration
  const followers = [
    { id: "1", name: "YurioLim", cuisines: ["Malaysian", "Chinese"], isFollowing: false },
    { id: "2", name: "AliceChen", cuisines: ["Taiwanese"], isFollowing: false },
    { id: "3", name: "MarkFang", cuisines: ["Korean"], isFollowing: false },
    { id: "4", name: "LilyWu", cuisines: ["Italian"], isFollowing: false },
  ];
  const following = [
    { id: "10", name: "BobTang", cuisines: ["Italian"], isFollowing: true },
    { id: "11", name: "CarolWang", cuisines: ["Thai"], isFollowing: true },
    { id: "12", name: "DaveLee", cuisines: ["Mexican"], isFollowing: true },
    { id: "13", name: "EveKim", cuisines: ["Japanese"], isFollowing: true },
  ];

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
          items={reviews}
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
            <div className="restaurants__grid">
              {filteredRestaurants.map((rest) => (
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
            <div className="restaurants__grid">
              {filteredRestaurants.map((rest) => (
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
            {user?.bio ||
              "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos."}
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
              <span className="font-bold">5</span> Followers
            </button>
            <button
              type="button"
              className="font-bold text-primary hover:underline focus:outline-none"
              onClick={() => setShowFollowing(true)}
            >
              <span className="font-bold">25</span> Following
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
