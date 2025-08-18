import { CheckInData, FavoriteListingData } from '@/interfaces/restaurant/restaurant';

export interface RestaurantRepo {
    getRestaurantBySlug(slug: string, palates: string): Promise<any>;
    getAllRestaurants(
        searchTerm: string,
        first?: number,
        after?: string | null,
        taxQuery?: any,
        priceRange?: string | null,
        status?: string | null,
        userId?: number | null,
        recognition?: string | null,
        sortOption?: string | null,
        rating?: number | null,
        statuses?: string[] | null,
        address?: string | null,
        ethnicSearch?: string | null
    ): Promise<{ nodes: any[]; pageInfo: any }>;
    getRestaurantById(
        id: string,
        idType?: string,
        accessToken?: string,
        userId?: number | null
    ): Promise<any>;
    createListingAndReview(payload: any, token: string): Promise<any>;
    getFavoriteListing(userId: number, accessToken?: string): Promise<any>;
    updateListing(id: number, listingUpdateData: Record<string, any>, accessToken?: string): Promise<any>;
    deleteListing(id: number, accessToken?: string): Promise<any>;
    getlistingDrafts(token: string): Promise<any>;
    createFavoriteListing(data: FavoriteListingData, accessToken?: string, jsonResponse?: boolean): Promise<any>;
    getCheckInRestaurant(userId: number, accessToken?: string, jsonResponse?: boolean): Promise<any>;
    createCheckIn(data: CheckInData, accessToken?: string, jsonResponse?: boolean): Promise<any>;
    getRestaurantRatingsCount(restaurantId: number): Promise<number>;
    addRecentlyVisitedRestaurant(postId: number, accessToken?: string): Promise<boolean>;
    getRecentlyVisitedRestaurants(accessToken?: string): Promise<any[]>;
    getAddressByPalate(
        searchTerm: string,
        taxQuery: any,
        first?: number,
        after?: string | null
    ): Promise<{ nodes: any[]; pageInfo: any; hasNextPage: boolean; endCursor: string }>;
    getListingsName(
        searchTerm: string,
        first?: number,
        after?: string | null
    ): Promise<{ nodes: any[]; pageInfo: any; hasNextPage: boolean; endCursor: string }>;
}
