import { ReviewRepository } from "@/repositories/Reviews/reviewRepository";

export class ReviewService {
    static async fetchAllReviews(first = 8, after: string | null = null) {
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
}