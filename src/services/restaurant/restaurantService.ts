// services/restaurant/restaurantService.ts
import { CheckInData, FavoriteListingData } from "@/interfaces/restaurant/restaurant";
import { RestaurantRepository } from "@/repositories/http/restaurant/restaurantRepository";
import { RestaurantRepo } from "@/repositories/interface/user/restaurant";

const restaurantRepo: RestaurantRepo = new RestaurantRepository()

export class RestaurantService {
    async fetchRestaurantDetails(slug: string, palates: string | null = null) {
        return await restaurantRepo.getRestaurantBySlug(slug, palates ?? '');
    }

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

            // Note: Palate filtering is now handled via palateReviewedBy parameter
            // instead of taxQuery to find restaurants reviewed by users with specific palates

            const taxQuery = taxArray.length > 0 ? {
                relation: 'AND',
                taxArray: taxArray,
            } : {};

            // Disable backend ordering and rely on client-side sorting for better control
            // This ensures palate-based ranking works correctly
            let orderBy = null;

            console.log('🔍 RestaurantService parameters:', {
                searchTerm,
                taxQuery,
                ethnicSearch,
                palates: palateSlugs.join(','),
                palateSlugs
            });

            return await restaurantRepo.getAllRestaurants(
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
                ethnicSearch,
                palateSlugs.join(','), // Pass palates as comma-separated string
                orderBy
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    }

    async fetchRestaurantById(id: string, idType: string = "DATABASE_ID", accessToken?: string, userId?: number | null) {
        try {
            return await restaurantRepo.getRestaurantById(id, idType, accessToken, userId);
        } catch (error) {
            console.error('Error fetching restaurant by ID:', error);
            throw new Error('Failed to fetch restaurant by ID');
        }
    }

    async createRestaurantListingAndReview(payload: Record<string, unknown>, token: string): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.createListingAndReview(payload, token);
        } catch (error) {
            console.error("Error creating listing and review:", error);
            throw new Error("Failed to create listing and review");
        }
    }


    async fetchPendingRestaurants(token: string): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.getlistingDrafts(token);
        } catch (error) {
            console.error('Error fetching pending restaurants:', error);
            throw new Error('Failed to fetch pending restaurants');
        }
    }

    async createFavoriteListing(data: FavoriteListingData, accessToken?: string, jsonResponse: boolean = true): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.createFavoriteListing(data, accessToken, jsonResponse);
        }
        catch (error) {
            console.error('Error creating favorite listing:', error);
            throw new Error('Failed to create favorite listing');
        }
    }

    async fetchFavoritingListing(userId: number, accessToken?: string) {
        try {
            return await restaurantRepo.getFavoriteListing(userId, accessToken);
        } catch (error) {
            console.error('Error fetching favoriting list:', error);
            throw new Error('Failed to fetch favoriting list');
        }
    }

    async fetchCheckInRestaurant(userId: number, accessToken?: string, jsonResponse: boolean = true): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.getCheckInRestaurant(userId, accessToken, jsonResponse);
        } catch (error) {
            console.error('Error fetching check-in restaurant:', error);
            throw new Error('Failed to fetch check-in restaurant');
        }
    }

    async createCheckIn(data: CheckInData, accessToken?: string, jsonResponse: boolean = true): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.createCheckIn(data, accessToken, jsonResponse);
        } catch (error) {
            console.error('Error creating check-in:', error);
            throw new Error('Failed to create check-in');
        }
    }

    async updateRestaurantListing(
        id: number,
        listingUpdateData: Record<string, unknown>,
        accessToken?: string
    ) {
        try {
            // Delegate the actual API call to the repository
            return await restaurantRepo.updateListing(id, listingUpdateData, accessToken);
        } catch (error) {
            console.error('Error updating restaurant listing in service:', error);
            throw new Error('Failed to update restaurant listing');
        }
    }

    async deleteRestaurantListing(id: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            return await restaurantRepo.deleteListing(id, accessToken);
        } catch (error) {
            console.error('Error deleting restaurant listing in service:', error);
            throw new Error('Failed to delete restaurant listing');
        }
    }

    async fetchRestaurantRatingsCount(restaurantId: number): Promise<number> {
        return await restaurantRepo.getRestaurantRatingsCount(restaurantId);
    }

    async addRecentlyVisitedRestaurant(postId: number, accessToken?: string) {
        try {
            return await restaurantRepo.addRecentlyVisitedRestaurant(postId, accessToken);
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            throw new Error('Failed to add recently visited restaurant');
        }
    }

    async fetchRecentlyVisitedRestaurants(accessToken?: string) {
        try {
            return await restaurantRepo.getRecentlyVisitedRestaurants(accessToken);
        } catch (error) {
            console.error('Error fetching recently visited restaurants:', error);
            throw new Error('Failed to fetching recently visited restaurants');
        }
    }

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

            return await restaurantRepo.getAddressByPalate(searchTerm, taxQuery, first, after);
        } catch (error) {
            console.error('Error fetching by palate:', error);
            throw new Error('Failed to fetch restaurants by palate');
        }
    }

    async fetchListingsName(
        searchTerm: string,
        first = 32,
        after: string | null = null,
    ) {
        try {
            return await restaurantRepo.getListingsName(
                searchTerm,
                first,
                after
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    }
};