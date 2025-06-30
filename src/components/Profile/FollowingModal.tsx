import React, { useState } from "react";
import Image from "next/image";

interface FollowingUser {
  id: string;
  name: string;
  cuisines: string[];
  image?: string;
  isFollowing: boolean;
}

interface FollowingModalProps {
  open: boolean;
  onClose: () => void;
  following: FollowingUser[];
  onUnfollow: (id: string) => void;
  onFollow: (id: string) => void;
}

const FollowingModal: React.FC<FollowingModalProps> = ({ open, onClose, following, onUnfollow, onFollow }) => {
  const [localFollowing, setLocalFollowing] = useState(following);
  const [loadingMap, setLoadingMap] = useState<{ [id: string]: boolean }>({});

  React.useEffect(() => {
    if (open) {
      setLocalFollowing(following);
    }
  }, [open]);

  const handleToggleFollow = async (id: string, isFollowing: boolean) => {
    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    if (isFollowing) {
      setLocalFollowing((prev) =>
        prev.map((user) => user.id === id ? { ...user, isFollowing: false } : user)
      );
      await onUnfollow(id);
    } else {
      setLocalFollowing((prev) =>
        prev.map((user) => user.id === id ? { ...user, isFollowing: true } : user)
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
        <h2 className="text-center text-xl font-semibold py-5">Following</h2>
        <div className="border-b border-[#E5E5E5] w-full" />
        <div>
          {localFollowing.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-6 py-3">
              <Image
                src={user.image || "/profile-icon.svg"}
                width={40}
                height={40}
                className="rounded-full bg-gray-200"
                alt={user.name}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{user.name}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {user.cuisines.map((cuisine) => (
                    <span key={cuisine} className="bg-[#D56253] py-0.5 px-2 rounded-[50px] text-xs font-medium text-[#FDF0EF]">{cuisine}</span>
                  ))}
                </div>
              </div>
              <button
                className={`border border-[#494D5D] rounded-[50px] px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2`}
                onClick={() => handleToggleFollow(user.id, user.isFollowing)}
                disabled={loadingMap[user.id]}
              >
                {loadingMap[user.id] ? (
                  <svg className="animate-spin h-4 w-4 mr-1 text-gray-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;