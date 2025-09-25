// repositories/restaurant/restaurantRepository.ts
import client from "@/app/graphql/client";
import {
    GET_LISTINGS,
    GET_RESTAURANT_BY_SLUG,
    GET_RESTAURANT_BY_ID,
    ADD_RECENTLY_VISITED_RESTAURANT,
    GET_RECENTLY_VISITED_RESTAURANTS,
    GET_LISTINGS_NAME,
} from "@/app/graphql/Restaurant/restaurantQueries";
import { GET_ADDRESS_BY_PALATE_NO_TAX, GET_ADDRESS_BY_PALATE_WITH_TAX } from "@/app/graphql/Restaurant/addressQueries";
import { CheckInData, FavoriteListingData } from "@/interfaces/restaurant/restaurant";
import { RestaurantRepo } from "@/repositories/interface/user/restaurant";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class RestaurantRepository implements RestaurantRepo {
    async getRestaurantBySlug(slug: string, palates: string) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_SLUG,
            fetchPolicy: "no-cache",
            variables: {
                slug,
                palates
            },
        });
        return data.listing;
    }

    async getAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        taxQuery: Record<string, unknown> = {},
        priceRange?: string | null,
        status: string | null = null,
        userId?: number | null,
        recognition: string | null = null,
        sortOption?: string | null,
        rating: number | null = null,
        statuses: string[] | null = null,
        address: string | null = null,
        ethnicSearch: string | null = null,
        palates?: string,
        orderBy?: unknown[]
    ) {
        // Keep search term separate from location filtering
        const enhancedSearchTerm = searchTerm;

        const variables = {
            searchTerm: enhancedSearchTerm,
            first,
            after,
            taxQuery,
            priceRange,
            status,
            userId,
            recognition,
            recognitionSort: sortOption,
            minAverageRating: rating,
            statuses: statuses || [],
            streetAddress: null, // Use client-side filtering for multi-field location search
            ethnicSearch: ethnicSearch || null, // Don't filter by empty string
            palates: palates || null, // Don't filter by empty string
            orderBy: orderBy || null,
        };

        console.log('🔍 GraphQL query variables:', variables);
        console.log('📍 Search term:', enhancedSearchTerm);
        console.log('📍 Location filter (client-side):', address || 'None');

        const { data } = await client.query({
            query: GET_LISTINGS,
            variables,
        });
        return {
            nodes: data.listings.nodes,
            pageInfo: data.listings.pageInfo,
        };
    }

    async getRestaurantById(
        id: string,
        idType: string = "DATABASE_ID",
        accessToken?: string,
        userId?: number | null
    ) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_ID,
            variables: {
                id,
                idType,
                accessToken,
                userId
            },
        });
        return data.listing;
    }

    async addRecentlyVisitedRestaurant(restaurantId: number, accessToken: string) {
        try {
            const { data } = await client.mutate({
                mutation: ADD_RECENTLY_VISITED_RESTAURANT,
                variables: {
                    restaurantId,
                    accessToken
                },
            });
            return data;
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            throw error;
        }
    }

    async getRecentlyVisitedRestaurants(accessToken?: string,) {
        try {
            const { data } = await client.query({
                query: GET_RECENTLY_VISITED_RESTAURANTS,
                variables: {
                    accessToken
                },
            });
            return data.recentlyVisitedRestaurants;
        } catch (error) {
            console.error('Error fetching recently visited restaurants:', error);
            throw error;
        }
    }

    async getAddressByPalate(
        searchTerm: string,
        taxQuery: Record<string, unknown>,
        first = 32,
        after: string | null = null,
    ) {
        const hasTaxQuery = taxQuery && Object.keys(taxQuery).length > 0;
        const variables: Record<string, unknown> = { searchTerm, first, after };

        if (hasTaxQuery) {
            variables.taxQuery = taxQuery;
        }

        const { data } = await client.query({
            query: hasTaxQuery
                ? GET_ADDRESS_BY_PALATE_WITH_TAX
                : GET_ADDRESS_BY_PALATE_NO_TAX,
            variables,
            fetchPolicy: 'network-only',
        });

        return {
            nodes: data.listings.nodes,
            pageInfo: data.listings.pageInfo,
            hasNextPage: data.listings.pageInfo.hasNextPage,
            endCursor: data.listings.pageInfo.endCursor,
        };
    }

    async getListingsName(
        searchTerm: string,
        first = 32,
        after: string | null = null,
    ) {
        try {
            const { data } = await client.query({
                query: GET_LISTINGS_NAME,
                variables: {
                    searchTerm,
                    first,
                    after
                },
            });
            return {
                nodes: data.listings.nodes,
                pageInfo: data.listings.pageInfo,
            };
        } catch (error) {
            console.error('Error fetching listings name:', error);
            throw new Error('Failed to fetch listings name');
        }
    }

    async checkInRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.post('/api/v1/restaurants/check-in', {
                restaurantId,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error checking in restaurant:', error);
            throw error;
        }
    }

    async addFavoriteRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.post('/api/v1/restaurants/favorite', {
                restaurantId,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error adding favorite restaurant:', error);
            throw error;
        }
    }

    async removeFavoriteRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.delete('/api/v1/restaurants/favorite', {
                restaurantId,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error removing favorite restaurant:', error);
            throw error;
        }
    }

    async getFavoriteRestaurants(accessToken: string) {
        try {
            const response = await request.get('/api/v1/restaurants/favorites', {
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error fetching favorite restaurants:', error);
            throw error;
        }
    }

    async getRestaurantReviews(restaurantId: number, page = 1, limit = 10) {
        try {
            const response = await request.get(`/api/v1/restaurants/${restaurantId}/reviews`, {
                page,
                limit
            });
            return response;
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw error;
        }
    }

    async addRestaurantReview(reviewData: any, accessToken: string) {
        try {
            const response = await request.post('/api/v1/restaurants/reviews', {
                ...reviewData,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error adding restaurant review:', error);
            throw error;
        }
    }

    async updateRestaurantReview(reviewId: number, reviewData: any, accessToken: string) {
        try {
            const response = await request.put(`/api/v1/restaurants/reviews/${reviewId}`, {
                ...reviewData,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error updating restaurant review:', error);
            throw error;
        }
    }

    async deleteRestaurantReview(reviewId: number, accessToken: string) {
        try {
            const response = await request.delete(`/api/v1/restaurants/reviews/${reviewId}`, {
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error deleting restaurant review:', error);
            throw error;
        }
    }

    async getRestaurantStats(restaurantId: number) {
        try {
            const response = await request.get(`/api/v1/restaurants/${restaurantId}/stats`);
            return response;
        } catch (error) {
            console.error('Error fetching restaurant stats:', error);
            throw error;
        }
    }

    async searchRestaurants(query: string, filters: any = {}) {
        try {
            const response = await request.get('/api/v1/restaurants/search', {
                query,
                ...filters
            });
            return response;
        } catch (error) {
            console.error('Error searching restaurants:', error);
            throw error;
        }
    }

    async getRestaurantCategories() {
        try {
            const response = await request.get('/api/v1/restaurants/categories');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant categories:', error);
            throw error;
        }
    }

    async getRestaurantCuisines() {
        try {
            const response = await request.get('/api/v1/restaurants/cuisines');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant cuisines:', error);
            throw error;
        }
    }

    async getRestaurantPriceRanges() {
        try {
            const response = await request.get('/api/v1/restaurants/price-ranges');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant price ranges:', error);
            throw error;
        }
    }

    async getRestaurantBadges() {
        try {
            const response = await request.get('/api/v1/restaurants/badges');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant badges:', error);
            throw error;
        }
    }

    async getRestaurantRecognition() {
        try {
            const response = await request.get('/api/v1/restaurants/recognition');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant recognition:', error);
            throw error;
        }
    }

    async getRestaurantSortOptions() {
        try {
            const response = await request.get('/api/v1/restaurants/sort-options');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant sort options:', error);
            throw error;
        }
    }

    async getRestaurantFilters() {
        try {
            const response = await request.get('/api/v1/restaurants/filters');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant filters:', error);
            throw error;
        }
    }

    async getRestaurantSuggestions(userId: number, accessToken: string) {
        try {
            const response = await request.get('/api/v1/restaurants/suggestions', {
                userId,
                accessToken
            });
            return response;
        } catch (error) {
            console.error('Error fetching restaurant suggestions:', error);
            throw error;
        }
    }

    async getRestaurantTrending(limit = 10) {
        try {
            const response = await request.get('/api/v1/restaurants/trending', {
                limit
            });
            return response;
        } catch (error) {
            console.error('Error fetching trending restaurants:', error);
            throw error;
        }
    }

    async getRestaurantNearby(latitude: number, longitude: number, radius = 10) {
        try {
            const response = await request.get('/api/v1/restaurants/nearby', {
                latitude,
                longitude,
                radius
            });
            return response;
        } catch (error) {
            console.error('Error fetching nearby restaurants:', error);
            throw error;
        }
    }

    async getRestaurantRecommendations(userId: number, accessToken: string, limit = 10) {
        try {
            const response = await request.get('/api/v1/restaurants/recommendations', {
                userId,
                accessToken,
                limit
            });
            return response;
        } catch (error) {
            console.error('Error fetching restaurant recommendations:', error);
            throw error;
        }
    }

    async getFavoriteListing(userId: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.GET(`/wp-json/wp/v2/api/favorite-listings/${userId}`, {
                headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching favorite listings:', error);
            throw error;
        }
    }
}