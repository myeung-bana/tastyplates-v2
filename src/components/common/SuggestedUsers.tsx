'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SuggestedUser } from '@/repositories/http/following/followingReviewRepository';
import { useFollowData } from '@/hooks/useFollowData';
import Image from 'next/image';
import { FaUserPlus, FaCheck } from 'react-icons/fa';

interface SuggestedUsersProps {
  users: SuggestedUser[];
  onUserFollowed?: () => void;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ users, onUserFollowed }) => {
  const { data: session } = useSession();
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());
  
  // Use current user's ID for follow data hook
  const currentUserId = session?.user?.id ? parseInt(session.user.id as string) : 0;
  const { handleFollow } = useFollowData(currentUserId);

  const handleFollowUser = async (userId: number) => {
    if (loadingUsers.has(userId)) return;
    
    setLoadingUsers(prev => new Set(prev).add(userId));
    
    try {
      await handleFollow(userId.toString());
      setFollowedUsers(prev => new Set(prev).add(userId));
      onUserFollowed?.();
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="suggested-users bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Food Lovers</h2>
        <p className="text-gray-600">Follow these users to see their latest reviews in your feed</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {users.map(user => {
          const isFollowed = followedUsers.has(user.id);
          const isLoading = loadingUsers.has(user.id);
          
          return (
            <div 
              key={user.id} 
              className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <div className="mb-3">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <Image
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.display_name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {user.display_name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">@{user.username}</p>
                
                <div className="flex justify-center gap-4 text-xs text-gray-600 mb-3">
                  <span>{user.follower_count} followers</span>
                  <span>{user.review_count} reviews</span>
                </div>
              </div>
              
              <button
                onClick={() => handleFollowUser(user.id)}
                disabled={isLoading || isFollowed}
                className={`w-full px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  isFollowed
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-[#E36B00] hover:bg-[#c55a00] text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Following...
                  </div>
                ) : isFollowed ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaCheck className="w-3 h-3" />
                    Following
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaUserPlus className="w-3 h-3" />
                    Follow
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedUsers;
