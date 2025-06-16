import { ReviewRepository } from "@/repositories/Reviews/reviewRepository";

export class ReviewService {
    static async fetchAllReviews(first = 16, after: string | null = null, accessToken?: string) {
        try {
            const response = await ReviewRepository.getAllReviews(first, after, accessToken);
            return response;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            throw new Error('Failed to fetch reviews');
        }
    }

    static async fetchCommentReplies(id: string) {
        try {
            const replies = await ReviewRepository.getCommentReplies(id);
            return replies;
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            throw new Error('Failed to fetch comment replies');
        }
    }

    static async postReview(reviewData: any, accessToken: string): Promise<any> {

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
        await ReviewRepository.createReview(formattedData, accessToken);

        return formattedData;
    }

    static async fetchReviewDrafts(accessToken?: string): Promise<any[]> {
        try {
            const drafts = await ReviewRepository.getReviewDrafts(accessToken);
            return drafts;
        } catch (error) {
            console.error("Failed to fetch review drafts", error);
            throw new Error('Failed to fetch review drafts');
        }
    }

    static async deleteReviewDraft(draftId: number, accessToken?: string, force = false): Promise<void> {
        try {
            await ReviewRepository.deleteReviewDraft(draftId, accessToken, force);
        } catch (error) {
            console.error("Failed to delete review draft", error);
            throw new Error('Failed to delete review draft');
        }
    }

    static async fetchUserReviews(userId: number, first = 16, after: string | null = null) {
        try {
            const response = await ReviewRepository.getUserReviews(userId, first, after);
            return response;
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            throw new Error('Failed to fetch user reviews');
        }
    }

    static async likeComment(commentId: number, accessToken: string) {
        try {
            // Return the backend response so the component receives it!
            return await ReviewRepository.likeComment(commentId, accessToken);
        } catch (error) {
            console.error("Failed to like comment", error);
            throw new Error("Failed to like comment");
        }
    }

    static async unlikeComment(commentId: number, accessToken: string) {
        try {
            // Return the backend response so the component receives it!
            return await ReviewRepository.unlikeComment(commentId, accessToken);
        } catch (error) {
            console.error("Failed to unlike comment", error);
            throw new Error("Failed to unlike comment");
        }
    }

    static async getRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string) {
        try {
            return await ReviewRepository.getRestaurantReviews(restaurantId, accessToken, first, after);
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw new Error('Failed to fetch restaurant reviews');
        }
    }
}