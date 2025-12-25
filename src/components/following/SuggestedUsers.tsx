'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import FallbackImage, { FallbackImageType } from '@/components/ui/Image/FallbackImage';
import { FiUserPlus, FiCheck } from 'react-icons/fi';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { toast } from 'react-hot-toast';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

interface SuggestedUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  reviewCount: number;
  followerCount: number;
  bio?: string;
}

interface SuggestedUsersProps {
  onFollowSuccess?: () => void;
}

export default function SuggestedUsers({ onFollowSuccess }: SuggestedUsersProps) {
  const { user, firebaseUser } = useFirebaseSession();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  // Fetch following count to determine if we should show suggestions
  useEffect(() => {
    if (user?.id) {
      fetchFollowingCount();
    }
  }, [user?.id]);

  // Fetch suggested users only if following count is less than 5
  useEffect(() => {
    if (followingCount !== null && followingCount < 5) {
      fetchSuggestedUsers();
    } else if (followingCount !== null && followingCount >= 5) {
      // User has 5+ follows, don't show suggestions
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followingCount]);

  const fetchFollowingCount = async () => {
    if (!user?.id) return;

    try {
      const userIdStr = String(user.id);
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Check if user.id is already a UUID
      if (UUID_REGEX.test(userIdStr)) {
        const result = await restaurantUserService.getFollowingCount(userIdStr);
        if (result.success) {
          setFollowingCount(result.data.followingCount);
        } else {
          // If error, default to showing suggestions
          setFollowingCount(0);
        }
      } else {
        // If not UUID, try to get user UUID first
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          const userResponse = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.data?.id) {
              const result = await restaurantUserService.getFollowingCount(userData.data.id);
              if (result.success) {
                setFollowingCount(result.data.followingCount);
              } else {
                setFollowingCount(0);
              }
            } else {
              setFollowingCount(0);
            }
          } else {
            setFollowingCount(0);
          }
        } else {
          setFollowingCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching following count:', error);
      // Default to showing suggestions on error
      setFollowingCount(0);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      
      // Get auth token if available
      let headers: HeadersInit = {};
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        headers = {
          'Authorization': `Bearer ${idToken}`
        };
      }

      const response = await fetch('/api/v1/restaurant-users/suggested?limit=6', {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggested users');
      }

      const data = await response.json();
      
      if (data.success && data.data?.users) {
        setSuggestedUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      toast.error('Failed to load suggested users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!user || !firebaseUser) {
      toast.error('Please sign in to follow users');
      return;
    }

    const isCurrentlyFollowing = followingStates[userId];
    
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      const idToken = await firebaseUser.getIdToken();
      const endpoint = isCurrentlyFollowing 
        ? '/api/v1/restaurant-users/unfollow'
        : '/api/v1/restaurant-users/follow';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`);
      }

      const result = await response.json();
      
      if (result.success) {
        setFollowingStates(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
        
        // Update follower count optimistically
        setSuggestedUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, followerCount: isCurrentlyFollowing ? u.followerCount - 1 : u.followerCount + 1 }
            : u
        ));

        // Update following count optimistically
        if (!isCurrentlyFollowing) {
          setFollowingCount(prev => (prev !== null ? prev + 1 : 1));
        } else {
          setFollowingCount(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
        }

        // Notify parent component
        if (!isCurrentlyFollowing && onFollowSuccess) {
          onFollowSuccess();
        }
      } else {
        throw new Error(result.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const generateProfileUrl = (username: string) => {
    return `/profile/${username}`;
  };

  // Don't show if user is following 5+ users
  if (followingCount !== null && followingCount >= 5) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        Suggested Food Lovers to Follow
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Start following these popular reviewers to build your feed
      </p>
      
      <div className="space-y-3">
        {suggestedUsers.map((user) => (
          <div 
            key={user.id} 
            className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Link 
              href={generateProfileUrl(user.username)} 
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <FallbackImage
                src={user.avatar || ''}
                alt={user.name}
                width={48}
                height={48}
                className="rounded-full flex-shrink-0"
                type={FallbackImageType.Icon}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.reviewCount} {user.reviewCount === 1 ? 'review' : 'reviews'} • {user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}
                </p>
              </div>
            </Link>
            <button
              onClick={() => handleFollow(user.id, user.username)}
              disabled={followLoading[user.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors flex-shrink-0 ${
                followingStates[user.id]
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-[#ff7c0a] text-white hover:bg-[#e66d08]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {followLoading[user.id] ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : followingStates[user.id] ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Following</span>
                </>
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Follow</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <Link 
        href="/"
        className="block text-center text-[#ff7c0a] hover:text-[#e66d08] font-medium mt-4 text-sm"
      >
        Discover more reviewers →
      </Link>
    </div>
  );
}

