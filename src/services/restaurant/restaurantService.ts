import { RestaurantRepository } from "@/repositories/restaurant/restaurantRepository";

export const RestaurantService = {
    async fetchRestaurantDetails(slug: string) {
        return await RestaurantRepository.getRestaurantBySlug(slug);
    },

    async fetchAllRestaurants(searchTerm: string, first = 8, after: string | null = null, status: string | null = null) {
        try {
            return await RestaurantRepository.getAllRestaurants(searchTerm, first, after, status);
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
    },

    async fetchPendingRestaurants(token: string): Promise<any> {
        try {
            return await RestaurantRepository.getlistingDrafts(token);
        } catch (error) {
            console.error('Error fetching pending restaurants:', error);
            throw new Error('Failed to fetch pending restaurants');
        }
    }

};