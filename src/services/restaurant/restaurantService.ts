import { RestaurantRepository } from "@/repositories/restaurant/restaurantRepository";

export const RestaurantService = {
    async fetchRestaurantDetails(slug: string) {
        return await RestaurantRepository.getRestaurantBySlug(slug);
    },

    async fetchAllRestaurants(searchTerm: string, first = 8, after: string | null = null) {
        try {
            return await RestaurantRepository.getAllRestaurants(searchTerm, first, after);
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    }

};