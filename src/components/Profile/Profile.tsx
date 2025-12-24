"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
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
  targetUserId?: string | number; // Support both UUID (string) and legacy numeric IDs (deprecated, use targetUserIdentifier)
  targetUserIdentifier?: string; // Support username or UUID
}

const Profile = ({ targetUserId, targetUserIdentifier }: ProfileProps) => {
  // Use targetUserIdentifier if provided, otherwise fall back to targetUserId for backward compatibility
  const identifier = targetUserIdentifier || (targetUserId ? String(targetUserId) : undefined);
  const { user, loading } = useFirebaseSession();
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

  // Validate identifier - can be username, UUID (string), or numeric ID
  if (!identifier || (typeof identifier === 'string' && identifier.trim() === '')) {
    console.error('Profile: Invalid user identifier', { 
      identifier,
      targetUserId,
      targetUserIdentifier,
      type: typeof identifier
    });
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Invalid user profile identifier.</p>
      </div>
    );
  }

  // Use our custom hooks - now supports username, UUID, and numeric IDs
  const {
    userData,
    nameLoading,
    aboutMeLoading,
    palatesLoading,
    loading: profileDataLoading,
    isViewingOwnProfile,
    error: profileError,
    followersCount: profileFollowersCount,
    followingCount: profileFollowingCount
  } = useProfileData(identifier);

  // Debug: Log userData for ReviewsTab
  useEffect(() => {
    console.log('Profile - userData for ReviewsTab:', {
      userDataId: userData?.id,
      targetUserId: userData?.id as string || '',
      userDataType: typeof userData?.id,
      profileDataLoading,
      hasUserData: !!userData,
      userDataKeys: userData ? Object.keys(userData) : []
    });
  }, [userData, profileDataLoading]);

  // Pass userData.id (UUID) to useFollowData once userData is loaded
  // This ensures we use the correct UUID format for API calls
  const {
    followers,
    following,
    followersLoading,
    followingLoading,
    handleFollow,
    handleUnfollow,
    refreshFollowData
  } = useFollowData(userData?.id as string || identifier || (targetUserId ? String(targetUserId) : ''));

  // Debug: Log follow data
  useEffect(() => {
    console.log('Profile - Follow data:', {
      followersCount: followers.length,
      followingCount: following.length,
      followersLoading,
      followingLoading,
      followers: followers.slice(0, 2), // First 2 for debugging
      following: following.slice(0, 2), // First 2 for debugging
      userDataId: userData?.id
    });
  }, [followers, following, followersLoading, followingLoading, userData?.id]);

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

  // Get Firebase ID token for API calls
  const getFirebaseToken = async () => {
    if (!user?.firebase_uuid) return null;
    try {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return null;
  };

  // Custom follow/unfollow handlers for profile header
  const handleProfileFollow = useCallback(async (id: string) => {
    const token = await getFirebaseToken();
    if (!token) return;
    
    // Use userData.id if available (UUID), otherwise fall back to id parameter
    const userIdToFollow = (userData?.id as string) || id;
    
    setFollowLoading(true);
    try {
      // Check if ID is UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdToFollow);
      
      if (isUUIDFormat) {
        // Use new Hasura API endpoint
        const response = await fetch('/api/v1/restaurant-users/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userIdToFollow })
        });
        
        const result = await response.json();
        if (result.success) {
          setIsFollowing(true);
          // Refresh follow data to update counts (don't call handleFollow as it would make duplicate API call)
          await refreshFollowData();
        } else {
          toast.error(result.error || 'Failed to follow user');
        }
      } else {
        // Use legacy endpoint for numeric IDs
        const userIdNum = Number(userIdToFollow);
        if (isNaN(userIdNum)) return;
        
        const response = await followService.followUser(userIdNum, token);
        if (response.status === 200) {
          setIsFollowing(true);
          // Refresh follow data to update counts (don't call handleFollow as it would make duplicate API call)
          await refreshFollowData();
        }
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    } finally {
      setFollowLoading(false);
    }
  }, [user, userData?.id, followService, refreshFollowData]);

  const handleProfileUnfollow = useCallback(async (id: string) => {
    const token = await getFirebaseToken();
    if (!token) return;
    
    // Use userData.id if available (UUID), otherwise fall back to id parameter
    const userIdToUnfollow = (userData?.id as string) || id;
    
    setFollowLoading(true);
    try {
      // Check if ID is UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdToUnfollow);
      
      if (isUUIDFormat) {
        // Use new Hasura API endpoint
        const response = await fetch('/api/v1/restaurant-users/unfollow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userIdToUnfollow })
        });
        
        const result = await response.json();
        if (result.success) {
          setIsFollowing(false);
          // Refresh follow data to update counts (don't call handleUnfollow as it would make duplicate API call)
          await refreshFollowData();
        } else {
          toast.error(result.error || 'Failed to unfollow user');
        }
      } else {
        // Use legacy endpoint for numeric IDs
        const userIdNum = Number(userIdToUnfollow);
        if (isNaN(userIdNum)) return;
        
        const response = await followService.unfollowUser(userIdNum, token);
        if (response.status === 200) {
          setIsFollowing(false);
          // Refresh follow data to update counts (don't call handleUnfollow as it would make duplicate API call)
          await refreshFollowData();
        }
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    } finally {
      setFollowLoading(false);
    }
  }, [user, userData?.id, followService, refreshFollowData]);

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
      if (!user || !userData?.id || isViewingOwnProfile) {
        setIsFollowing(false);
        return;
      }

      try {
        const token = await getFirebaseToken();
        if (!token) {
          setIsFollowing(false);
          return;
        }
        
        const userId = userData.id as string;
        const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        
        if (isUUIDFormat) {
          // Use new Hasura API endpoint
          const response = await fetch('/api/v1/restaurant-users/check-follow-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId })
          });
          
          const result = await response.json();
          if (result.success) {
            setIsFollowing(result.is_following || false);
          } else {
            setIsFollowing(false);
          }
        } else {
          // Use legacy endpoint for numeric IDs
          const numericUserId = Number(userId);
          if (!isNaN(numericUserId) && numericUserId > 0) {
            const response = await followService.isFollowingUser(numericUserId, token);
            setIsFollowing(response.is_following || false);
          } else {
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error("Error checking following status:", error);
        setIsFollowing(false);
      }
    };

    checkFollowingStatus();
  }, [user, userData?.id, isViewingOwnProfile, followService]);

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
        status="approved"
        onReviewCountChange={setUserReviewCount}
      />
    },
    // Temporarily commented out
    // {
    //   id: "listings",
    //   label: "Listings",
    //   content: <ListingsTab targetUserId={validUserId} isViewingOwnProfile={isViewingOwnProfile} />
    // },
    {
      id: "wishlists",
      label: "To-Dine List",
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
  if (profileError && !profileDataLoading) {
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
      {profileDataLoading ? (
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
          currentUser={user}
          targetUserId={userData?.id as string || ''}
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
