// services/restaurant/restaurantService.ts
import { RestaurantRepository } from "@/repositories/restaurant/restaurantRepository";

export const RestaurantService = {
    async fetchRestaurantDetails(slug: string, palates: string | null = null) {
        return await RestaurantRepository.getRestaurantBySlug(slug, palates ?? '');
    },

    async fetchAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        cuisineSlug: string[] | null = null,
        palateSlugs: string[] = [],
        priceRange?: string | null,
        status: string | null = null,
        userId?: number | null,
        recognition: string | null = null,
        sortOption?: string | null,
        rating: number | null = null,
        statuses: string[] | null = null,
        address: string | null = null,
        ethnicSearch: string | null = null
    ) {
        try {
            const taxArray = [];

            if (cuisineSlug && cuisineSlug.length > 0 && cuisineSlug[0] !== 'all') {
                taxArray.push({
                    taxonomy: 'LISTINGCATEGORY',
                    field: 'SLUG',
                    terms: cuisineSlug,
                    operator: 'IN',
                });
            }

            if (palateSlugs && palateSlugs.length > 0 && palateSlugs[0] !== 'all') {
                taxArray.push({
                    taxonomy: 'PALATE',
                    field: 'SLUG',
                    terms: palateSlugs,
                    operator: 'IN',
                });
            }

            const taxQuery = taxArray.length > 0 ? {
                relation: 'AND',
                taxArray: taxArray,
            } : {};

            return await RestaurantRepository.getAllRestaurants(
                searchTerm,
                first,
                after,
                taxQuery,
                priceRange,
                status,
                userId,
                recognition,
                sortOption,
                rating,
                statuses,
                address,
                ethnicSearch
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    },

    async fetchRestaurantById(id: string, idType: string = "DATABASE_ID", accessToken?: string, userId?: number | null) {
        try {
            return await RestaurantRepository.getRestaurantById(id, idType, accessToken, userId);
        } catch (error) {
            console.error('Error fetching restaurant by ID:', error);
            throw new Error('Failed to fetch restaurant by ID');
        }
    },

    async createRestaurantListing(formData: FormData, token: string): Promise<any> {
        try {
            return await RestaurantRepository.createListing(formData, token);
        } catch (error) {
            console.error('Error creating restaurant listing:', error);
            throw new Error('Failed to create restaurant listing');
        }
    },

    async fetchPendingRestaurants(token: string): Promise<any> {
        try {
            return await RestaurantRepository.getlistingDrafts(token);
        } catch (error) {
            console.error('Error fetching pending restaurants:', error);
            throw new Error('Failed to fetch pending restaurants');
        }
    },

    async updateRestaurantListing(
        id: number,
        listingUpdateData: Record<string, any>,
        accessToken?: string
    ) {
        try {
            // Delegate the actual API call to the repository
            return await RestaurantRepository.updateListing(id, listingUpdateData, accessToken);
        } catch (error) {
            console.error('Error updating restaurant listing in service:', error);
            throw new Error('Failed to update restaurant listing');
        }
    },

    async deleteRestaurantListing(id: number, accessToken?: string): Promise<any> {
        try {
            return await RestaurantRepository.deleteListing(id, accessToken);
        } catch (error) {
            console.error('Error deleting restaurant listing in service:', error);
            throw new Error('Failed to delete restaurant listing');
        }
    },

    async fetchRestaurantRatingsCount(restaurantId: number): Promise<number> {
        return await RestaurantRepository.getRestaurantRatingsCount(restaurantId);
    },

    async addRecentlyVisitedRestaurant(postId: number, accessToken?: string) {
        try {
            return await RestaurantRepository.addRecentlyVisitedRestaurant(postId, accessToken);
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            throw new Error('Failed to add recently visited restaurant');
        }
    },

    async fetchRecentlyVisitedRestaurants(accessToken?: string) {
        try {
            return await RestaurantRepository.getRecentlyVisitedRestaurants(accessToken);
        } catch (error) {
            console.error('Error fetching recently visited restaurants:', error);
            throw new Error('Failed to fetching recently visited restaurants');
        }
    },

    async fetchAddressByPalate(
        searchTerm: string,
        palateSlugs: string[],
        first = 32,
        after: string | null = null
    ) {
        try {
            const taxQuery = palateSlugs.length > 0 ? {
                relation: 'AND',
                taxArray: [
                    {
                        taxonomy: 'PALATE',
                        field: 'SLUG',
                        terms: palateSlugs,
                        operator: 'IN',
                    },
                ],
            } : {};

            return await RestaurantRepository.getAddressByPalate(searchTerm, taxQuery, first, after);
        } catch (error) {
            console.error('Error fetching by palate:', error);
            throw new Error('Failed to fetch restaurants by palate');
        }
    },

    async fetchListingsName(
        searchTerm: string,
        first = 32,
        after: string | null = null,
    ) {
        try {
            return await RestaurantRepository.getListingsName(
                searchTerm,
                first,
                after
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    },
};