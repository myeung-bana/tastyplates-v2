import React from "react";
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
}

const FollowingModal: React.FC<FollowingModalProps> = ({ open, onClose, following, onUnfollow }) => {
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
        <div className="divide-y">
          {following.map((user) => (
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
                    <span key={cuisine} className="bg-[#FDF0EF] py-0.5 px-2 rounded-[50px] text-xs font-medium text-[#E36B00]">{cuisine}</span>
                  ))}
                </div>
              </div>
              <button
                className="border border-[#494D5D] rounded-[50px] px-4 py-1 text-sm font-semibold text-[#494D5D] hover:bg-[#f5f5f5] transition-all"
                onClick={() => onUnfollow(user.id)}
              >
                Following
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;
