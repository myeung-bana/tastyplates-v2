import { FollowingReviewRepository, FollowingReviewsResponse, SuggestedUsersResponse } from '@/repositories/http/following/followingReviewRepository';

export class FollowingReviewService {
  private repository = new FollowingReviewRepository();

  async getFollowingReviews(page: number = 1, accessToken: string): Promise<FollowingReviewsResponse> {
    try {
      return await this.repository.getFollowingReviews(page, accessToken);
    } catch (error) {
      console.error('Error fetching following reviews:', error);
      throw new Error('Failed to fetch following reviews');
    }
  }

  async getSuggestedUsers(accessToken: string): Promise<SuggestedUsersResponse> {
    try {
      return await this.repository.getSuggestedUsers(accessToken);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      throw new Error('Failed to fetch suggested users');
    }
  }
}
