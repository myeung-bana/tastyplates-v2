import { ReviewRepository } from "@/repositories/http/Reviews/reviewRepository";
import { ReviewRepo } from "@/repositories/interface/user/review";

const reviewRepo: ReviewRepo = new ReviewRepository()

export class ReviewService {
    async fetchAllReviews(first = 16, after: string | null = null, accessToken?: string) {
        try {
            const response = await reviewRepo.getAllReviews(first, after, accessToken);
            return response;
            // const filteredReviews = response?.reviews.filter((review: any) => {
            //     return (
            //         review.author?.node?.databaseId ||
            //         review.author?.databaseId
            //     );
            // });

            // return {
            //     reviews: filteredReviews,
            //     pageInfo: response.pageInfo,
            // };
        } catch (error) {
            console.error('Error fetching reviews:', error);
            throw new Error('Failed to fetch reviews');
        }
    }

    async fetchCommentReplies(id: string) {
        try {
            const replies = await reviewRepo.getCommentReplies(id);
            return replies;
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            throw new Error('Failed to fetch comment replies');
        }
    }

    async postReview(reviewData: any, accessToken: string): Promise<{ status: number; data: any }> {
        const formattedData = {
            post: reviewData.restaurantId,
            parent: reviewData.parent || 0,
            author: reviewData.authorId,
            content: reviewData.content || '',
            review_main_title: reviewData.review_main_title || '',
            review_stars: reviewData.review_stars || 0,
            review_images_idz: reviewData.review_images_idz || [],
            recognitions: reviewData.recognitions || [],
            mode: reviewData.mode,
        };

        return await reviewRepo.createReview(formattedData, accessToken);
    }

    async fetchReviewDrafts(accessToken?: string): Promise<any[]> {
        try {
            const drafts = await reviewRepo.getReviewDrafts(accessToken);
            return drafts;
        } catch (error) {
            console.error("Failed to fetch review drafts", error);
            throw new Error('Failed to fetch review drafts');
        }
    }

    async deleteReviewDraft(draftId: number, accessToken?: string, force = false): Promise<void> {
        try {
            await reviewRepo.deleteReviewDraft(draftId, accessToken, force);
        } catch (error) {
            console.error("Failed to delete review draft", error);
            throw new Error('Failed to delete review draft');
        }
    }

    async fetchUserReviews(userId: number, first = 16, after: string | null = null) {
        try {
            const response = await reviewRepo.getUserReviews(userId, first, after);
            return response;
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            throw new Error('Failed to fetch user reviews');
        }
    }

    async likeComment(commentId: number, accessToken: string) {
        try {
            // Return the backend response so the component receives it!
            return await reviewRepo.likeComment(commentId, accessToken);
        } catch (error) {
            console.error("Failed to like comment", error);
            throw new Error("Failed to like comment");
        }
    }

    async unlikeComment(commentId: number, accessToken: string): Promise<{ status: number; data: any }> {
        try {
            // Return the backend response so the component receives it!
            return await reviewRepo.unlikeComment(commentId, accessToken);
        } catch (error) {
            console.error("Failed to unlike comment", error);
            throw new Error("Failed to unlike comment");
        }
    }

    async getRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string) {
        try {
            return await reviewRepo.getRestaurantReviews(restaurantId, accessToken, first, after);
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw new Error('Failed to fetch restaurant reviews');
        }
    }

    async fetchRestaurantReviewsById(restaurantId: string | number) {
        try {
            return await reviewRepo.getRestaurantReviewsById(restaurantId);
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw new Error('Failed to fetch restaurant reviews');
        }
    }
}