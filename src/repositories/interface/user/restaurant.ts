import { CheckInData, FavoriteListingData } from '@/interfaces/restaurant/restaurant';

export interface RestaurantRepo {
    getRestaurantBySlug(slug: string, palates: string): Promise<Record<string, unknown>>;
    getAllRestaurants(
        searchTerm: string,
        first?: number,
        after?: string | null,
        taxQuery?: Record<string, unknown>,
        priceRange?: string | null,
        status?: string | null,
        userId?: number | null,
        recognition?: string | null,
        sortOption?: string | null,
        rating?: number | null,
        statuses?: string[] | null,
        address?: string | null,
        ethnicSearch?: string | null
    ): Promise<{ nodes: Record<string, unknown>[]; pageInfo: Record<string, unknown> }>;
    getRestaurantById(
        id: string,
        idType?: string,
        accessToken?: string,
        userId?: number | null
    ): Promise<Record<string, unknown>>;
    createListingAndReview(payload: Record<string, unknown>, token: string): Promise<Record<string, unknown>>;
    getFavoriteListing(userId: number, accessToken?: string): Promise<Record<string, unknown>>;
    updateListing(id: number, listingUpdateData: Record<string, unknown>, accessToken?: string): Promise<Record<string, unknown>>;
    deleteListing(id: number, accessToken?: string): Promise<Record<string, unknown>>;
    getlistingDrafts(token: string): Promise<Record<string, unknown>>;
    createFavoriteListing(data: FavoriteListingData, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>>;
    getCheckInRestaurant(userId: number, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>>;
    createCheckIn(data: CheckInData, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>>;
    getRestaurantRatingsCount(restaurantId: number): Promise<number>;
    addRecentlyVisitedRestaurant(postId: number, accessToken?: string): Promise<boolean>;
    getRecentlyVisitedRestaurants(accessToken?: string): Promise<Record<string, unknown>[]>;
    getAddressByPalate(
        searchTerm: string,
        taxQuery: Record<string, unknown>,
        first?: number,
        after?: string | null
    ): Promise<{ nodes: Record<string, unknown>[]; pageInfo: Record<string, unknown>; hasNextPage: boolean; endCursor: string }>;
    getListingsName(
        searchTerm: string,
        first?: number,
        after?: string | null
    ): Promise<{ nodes: Record<string, unknown>[]; pageInfo: Record<string, unknown>; hasNextPage: boolean; endCursor: string }>;
}
