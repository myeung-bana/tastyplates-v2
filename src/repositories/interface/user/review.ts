export interface ReviewRepo {
    getAllReviews(first?: number, after?: string | null, accessToken?: string): Promise<{ reviews: Record<string, unknown>[]; pageInfo: Record<string, unknown> }>;
    getCommentReplies(id: string): Promise<Record<string, unknown>[]>;
    createReview<T>(data: Record<string, unknown>, accessToken: string): Promise<{ status: number; data: T }>;
    getReviewDrafts(accessToken?: string): Promise<Record<string, unknown>[]>;
    deleteReviewDraft(draftId: number, accessToken?: string, force?: boolean): Promise<void>;
    getUserReviews(userId: number, first?: number, after?: string | null): Promise<{ userCommentCount: number; reviews: Record<string, unknown>[]; pageInfo: Record<string, unknown> }>;
    likeComment(commentId: number, accessToken: string): Promise<Record<string, unknown>>;
    unlikeComment(commentId: number, accessToken: string): Promise<Record<string, unknown>>;
    getRestaurantReviews(restaurantId: number, accessToken?: string, first?: number, after?: string): Promise<{ reviews: Record<string, unknown>[]; pageInfo: Record<string, unknown> }>;
    getRestaurantReviewsById(restaurantId: string | number): Promise<Record<string, unknown>>;
}
