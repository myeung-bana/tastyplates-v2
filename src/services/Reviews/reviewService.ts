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

            // If already a Relay global ID that decodes to "comment:{n}", use as-is
            const decoded = atobSafe(graphqlId);
            if (decoded && decoded.startsWith('comment:') && isNumeric(decoded.split(':')[1] || '')) {
                // already global id
            } else if (graphqlId.startsWith('comment:')) {
                // raw typename:id -> encode
                graphqlId = btoaSafe(graphqlId);
            } else if (isNumeric(graphqlId)) {
                // numeric -> encode as comment:{id}
                graphqlId = btoaSafe(`comment:${graphqlId}`);
            } else {
                // Fallback: leave as-is (some callers may already pass a valid global id)
            }

            const replies = await reviewRepo.getCommentReplies(graphqlId);
            return replies;
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            throw new Error('Failed to fetch comment replies');
        }
    }

    async postReview(reviewData: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: Record<string, unknown> }> {
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

    async fetchReviewDrafts(accessToken?: string): Promise<Record<string, unknown>[]> {
        try {
            const drafts = await reviewRepo.getReviewDrafts(accessToken);
            return drafts as unknown as Record<string, unknown>[];
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

    async updateReviewDraft(draftId: number, reviewData: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: unknown }> {
        try {
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

            return await reviewRepo.updateReviewDraft(draftId, formattedData, accessToken);
        } catch (error) {
            console.error("Failed to update review draft", error);
            throw new Error('Failed to update review draft');
        }
    }

    async getReviewById(reviewId: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            return await reviewRepo.getReviewById(reviewId, accessToken);
        } catch (error) {
            console.error("Failed to fetch review by ID", error);
            throw new Error('Failed to fetch review by ID');
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

    async likeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
        try {
            // Return the backend response so the component receives it!
            return await reviewRepo.likeComment(commentId, accessToken);
        } catch (error) {
            console.error("Failed to like comment", error);
            throw new Error("Failed to like comment");
        }
    }

    async unlikeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }> {
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

    async likeReview(reviewId: number, accessToken?: string) {
        try {
            return await reviewRepo.likeReview(reviewId, accessToken);
        } catch (error) {
            console.error('Error liking review:', error);
            throw new Error('Failed to like review');
        }
    }
}