import HttpMethods from '../requests';
import { followUserResponse, isFollowingUserResponse } from '@/interfaces/user/user';

const request = new HttpMethods();

export interface FollowUser {
  id: number;
  username: string;
  display_name: string;
  profile_image?: string;
  image?: string;
  palates?: string | string[]; // Can be string or array
}

export type FollowListResponse = FollowUser[];

export class FollowRepository {
  async followUser(userId: number, token: string): Promise<followUserResponse> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await request.POST('/wp-json/v1/follow', {
        body: JSON.stringify({ user_id: userId }),
        headers: headers,
      });
      return response as unknown as followUserResponse;
    } catch (error) {
      console.error('Repository followUser error:', error);
      throw new Error('Failed to follow user');
    }
  }

  async unfollowUser(userId: number, token: string): Promise<followUserResponse> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await request.POST('/wp-json/v1/unfollow', {
        body: JSON.stringify({ user_id: userId }),
        headers: headers,
      });
      return response as unknown as followUserResponse;
    } catch (error) {
      console.error('Repository unfollowUser error:', error);
      throw new Error('Failed to unfollow user');
    }
  }

  async isFollowingUser(userId: number, token: string): Promise<isFollowingUserResponse> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await request.POST('/wp-json/v1/is-following', {
        body: JSON.stringify({ user_id: userId }),
        headers: headers,
      });
      return response as unknown as isFollowingUserResponse;
    } catch (error) {
      console.error('Repository isFollowingUser error:', error);
      return { is_following: false };
    }
  }

  async getFollowingList(userId: number, token: string): Promise<FollowListResponse> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await request.GET(`/wp-json/v1/following-list?user_id=${userId}`, {
        headers: headers,
      });
      return response as unknown as FollowListResponse;
    } catch (error) {
      console.error('Repository getFollowingList error:', error);
      return [];
    }
  }

  async getFollowersList(userId: number, token: string): Promise<FollowListResponse> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await request.GET(`/wp-json/v1/followers-list?user_id=${userId}`, {
        headers: headers,
      });
      return response as unknown as FollowListResponse;
    } catch (error) {
      console.error('Repository getFollowersList error:', error);
      return [];
    }
  }
}
