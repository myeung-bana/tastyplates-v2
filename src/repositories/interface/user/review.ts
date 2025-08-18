export interface ReviewRepo {
    getAllReviews(first?: number, after?: string | null, accessToken?: string): Promise<{ reviews: any[]; pageInfo: any }>;
    getCommentReplies(id: string): Promise<any[]>;
    createReview<T>(data: any, accessToken: string): Promise<{ status: number; data: T }>;
    getReviewDrafts(accessToken?: string): Promise<any[]>;
    deleteReviewDraft(draftId: number, accessToken?: string, force?: boolean): Promise<void>;
    getUserReviews(userId: number, first?: number, after?: string | null): Promise<{ userCommentCount: number; reviews: any[]; pageInfo: any }>;
    likeComment(commentId: number, accessToken: string): Promise<any>;
    unlikeComment(commentId: number, accessToken: string): Promise<any>;
    getRestaurantReviews(restaurantId: number, accessToken?: string, first?: number, after?: string): Promise<{ reviews: any[]; pageInfo: any }>;
    getRestaurantReviewsById(restaurantId: string | number): Promise<any>;
}
