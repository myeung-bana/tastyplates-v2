import { GraphQLReview, PageInfo } from '@/types/graphql';

export interface ReviewRepo {
    getAllReviews(first?: number, after?: string | null, accessToken?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }>;
    getCommentReplies(id: string): Promise<GraphQLReview[]>;
    createReview<T>(data: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: T }>;
    getReviewDrafts(accessToken?: string): Promise<Record<string, unknown>[]>;
    deleteReviewDraft(draftId: number, accessToken?: string, force?: boolean): Promise<void>;
    getUserReviews(userId: number, first?: number, after?: string | null): Promise<{ userCommentCount: number; reviews: GraphQLReview[]; pageInfo: PageInfo }>;
    likeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }>;
    unlikeComment(commentId: number, accessToken: string): Promise<{ userLiked: boolean; likesCount: number }>;
    getRestaurantReviews(restaurantId: number, accessToken?: string, first?: number, after?: string): Promise<{ reviews: GraphQLReview[]; pageInfo: PageInfo }>;
    getRestaurantReviewsById(restaurantId: string | number): Promise<GraphQLReview | null>;
    likeReview(reviewId: number, accessToken?: string): Promise<Record<string, unknown>>;
}
