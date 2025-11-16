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

  async getFollowingList(userId: number, token?: string): Promise<FollowListResponse> {
    // Validate and ensure userId is a valid number
    const numericUserId = Number(userId);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      console.error('Repository getFollowingList: Invalid userId', { 
        originalUserId: userId, 
        type: typeof userId,
        numericUserId 
      });
      return [];
    }

    // Public endpoint - only send Authorization header if token is provided
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const url = `/wp-json/v1/following-list?user_id=${numericUserId}`;
      console.log('Repository getFollowingList: Calling endpoint', { 
        url, 
        userId: numericUserId, 
        userIdType: typeof numericUserId 
      });
      
      const response = await request.GET(url, {
        headers: headers,
      });
      
      // Check if response indicates an error (status code >= 400)
      // WordPress REST API errors can have status in response.status or response.data.status
      const errorStatus = (response as any)?.status || (response as any)?.data?.status;
      if (response && typeof response === 'object' && errorStatus && errorStatus >= 400) {
        console.warn('Repository getFollowingList: API returned error response', { 
          status: errorStatus, 
          message: (response as any).message || (response as any).data?.message,
          code: (response as any).code,
          userId 
        });
        return [];
      }
      
      // Handle empty array - this is valid (user has no following)
      if (Array.isArray(response)) {
        // Empty array is a valid response - user simply has no following
        return response as unknown as FollowListResponse;
      }
      
      // Handle null or undefined - treat as empty list (user has no following)
      if (response === null || response === undefined) {
        return [];
      }
      
      // Handle non-array responses (unexpected format)
      console.warn('Repository getFollowingList: API returned non-array response', { 
        responseType: typeof response,
        responseKeys: typeof response === 'object' ? Object.keys(response) : null,
        userId 
      });
      return [];
    } catch (error) {
      // Safely log error without causing issues with circular references
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Repository getFollowingList error:', {
        message: errorMessage,
        stack: errorStack,
        userId,
      });
      // Return empty array on error - user will see no following list
      return [];
    }
  }

  async getFollowersList(userId: number, token?: string): Promise<FollowListResponse> {
    // Validate and ensure userId is a valid number
    const numericUserId = Number(userId);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      console.error('Repository getFollowersList: Invalid userId', { 
        originalUserId: userId, 
        type: typeof userId,
        numericUserId 
      });
      return [];
    }

    // Public endpoint - only send Authorization header if token is provided
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const url = `/wp-json/v1/followers-list?user_id=${numericUserId}`;
      console.log('Repository getFollowersList: Calling endpoint', { 
        url, 
        userId: numericUserId, 
        userIdType: typeof numericUserId 
      });
      
      const response = await request.GET(url, {
        headers: headers,
      });
      
      // Check if response indicates an error (status code >= 400)
      // WordPress REST API errors can have status in response.status or response.data.status
      const errorStatus = (response as any)?.status || (response as any)?.data?.status;
      if (response && typeof response === 'object' && errorStatus && errorStatus >= 400) {
        console.warn('Repository getFollowersList: API returned error response', { 
          status: errorStatus, 
          message: (response as any).message || (response as any).data?.message,
          code: (response as any).code,
          userId 
        });
        return [];
      }
      
      // Handle empty array - this is valid (user has no followers)
      if (Array.isArray(response)) {
        // Empty array is a valid response - user simply has no followers
        return response as unknown as FollowListResponse;
      }
      
      // Handle null or undefined - treat as empty list (user has no followers)
      if (response === null || response === undefined) {
        return [];
      }
      
      // Handle non-array responses (unexpected format)
      console.warn('Repository getFollowersList: API returned non-array response', { 
        responseType: typeof response,
        responseKeys: typeof response === 'object' ? Object.keys(response) : null,
        userId 
      });
      return [];
    } catch (error) {
      // Safely log error without causing issues with circular references
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Repository getFollowersList error:', {
        message: errorMessage,
        stack: errorStack,
        userId,
      });
      // Return empty array on error - user will see no followers list
      return [];
    }
  }
}
