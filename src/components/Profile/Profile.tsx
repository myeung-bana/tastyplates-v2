"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaPen } from "react-icons/fa";
import { WELCOME_KEY } from "@/constants/session";
import "@/styles/pages/_restaurants.scss";

// Import our new components and hooks
import ProfileHeader from "./ProfileHeader";
import { ProfileHeaderSkeleton } from "../ui/Skeleton";
import ReviewsTab from "./ReviewsTab";
import ListingsTab from "./ListingsTab";
import WishlistsTab from "./WishlistsTab";
import CheckinsTab from "./CheckinsTab";
import FollowersModal, { Follower } from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import { useFollowData } from "@/hooks/useFollowData";
import { useProfileData } from "@/hooks/useProfileData";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { FollowService } from "@/services/follow/followService";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";

interface ProfileProps {
  targetUserId: string | number; // Support both UUID (string) and legacy numeric IDs
}

const Profile = ({ targetUserId }: ProfileProps) => {
  const { data: session, status } = useSession();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const followService = useRef(new FollowService()).current;

  // Validate targetUserId - can be UUID (string) or numeric ID
  if (!targetUserId || (typeof targetUserId === 'string' && targetUserId.trim() === '')) {
    console.error('Profile: Invalid targetUserId', { 
      targetUserId, 
      type: typeof targetUserId
    });
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Invalid user profile ID.</p>
      </div>
    );
  }

  // Use our custom hooks - now supports both UUID and numeric IDs
  const {
    userData,
    nameLoading,
    aboutMeLoading,
    palatesLoading,
    loading,
    isViewingOwnProfile,
    error: profileError,
    followersCount: profileFollowersCount,
    followingCount: profileFollowingCount
  } = useProfileData(targetUserId);

  // Debug: Log userData for ReviewsTab
  useEffect(() => {
    console.log('Profile - userData for ReviewsTab:', {
      userDataId: userData?.id,
      targetUserId: userData?.id as string || '',
      userDataType: typeof userData?.id,
      status,
      hasUserData: !!userData,
      userDataKeys: userData ? Object.keys(userData) : []
    });
  }, [userData, status]);

  // Pass targetUserId directly to useFollowData - it now supports UUIDs
  const {
    followers,
    following,
    followersLoading,
    followingLoading,
    handleFollow,
    handleUnfollow
  } = useFollowData(targetUserId);

  // Convert targetUserId to number for legacy endpoints that still need numeric IDs
  // (followService.isFollowingUser, restaurantService, etc.)
  const validUserId = useMemo(() => {
    if (typeof targetUserId === 'number') return targetUserId;
    const numId = Number(targetUserId);
    // Only use numeric ID if it's a valid number and not a UUID
    const isUUID = typeof targetUserId === 'string' && targetUserId.length > 10 && targetUserId.includes('-');
    return !isNaN(numId) && !isUUID ? numId : 0;
  }, [targetUserId]);

  // Wishlist handler
  const handleWishlistChange = useCallback((restaurantId: string, isSaved: boolean) => {
    setWishlist(prev => 
      isSaved 
        ? prev.filter(rest => rest.id !== restaurantId)
        : prev
    );
  }, []);

  // Custom follow/unfollow handlers for profile header
  const handleProfileFollow = useCallback(async (id: string) => {
    if (!session?.accessToken) return;
    
    setFollowLoading(true);
    try {
      const userIdNum = Number(id);
      if (isNaN(userIdNum)) return;
      
      const response = await followService.followUser(userIdNum, session.accessToken);
      if (response.status === 200) {
        setIsFollowing(true);
        // Also update the followers count by refreshing follow data
        await handleFollow(id);
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    } finally {
      setFollowLoading(false);
    }
  }, [session?.accessToken, followService, handleFollow]);

  const handleProfileUnfollow = useCallback(async (id: string) => {
    if (!session?.accessToken) return;
    
    setFollowLoading(true);
    try {
      const userIdNum = Number(id);
      if (isNaN(userIdNum)) return;
      
      const response = await followService.unfollowUser(userIdNum, session.accessToken);
      if (response.status === 200) {
        setIsFollowing(false);
        // Also update the followers count by refreshing follow data
        await handleUnfollow(id);
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    } finally {
      setFollowLoading(false);
    }
  }, [session?.accessToken, followService, handleUnfollow]);

  // Welcome message effect
  useEffect(() => {
    const welcomeMessage = localStorage?.getItem(WELCOME_KEY) ?? "";
    if (welcomeMessage) {
      toast.success(welcomeMessage, {
        duration: 3000,
      });
      localStorage.removeItem(WELCOME_KEY);
    }
  }, []);

  // Check if current user is following the target user
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!session?.accessToken || !validUserId || isViewingOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        const response = await followService.isFollowingUser(validUserId, session.accessToken);
        setIsFollowing(response.is_following || false);
      } catch (error) {
        console.error("Error checking following status:", error);
        setIsFollowing(false);
      }
    };

    checkFollowingStatus();
  }, [session?.accessToken, validUserId, isViewingOwnProfile, followService]);

  // Fetch wishlist data - DELAYED LOADING (Priority 3 - after reviews)
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userData?.id) return;
      
      // Increase delay to prioritize reviews (first/default tab)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWishlistLoading(true);
      try {
        const response = await restaurantUserService.getWishlist({
          user_id: userData.id as string,
          limit: 50, // Adjust as needed
          offset: 0
        });

        if (response.success && response.data) {
          // Extract restaurants from wishlist items
          const restaurants = response.data.map((item) => item.restaurant);
          setWishlist(restaurants);
        } else {
          console.error("Failed to fetch wishlist:", response.error);
          toast.error("Failed to load wishlist");
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlist();
  }, [userData?.id]);

  // Fetch check-ins data - DELAYED LOADING (Priority 4 - after reviews and wishlist)
  useEffect(() => {
    const fetchCheckins = async () => {
      if (!userData?.id) return;
      
      // Increase delay to prioritize reviews (first/default tab)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setCheckinsLoading(true);
      try {
        const response = await restaurantUserService.getCheckins({
          user_id: userData.id as string,
          limit: 50, // Adjust as needed
          offset: 0
        });

        if (response.success && response.data) {
          // Extract restaurants from check-in items
          const restaurants = response.data.map((item) => item.restaurant);
          setCheckins(restaurants);
        } else {
          console.error("Failed to fetch check-ins:", response.error);
          toast.error("Failed to load check-ins");
        }
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        toast.error("Failed to load check-ins");
      } finally {
        setCheckinsLoading(false);
      }
    };

    fetchCheckins();
  }, [userData?.id]);

  // Tab configuration with review count callback
  const tabs = [
    {
      id: "reviews",
      label: "Reviews",
      content: <ReviewsTab 
        targetUserId={userData?.id as string || ''} 
        status={status} 
        onReviewCountChange={setUserReviewCount}
      />
    },
    {
      id: "listings",
      label: "Listings",
      content: <ListingsTab targetUserId={validUserId} isViewingOwnProfile={isViewingOwnProfile} />
    },
    {
      id: "wishlists",
      label: "Wishlists",
      content: <WishlistsTab 
        wishlist={wishlist} 
        wishlistLoading={wishlistLoading} 
        handleWishlistChange={handleWishlistChange} 
      />
    },
    {
      id: "checkins",
      label: "Check-ins",
      content: <CheckinsTab 
        checkins={checkins} 
        checkinsLoading={checkinsLoading} 
      />
    }
  ];

  // Show error message if profile data failed to load
  if (profileError && !loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen px-4">
        <p className="text-lg text-gray-600 mb-2">Unable to load profile</p>
        <p className="text-sm text-gray-500 text-center">
          {profileError.includes('Invalid user ID format') 
            ? 'The user ID format is invalid. Please check the URL and try again.'
            : profileError}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {loading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <ProfileHeader
          userData={userData}
          nameLoading={nameLoading}
          aboutMeLoading={aboutMeLoading}
          palatesLoading={palatesLoading}
          userReviewCount={userReviewCount}
          followers={followers}
          following={following}
          followersLoading={followersLoading}
          followingLoading={followingLoading}
          followersCount={profileFollowersCount}
          followingCount={profileFollowingCount}
          isViewingOwnProfile={isViewingOwnProfile}
          onShowFollowers={() => setShowFollowers(true)}
          onShowFollowing={() => setShowFollowing(true)}
          onFollow={handleProfileFollow}
          onUnfollow={handleProfileUnfollow}
          session={session}
          targetUserId={targetUserId}
          isFollowing={isFollowing}
          followLoading={followLoading}
        />
      )}

      <FollowersModal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        followers={followers as unknown as Follower[]}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />

      <FollowingModal
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        following={following as unknown as Follower[]}
        onUnfollow={handleUnfollow}
        onFollow={handleFollow}
      />

      {/* Centered Tabs Container */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <Tabs
          aria-label="Dynamic tabs"
          items={tabs}
          classNames={{
            tabWrapper: "w-full",
            base: "w-full border-b justify-center min-w-max sm:min-w-0 px-0",
            panel: "py-0 px-0 justify-start w-full",
            tabList: "gap-0 md:gap-4 w-fit relative rounded-none p-0 flex no-scrollbar sm:overflow-x-hidden",
            cursor: "w-full bg-[#31343F]",
            tab: "px-4 sm:px-6 py-3 h-[44px] font-neusans whitespace-nowrap",
            tabContent: "group-data-[selected=true]:text-[#31343F] text-xs sm:text-base font-neusans",
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
      </div>
    </div>
  );
};

export default Profile;
