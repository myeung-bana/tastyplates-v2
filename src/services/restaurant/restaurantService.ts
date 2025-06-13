// services/restaurant/restaurantService.ts
import { RestaurantRepository } from "@/repositories/restaurant/restaurantRepository";

export const RestaurantService = {
    async fetchRestaurantDetails(slug: string) {
        return await RestaurantRepository.getRestaurantBySlug(slug);
    },

    async fetchAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        cuisineSlug: string | null = null,
        palateSlugs: string[] = [],
        priceRange?: string | null, 
        status: string | null = null,
        recognition: string | null = null,
        sortOption?: string | null, 
        rating: number | null = null
    ) {
        try {
            const taxArray = [];

            if (cuisineSlug && cuisineSlug !== 'all') {
                taxArray.push({
                    taxonomy: 'LISTINGCATEGORY',
                    field: 'SLUG',
                    terms: [cuisineSlug],
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
                recognition,
                sortOption,
                rating
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    },

    async fetchRestaurantById(id: string, idType: string = "DATABASE_ID", accessToken?: string) {
        try {
            return await RestaurantRepository.getRestaurantById(id, idType, accessToken);
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
    }

};