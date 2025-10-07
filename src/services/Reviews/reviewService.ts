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
            // Normalize to Relay global ID expected by WPGraphQL
            const isNumeric = (val: string) => /^\d+$/.test(val.trim());
            const btoaSafe = (input: string) =>
                typeof window !== 'undefined' && typeof window.btoa === 'function'
                    ? window.btoa(input)
                    : Buffer.from(input, 'utf-8').toString('base64');
            const atobSafe = (input: string) => {
                try {
                    return (typeof window !== 'undefined' && typeof window.atob === 'function')
                        ? window.atob(input)
                        : Buffer.from(input, 'base64').toString('utf-8');
                } catch {
                    return '';
                }
            };

            let graphqlId = id;
            if (!graphqlId) {
                throw new Error('Invalid comment id');
            }

            // Check if it's a numeric ID (e.g., "123") or a raw "comment:123" string
            if (!isNaN(Number(id)) && !id.includes(':')) {
                graphqlId = btoaSafe(`comment:${id}`);
            } else if (id.startsWith('comment:') && !id.includes('=')) { // Raw "comment:123"
                graphqlId = btoaSafe(id);
            } else {
                // Assume it's already a valid global ID (base64 encoded)
                // Optionally, decode and re-encode to ensure consistency, but for now, pass as is.
            }

            const replies = await reviewRepo.getCommentReplies(graphqlId);
            return replies;
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            throw new Error('Failed to fetch comment replies');
        }
    }

    async fetchUserReviews(userId: number, first = 16, after: string | null = null, accessToken?: string) {
        try {
            const response = await reviewRepo.getUserReviews(userId, first, after, accessToken);
            return response;
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            throw new Error('Failed to fetch user reviews');
        }
    }

    async likeComment(commentId: number, accessToken: string) {
        try {
            const response = await reviewRepo.likeComment(commentId, accessToken);
            return response;
        } catch (error) {
            console.error('Error liking comment:', error);
            throw new Error('Failed to like comment');
        }
    }

    async unlikeComment(commentId: number, accessToken: string) {
        try {
            const response = await reviewRepo.unlikeComment(commentId, accessToken);
            return response;
        } catch (error) {
            console.error('Error unliking comment:', error);
            throw new Error('Failed to unlike comment');
        }
    }

    async fetchRestaurantReviews(restaurantId: number, accessToken?: string, first = 5, after?: string) {
        try {
            const response = await reviewRepo.getRestaurantReviews(restaurantId, accessToken, first, after);
            return response;
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw new Error('Failed to fetch restaurant reviews');
        }
    }

    async fetchRestaurantReviewsById(restaurantId: string | number) {
        try {
            const response = await reviewRepo.getRestaurantReviewsById(restaurantId);
            return response;
        } catch (error) {
            console.error('Error fetching restaurant reviews by ID:', error);
            throw new Error('Failed to fetch restaurant reviews by ID');
        }
    }

    async postReview(payload: any, accessToken: string) {
        try {
            const response = await reviewRepo.postReview(payload, accessToken);
            return response;
        } catch (error) {
            console.error('Error posting review:', error);
            throw new Error('Failed to post review');
        }
    }
}