import { ReviewRepository } from "@/repositories/Reviews/reviewRepository";

export class ReviewService {
    static async fetchAllReviews(first = 16, after: string | null = null) {
        try {
            const response = await ReviewRepository.getAllReviews(first, after);
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
            author: reviewData.authorId,
            content: reviewData.content || '',
            review_main_title: reviewData.review_main_title || '',
            review_stars: reviewData.review_stars || 0,
            review_images_idz: reviewData.review_images_idz || [],
            recognitions: reviewData.recognitions || [],
        };
        await ReviewRepository.createReview(formattedData, accessToken);

        return formattedData;
    }
}