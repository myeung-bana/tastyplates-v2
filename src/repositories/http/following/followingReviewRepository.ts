import HttpMethods from '../requests';

const request = new HttpMethods();

export interface FollowingReview {
  id: number;
  content: string;
  date: string;
  stars: number;
  title: string;
  images: string[];
  restaurant: {
    id: number;
    name: string;
  };
  author: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
  };
}

export interface SuggestedUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  follower_count: number;
  review_count: number;
}

export interface FollowingReviewsResponse {
  reviews: FollowingReview[];
  has_more: boolean;
}

export interface SuggestedUsersResponse {
  suggested_users: SuggestedUser[];
}

export class FollowingReviewRepository {
  async getFollowingReviews(page: number = 1, accessToken: string): Promise<FollowingReviewsResponse> {
    const response = await request.GET(
      `/wp-json/v1/following-reviews?page=${page}&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response as FollowingReviewsResponse;
  }

  async getSuggestedUsers(accessToken: string): Promise<SuggestedUsersResponse> {
    const response = await request.GET('/wp-json/v1/suggested-users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response as SuggestedUsersResponse;
  }
}
