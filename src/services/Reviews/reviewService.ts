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
            if (!id) {
                throw new Error('Invalid comment id');
            }

            // Check if ID is a UUID (Hasura format)
            const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (UUID_REGEX.test(id)) {
                // This is a Hasura UUID, use the new API endpoint
                const response = await fetch(`/api/v1/restaurant-reviews/get-replies?parent_review_id=${id}`);
                
                // Check Content-Type before parsing JSON
                const contentType = response.headers.get('content-type');
                const isJson = contentType && contentType.includes('application/json');
                
                if (!response.ok) {
                    // Try to parse error as JSON, but handle HTML responses
                    let errorData = {};
                    if (isJson) {
                        try {
                            errorData = await response.json();
                        } catch {
                            // If JSON parsing fails, read as text to get error message
                            const text = await response.text();
                            throw new Error(text || `Failed to fetch replies: ${response.statusText}`);
                        }
                    } else {
                        const text = await response.text();
                        throw new Error(text || `Failed to fetch replies: ${response.statusText}`);
                    }
                    throw new Error((errorData as any).error || `Failed to fetch replies: ${response.statusText}`);
                }
                
                // Only parse as JSON if Content-Type indicates JSON
                if (!isJson) {
                    const text = await response.text();
                    console.error('Expected JSON but received:', contentType, text.substring(0, 100));
                    throw new Error('Invalid response format: expected JSON but received HTML or other format');
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch replies');
                }
                return result.data || [];
            } else {
                // Legacy WordPress GraphQL format - normalize to Relay global ID expected by WPGraphQL
                const isNumeric = (val: string) => /^\d+$/.test(val.trim());
                const btoaSafe = (input: string) =>
                    typeof window !== 'undefined' && typeof window.btoa === 'function'
                        ? window.btoa(input)
                        : Buffer.from(input, 'utf-8').toString('base64');

                let graphqlId = id;
                // Check if it's a numeric ID (e.g., "123") or a raw "comment:123" string
                if (!isNaN(Number(id)) && !id.includes(':')) {
                    graphqlId = btoaSafe(`comment:${id}`);
                } else if (id.startsWith('comment:') && !id.includes('=')) { // Raw "comment:123"
                    graphqlId = btoaSafe(id);
                }
                // Otherwise assume it's already a valid global ID (base64 encoded)

                const replies = await reviewRepo.getCommentReplies(graphqlId);
                return replies;
            }
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            // Return empty array instead of throwing to prevent UI breakage
            return [];
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

    async likeComment(commentId: number | string, accessToken: string) {
        try {
            // Check if commentId is a UUID (new format) or numeric ID (legacy)
            const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUUID = typeof commentId === 'string' && UUID_REGEX.test(commentId);
            
            if (isUUID) {
                // Use new API v1 endpoint - need to get user ID from token
                // First, get current user's UUID
                const userResponse = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!userResponse.ok) {
                    throw new Error('Failed to get user information');
                }
                
                const userData = await userResponse.json();
                if (!userData.success || !userData.data?.id) {
                    throw new Error('User not found');
                }
                
                const userId = userData.data.id;
                
                // Use toggle-like endpoint
                const response = await fetch('/api/v1/restaurant-reviews/toggle-like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        review_id: commentId,
                        user_id: userId
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to toggle like' }));
                    throw new Error(errorData.error || 'Failed to toggle like');
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to toggle like');
                }
                
                // Return in the expected format
                return {
                    userLiked: result.data.liked ?? false,
                    likesCount: 0 // The API doesn't return count, frontend should refetch if needed
                };
            } else {
                // Legacy numeric ID - use old endpoint (for backward compatibility)
                const response = await reviewRepo.likeComment(Number(commentId), accessToken);
                return response;
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            throw new Error('Failed to like comment');
        }
    }

    async unlikeComment(commentId: number | string, accessToken: string) {
        try {
            // Check if commentId is a UUID (new format) or numeric ID (legacy)
            const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUUID = typeof commentId === 'string' && UUID_REGEX.test(commentId);
            
            if (isUUID) {
                // Use new API v1 endpoint - need to get user ID from token
                // First, get current user's UUID
                const userResponse = await fetch('/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!userResponse.ok) {
                    throw new Error('Failed to get user information');
                }
                
                const userData = await userResponse.json();
                if (!userData.success || !userData.data?.id) {
                    throw new Error('User not found');
                }
                
                const userId = userData.data.id;
                
                // Use toggle-like endpoint (same endpoint for like/unlike)
                const response = await fetch('/api/v1/restaurant-reviews/toggle-like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        review_id: commentId,
                        user_id: userId
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to toggle like' }));
                    throw new Error(errorData.error || 'Failed to toggle like');
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to toggle like');
                }
                
                // Return in the expected format
                return {
                    userLiked: result.data.liked ?? false,
                    likesCount: 0 // The API doesn't return count, frontend should refetch if needed
                };
            } else {
                // Legacy numeric ID - use old endpoint (for backward compatibility)
                const response = await reviewRepo.unlikeComment(Number(commentId), accessToken);
                return response;
            }
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

    async createComment(input: {
        parent_review_id: string;
        author_id: string;
        content: string;
        restaurant_uuid?: string;
    }, accessToken: string) {
        try {
            const response = await fetch('/api/v1/restaurant-reviews/create-comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to create comment: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error creating comment:', error);
            throw new Error('Failed to create comment');
        }
    }

    async fetchReviewDrafts(accessToken: string) {
        try {
            const response = await reviewRepo.getReviewDrafts(accessToken);
            return response || [];
        } catch (error) {
            console.error('Error fetching review drafts:', error);
            // Return empty array instead of throwing to prevent UI breakage
            return [];
        }
    }

    async deleteReviewDraft(draftId: number, accessToken: string, force?: boolean) {
        try {
            await reviewRepo.deleteReviewDraft(draftId, accessToken, force);
        } catch (error) {
            console.error('Error deleting review draft:', error);
            throw new Error('Failed to delete review draft');
        }
    }

    async getReviewById(reviewId: number, accessToken: string) {
        try {
            const response = await reviewRepo.getReviewById(reviewId, accessToken);
            return response;
        } catch (error) {
            console.error('Error fetching review by ID:', error);
            throw new Error('Failed to fetch review');
        }
    }

    async updateReviewDraft(draftId: number, data: Record<string, unknown>, accessToken: string) {
        try {
            const response = await reviewRepo.updateReviewDraft(draftId, data, accessToken);
            return response;
        } catch (error) {
            console.error('Error updating review draft:', error);
            throw new Error('Failed to update review draft');
        }
    }
}