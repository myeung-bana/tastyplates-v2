import React, { useState, useEffect } from "react";
import { palateFlagMap } from "@/utils/palateFlags";
import Link from "next/link";
import Image from "next/image";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { PROFILE } from "@/constants/pages";
import { capitalizeWords, generateProfileUrl } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";
import { FollowButton } from "@/components/ui/follow-button";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";
import { UserListItemSkeleton } from "@/components/ui/Skeleton";

export interface Follower {
  id: string;
  username?: string; // Username for profile URLs
  name: string;
  cuisines: string[];
  image?: string;
  isFollowing: boolean;
}

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  userId: string; // UUID of the profile user
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ open, onClose, userId, onFollow, onUnfollow }) => {
  const [localFollowers, setLocalFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<{ [id: string]: boolean }>({});
  const { user, firebaseUser } = useFirebaseSession();

  // Fetch followers when modal opens
  useEffect(() => {
    if (open && userId) {
      const fetchFollowers = async () => {
        setLoading(true);
        try {
          // Fetch followers list and current user's following list in parallel
          const [followersResponse, followingResponse] = await Promise.all([
            restaurantUserService.getFollowersList(userId),
            // Fetch current user's following list to check if they're following each follower
            user && firebaseUser 
              ? (async () => {
                  try {
                    const token = await firebaseUser.getIdToken();
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                    const currentUserResponse = await fetch(
                      `${baseUrl}/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=${encodeURIComponent(firebaseUser.uid)}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      }
                    );
                    const currentUserData = await currentUserResponse.json();
                    if (currentUserData.success && currentUserData.data?.id) {
                      return restaurantUserService.getFollowingList(currentUserData.data.id);
                    }
                    return { success: false, data: [] };
                  } catch (error) {
                    console.error('Error fetching current user following list:', error);
                    return { success: false, data: [] };
                  }
                })()
              : Promise.resolve({ success: false, data: [] })
          ]);

          if (followersResponse.success && followersResponse.data) {
            const followers = followersResponse.data as Follower[];
            const followingList = followingResponse.success && followingResponse.data 
              ? (followingResponse.data as any[]).map((u: any) => u.id)
              : [];

            // Set isFollowing status based on current user's following list
            const followersWithStatus = followers.map(follower => ({
              ...follower,
              isFollowing: user?.id && String(user.id) === String(follower.id) 
                ? false // Can't follow yourself
                : followingList.includes(follower.id)
            }));

            setLocalFollowers(followersWithStatus);
          } else {
            console.error('Failed to load followers:', followersResponse.error);
            setLocalFollowers([]);
          }
        } catch (error) {
          console.error('Error fetching followers:', error);
          setLocalFollowers([]);
        } finally {
          setLoading(false);
        }
      };

      fetchFollowers();
    } else if (!open) {
      // Clear data when modal closes
      setLocalFollowers([]);
    }
  }, [open, userId, user, firebaseUser]);

  const handleToggleFollow = async (id: string, isFollowing: boolean) => {
    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    if (isFollowing) {
      setLocalFollowers((prev) =>
        prev.map((f) => f.id === id ? { ...f, isFollowing: false } : f)
      );
      await onUnfollow(id);
    } else {
      setLocalFollowers((prev) =>
        prev.map((f) => f.id === id ? { ...f, isFollowing: true } : f)
      );
      await onFollow(id);
    }
    setLoadingMap((prev) => ({ ...prev, [id]: false }));
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto relative font-neusans">
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600 z-10"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-center text-xl py-5 font-neusans">Followers</h2>
        <div className="border-b border-[#E5E5E5] w-full" />
        <div>
          {loading ? (
            <UserListItemSkeleton count={5} />
          ) : localFollowers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-gray-500 text-center font-neusans">
                There are no users yet.
              </p>
            </div>
          ) : (
            localFollowers.map((follower) => (
            <div key={follower.id} className="flex items-center gap-3 px-6 py-3">
              {follower.id ? (
                  <Link href={user?.id && String(user.id) === String(follower.id) ? PROFILE : generateProfileUrl(follower.id, follower.username)}>
                  <FallbackImage
                    src={follower.image || DEFAULT_USER_ICON}
                    width={40}
                    height={40}
                    className="rounded-full bg-gray-200 cursor-pointer"
                    alt={follower.name}
                    type={FallbackImageType.Icon}
                  />
                </Link>
              ) : (
                <FallbackImage
                  src={follower.image || DEFAULT_USER_ICON}
                  width={40}
                  height={40}
                  className="rounded-full bg-gray-200"
                  alt={follower.name}
                  type={FallbackImageType.Icon}
                />
              )}
              <div className="flex-1 min-w-0">
                {follower.id ? (
                  <Link 
                    href={
                      user?.id && String(user.id) === String(follower.id) 
                        ? PROFILE 
                        : generateProfileUrl(follower.id, follower.username)
                    }
                  >
                    <div className="font-normal truncate cursor-pointer font-neusans">
                      {follower.name}
                    </div>
                  </Link>
                ) : (
                  <div className="font-normal truncate font-neusans">
                    {follower.name}
                  </div>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {follower.cuisines.length > 0 ? (
                    follower.cuisines.map((cuisine) => {
                    const flagUrl = palateFlagMap[cuisine.toLowerCase()];
                    return (
                      <span
                        key={cuisine}
                        className="flex items-center gap-1 bg-[#f1f1f1] py-0.5 px-2 rounded-[50px] text-xs font-medium text-[#31343f]"
                      >
                        {flagUrl && (
                          <Image
                            src={flagUrl}
                            alt={`${cuisine} flag`}
                            width={18}
                            height={10}
                            className="rounded object-cover"
                          />
                        )}
                        {capitalizeWords(cuisine)}
                      </span>
                    );
                  }))
                  : null}
                </div>
              </div>
              {/* Hide follow button if follower is the current user */}
              {user?.id && String(user.id) !== String(follower.id) && (
                <FollowButton
                  isFollowing={follower.isFollowing}
                  isLoading={loadingMap[follower.id]}
                  onToggle={async () => {
                    await handleToggleFollow(follower.id, follower.isFollowing);
                  }}
                  size="sm"
                />
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;