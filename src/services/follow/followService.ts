import { FollowRepository, FollowListResponse } from '@/repositories/http/follow/followRepository';
import { followUserResponse, isFollowingUserResponse } from '@/interfaces/user/user';
import { responseStatusCode as code } from '@/constants/response';
import { DEFAULT_USER_ICON } from '@/constants/images';

export class FollowService {
  private repository = new FollowRepository();

  async followUser(userId: number, token: string): Promise<followUserResponse> {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    try {
      const res = await this.repository.followUser(userId, token);
      return {
        ...res,
        status: res.status || code.success,
      };
    } catch (error) {
      console.error('Follow user error:', error);
      return {
        result: 'error',
        following: 0,
        followers: 0,
        status: 500,
        message: 'Failed to follow user. Please try again.',
      };
    }
  }

  async unfollowUser(userId: number, token: string): Promise<followUserResponse> {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    try {
      const res = await this.repository.unfollowUser(userId, token);
      return {
        ...res,
        status: res.status || code.success,
      };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return {
        result: 'error',
        following: 0,
        followers: 0,
        status: 500,
        message: 'Failed to unfollow user. Please try again.',
      };
    }
  }

  async isFollowingUser(userId: number, token: string): Promise<isFollowingUserResponse> {
    if (!token) {
      return { is_following: false };
    }

    try {
      const res = await this.repository.isFollowingUser(userId, token);
      return res;
    } catch (error) {
      console.error('Check following user error:', error);
      return { is_following: false };
    }
  }

  async getFollowingList(userId: number, token: string): Promise<Array<Record<string, unknown>>> {
    if (!token) {
      return [];
    }

    try {
      const users = await this.repository.getFollowingList(userId, token);
      return users.map(user => ({
        id: user.id,
        name: user.display_name || user.username,
        cuisines: Array.isArray(user.palates) ? user.palates : (user.palates?.split('|').map(p => p.trim()).filter(p => p.length > 0) || []),
        image: user.profile_image || user.image || DEFAULT_USER_ICON,
        isFollowing: true,
      }));
    } catch (error) {
      console.error('Get following list error:', error);
      return [];
    }
  }

  async getFollowersList(userId: number, followingList: Array<Record<string, unknown>>, token: string): Promise<Array<Record<string, unknown>>> {
    if (!token) {
      return [];
    }

    try {
      const users = await this.repository.getFollowersList(userId, token);
      return users.map(user => ({
        id: user.id,
        name: user.display_name || user.username,
        cuisines: Array.isArray(user.palates) ? user.palates : (user.palates?.split('|').map(p => p.trim()).filter(p => p.length > 0) || []),
        image: user.profile_image || user.image || DEFAULT_USER_ICON,
        isFollowing: followingList.some(f => f.id === user.id),
      }));
    } catch (error) {
      console.error('Get followers list error:', error);
      return [];
    }
  }
}
