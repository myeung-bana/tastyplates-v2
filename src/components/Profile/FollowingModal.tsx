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

interface FollowingUser {
  id: string;
  username?: string; // Username for profile URLs
  name: string;
  cuisines: string[];
  image?: string;
  isFollowing: boolean;
}

interface FollowingModalProps {
  open: boolean;
  onClose: () => void;
  userId: string; // UUID of the profile user
  onUnfollow: (id: string) => void;
  onFollow: (id: string) => void;
}

const FollowingModal: React.FC<FollowingModalProps> = ({ open, onClose, userId, onUnfollow, onFollow }) => {
  const [localFollowing, setLocalFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<{ [id: string]: boolean }>({});
  const { user } = useFirebaseSession();

  // Fetch following when modal opens
  useEffect(() => {
    if (open && userId) {
      const fetchFollowing = async () => {
        setLoading(true);
        try {
          const response = await restaurantUserService.getFollowingList(userId);
          if (response.success && response.data) {
            setLocalFollowing(response.data as FollowingUser[]);
          } else {
            console.error('Failed to load following:', response.error);
            setLocalFollowing([]);
          }
        } catch (error) {
          console.error('Error fetching following:', error);
          setLocalFollowing([]);
        } finally {
          setLoading(false);
        }
      };

      fetchFollowing();
    } else if (!open) {
      // Clear data when modal closes
      setLocalFollowing([]);
    }
  }, [open, userId]);

  const handleToggleFollow = async (id: string, isFollowing: boolean) => {
    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    if (isFollowing) {
      setLocalFollowing((prev) =>
        prev.map((followingUser) => followingUser.id === id ? { ...followingUser, isFollowing: false } : followingUser)
      );
      await onUnfollow(id);
    } else {
      setLocalFollowing((prev) =>
        prev.map((followingUser) => followingUser.id === id ? { ...followingUser, isFollowing: true } : followingUser)
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
        <h2 className="text-center text-xl py-5 font-neusans">Following</h2>
        <div className="border-b border-[#E5E5E5] w-full" />
        <div>
          {loading ? (
            <UserListItemSkeleton count={5} />
          ) : localFollowing.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-gray-500 text-center font-neusans">
                There are no users yet.
              </p>
            </div>
          ) : (
            localFollowing.map((followingUser) => (
            <div key={followingUser.id} className="flex items-center gap-3 px-6 py-3">
              {followingUser.id ? (
                <Link 
                  href={
                    user?.id && String(user.id) === String(followingUser.id) 
                      ? PROFILE 
                      : generateProfileUrl(followingUser.id, followingUser.username)
                  }
                >
                  <FallbackImage
                    src={followingUser.image || DEFAULT_USER_ICON}
                    width={40}
                    height={40}
                    className="rounded-full bg-gray-200 cursor-pointer"
                    alt={followingUser.name}
                    type={FallbackImageType.Icon}
                  />
                </Link>
              ) : (
                <FallbackImage
                  src={followingUser.image || DEFAULT_USER_ICON}
                  width={40}
                  height={40}
                  className="rounded-full bg-gray-200"
                  alt={followingUser.name}
                  type={FallbackImageType.Icon}
                />
              )}
              <div className="flex-1 min-w-0">
                {followingUser.id ? (
                  <Link 
                    href={
                      user?.id && String(user.id) === String(followingUser.id) 
                        ? PROFILE 
                        : generateProfileUrl(followingUser.id, followingUser.username)
                    }
                  >
                    <div className="font-normal truncate cursor-pointer font-neusans">
                      {followingUser.name}
                    </div>
                  </Link>
                ) : (
                  <div className="font-normal truncate font-neusans">
                    {followingUser.name}
                  </div>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {followingUser.cuisines.length > 0 ? (
                    followingUser.cuisines.map((cuisine) => {
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
              <FollowButton
                isFollowing={followingUser.isFollowing}
                isLoading={loadingMap[followingUser.id]}
                onToggle={async () => {
                  await handleToggleFollow(followingUser.id, followingUser.isFollowing);
                }}
                size="sm"
                className="border border-[#494D5D]"
              />
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;