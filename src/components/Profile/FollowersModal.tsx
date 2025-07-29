import React, { useState } from "react";
import Image from "next/image";
import { palateFlagMap } from "@/utils/palateFlags";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PROFILE } from "@/constants/pages";
import { capitalizeWords, PAGE } from "@/lib/utils";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";

// Helper for relay global ID
const encodeRelayId = (type: string, id: string) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(`${type}:${id}`);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(`${type}:${id}`).toString('base64');
  }
  return `${type}:${id}`;
};

interface Follower {
  id: string;
  name: string;
  cuisines: string[];
  image?: string;
  isFollowing: boolean;
}

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  followers: Follower[];
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ open, onClose, followers, onFollow, onUnfollow }) => {
  const [localFollowers, setLocalFollowers] = useState(followers);
  const [loadingMap, setLoadingMap] = useState<{ [id: string]: boolean }>({});
  const { data: session } = useSession();

  React.useEffect(() => {
    setLocalFollowers(followers);
  }, [followers]);

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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-center text-xl font-semibold py-5">Followers</h2>
        <div className="border-b border-[#E5E5E5] w-full" />
        <div>
          {localFollowers.map((follower) => (
            <div key={follower.id} className="flex items-center gap-3 px-6 py-3">
              {follower.id ? (
                <Link href={session?.user?.id && String(session.user.id) === String(follower.id) ? PROFILE : PAGE(PROFILE, [encodeRelayId('user', follower.id)])}>
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
                  <Link href={session?.user?.id && String(session.user.id) === String(follower.id) ? PROFILE : PAGE(PROFILE, [encodeRelayId('user', follower.id)])}>
                    <div className="font-semibold truncate cursor-pointer">{follower.name}</div>
                  </Link>
                ) : (
                  <div className="font-semibold truncate">{follower.name}</div>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {follower.cuisines.map((cuisine) => {
                    const flagUrl = palateFlagMap[cuisine.toLowerCase()];
                    return (
                      <span
                        key={cuisine}
                        className="flex items-center gap-1 bg-[#1b1b1b] py-0.5 px-2 rounded-[50px] text-xs font-medium text-[#FDF0EF]"
                      >
                        {flagUrl && (
                          <img
                            src={flagUrl}
                            alt={`${cuisine} flag`}
                            className="w-[18px] h-[10px] rounded object-cover"
                          />
                        )}
                        {capitalizeWords(cuisine)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                className={`border border-[#494D5D] rounded-[50px] px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2`}
                onClick={() => handleToggleFollow(follower.id, follower.isFollowing)}
                disabled={loadingMap[follower.id]}
              >
                {loadingMap[follower.id] ? (
                  <svg className="animate-spin h-4 w-4 mr-1 text-gray-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : follower.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;