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
import { RestaurantRepo } from "@/repositories/interface/user/restaurant";
import { FavoriteListingData, CheckInData } from "@/interfaces/restaurant/restaurant";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class RestaurantRepository implements RestaurantRepo {
    async getRestaurantBySlug(slug: string, palates: string) {
        const { data } = await client.query<{
            listing: {
                id: string;
                title: string;
                slug: string;
                content: string;
                databaseId: number;
                featuredImage?: {
                    node: {
                        sourceUrl: string;
                    };
                };
                listingDetails: {
                    latitude: string;
                    longitude: string;
                    phone: string;
                    openingHours: string;
                    menuUrl: string;
                };
                palates: {
                    nodes: Array<{
                        name: string;
                        slug: string;
                    }>;
                };
                listingCategories: {
                    nodes: Array<{
                        name: string;
                        slug: string;
                    }>;
                };
            };
        }>({
            query: GET_RESTAURANT_BY_SLUG,
            fetchPolicy: "no-cache",
            variables: {
                slug,
                palates
            },
        });
        return (data?.listing ?? null) as unknown as Record<string, unknown>;
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

        const { data } = await client.query<{
            listings: {
                nodes: Array<{
                    id: string;
                    title: string;
                    slug: string;
                    content: string;
                    databaseId: number;
                    featuredImage?: {
                        node: {
                            sourceUrl: string;
                        };
                    };
                    listingDetails: {
                        latitude: string;
                        longitude: string;
                        phone: string;
                        openingHours: string;
                        menuUrl: string;
                    };
                    palates: {
                        nodes: Array<{
                            name: string;
                            slug: string;
                        }>;
                    };
                    listingCategories: {
                        nodes: Array<{
                            name: string;
                            slug: string;
                        }>;
                    };
                }>;
                pageInfo: {
                    endCursor: string;
                    hasNextPage: boolean;
                };
            };
        }>({
            query: GET_LISTINGS,
            variables,
        });
        return {
            nodes: data?.listings?.nodes ?? [],
            pageInfo: data?.listings?.pageInfo ?? { endCursor: null, hasNextPage: false },
        };
    }

    async getRestaurantById(
        id: string,
        idType: string = "DATABASE_ID",
        accessToken?: string,
        userId?: number | null
    ) {
        const { data } = await client.query<{
            listing: {
                id: string;
                title: string;
                slug: string;
                content: string;
                databaseId: number;
                featuredImage?: {
                    node: {
                        sourceUrl: string;
                    };
                };
                listingDetails: {
                    latitude: string;
                    longitude: string;
                    phone: string;
                    openingHours: string;
                    menuUrl: string;
                };
                palates: {
                    nodes: Array<{
                        name: string;
                        slug: string;
                    }>;
                };
                listingCategories: {
                    nodes: Array<{
                        name: string;
                        slug: string;
                    }>;
                };
            };
        }>({
            query: GET_RESTAURANT_BY_ID,
            variables: {
                id,
                idType,
                accessToken,
                userId
            },
        });
        return (data?.listing ?? null) as unknown as Record<string, unknown>;
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
            return !!data; // Return boolean as expected by interface
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            throw error;
        }
    }

    async getRecentlyVisitedRestaurants(accessToken?: string) {
        try {
            const { data } = await client.query<{
                recentlyVisitedRestaurants: Array<{
                    id: string;
                    title: string;
                    slug: string;
                    content: string;
                    databaseId: number;
                    featuredImage?: {
                        node: {
                            sourceUrl: string;
                        };
                    };
                    listingDetails: {
                        latitude: string;
                        longitude: string;
                        phone: string;
                        openingHours: string;
                        menuUrl: string;
                    };
                    palates: {
                        nodes: Array<{
                            name: string;
                            slug: string;
                        }>;
                    };
                    listingCategories: {
                        nodes: Array<{
                            name: string;
                            slug: string;
                        }>;
                    };
                }>;
            }>({
                query: GET_RECENTLY_VISITED_RESTAURANTS,
                variables: {
                    accessToken
                },
            });
            return data?.recentlyVisitedRestaurants || [];
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
                hasNextPage: data.listings.pageInfo.hasNextPage,
                endCursor: data.listings.pageInfo.endCursor,
            };
        } catch (error) {
            console.error('Error fetching listings name:', error);
            throw new Error('Failed to fetch listings name');
        }
    }

    async checkInRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.POST('/api/v1/restaurants/check-in', {
                body: JSON.stringify({ restaurantId }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error checking in restaurant:', error);
            throw error;
        }
    }

    async addFavoriteRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.POST('/api/v1/restaurants/favorite', {
                body: JSON.stringify({ restaurantId }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error adding favorite restaurant:', error);
            throw error;
        }
    }

    async removeFavoriteRestaurant(restaurantId: number, accessToken: string) {
        try {
            const response = await request.DELETE(`/api/v1/restaurants/favorite/${restaurantId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error removing favorite restaurant:', error);
            throw error;
        }
    }

    async getFavoriteRestaurants(accessToken: string) {
        try {
            const response = await request.GET('/api/v1/restaurants/favorites', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error fetching favorite restaurants:', error);
            throw error;
        }
    }

    async getRestaurantReviews(restaurantId: number, page = 1, limit = 10) {
        try {
            const response = await request.GET(`/api/v1/restaurants/${restaurantId}/reviews?page=${page}&limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error);
            throw error;
        }
    }

    async addRestaurantReview(reviewData: Record<string, unknown>, accessToken: string) {
        try {
            const response = await request.POST('/api/v1/restaurants/reviews', {
                body: JSON.stringify(reviewData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error adding restaurant review:', error);
            throw error;
        }
    }

    async updateRestaurantReview(reviewId: number, reviewData: Record<string, unknown>, accessToken: string) {
        try {
            const response = await request.PUT(`/api/v1/restaurants/reviews/${reviewId}`, {
                body: JSON.stringify(reviewData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error updating restaurant review:', error);
            throw error;
        }
    }

    async deleteRestaurantReview(reviewId: number, accessToken: string) {
        try {
            const response = await request.DELETE(`/api/v1/restaurants/reviews/${reviewId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error deleting restaurant review:', error);
            throw error;
        }
    }

    async getRestaurantStats(restaurantId: number) {
        try {
            const response = await request.GET(`/api/v1/restaurants/${restaurantId}/stats`);
            return response;
        } catch (error) {
            console.error('Error fetching restaurant stats:', error);
            throw error;
        }
    }

    async searchRestaurants(query: string, filters: Record<string, unknown> = {}) {
        try {
            const params = new URLSearchParams({ query, ...filters });
            const response = await request.GET(`/api/v1/restaurants/search?${params}`);
            return response;
        } catch (error) {
            console.error('Error searching restaurants:', error);
            throw error;
        }
    }

    async getRestaurantCategories() {
        try {
            const response = await request.GET('/api/v1/restaurants/categories');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant categories:', error);
            throw error;
        }
    }

    async getRestaurantCuisines() {
        try {
            const response = await request.GET('/api/v1/restaurants/cuisines');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant cuisines:', error);
            throw error;
        }
    }

    async getRestaurantPriceRanges() {
        try {
            const response = await request.GET('/api/v1/restaurants/price-ranges');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant price ranges:', error);
            throw error;
        }
    }

    async getRestaurantBadges() {
        try {
            const response = await request.GET('/api/v1/restaurants/badges');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant badges:', error);
            throw error;
        }
    }

    async getRestaurantRecognition() {
        try {
            const response = await request.GET('/api/v1/restaurants/recognition');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant recognition:', error);
            throw error;
        }
    }

    async getRestaurantSortOptions() {
        try {
            const response = await request.GET('/api/v1/restaurants/sort-options');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant sort options:', error);
            throw error;
        }
    }

    async getRestaurantFilters() {
        try {
            const response = await request.GET('/api/v1/restaurants/filters');
            return response;
        } catch (error) {
            console.error('Error fetching restaurant filters:', error);
            throw error;
        }
    }

    async getRestaurantSuggestions(userId: number, accessToken: string) {
        try {
            const response = await request.GET(`/api/v1/restaurants/suggestions?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response;
        } catch (error) {
            console.error('Error fetching restaurant suggestions:', error);
            throw error;
        }
    }

    async getRestaurantTrending(limit = 10) {
        try {
            const response = await request.GET(`/api/v1/restaurants/trending?limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Error fetching trending restaurants:', error);
            throw error;
        }
    }

    async getRestaurantNearby(latitude: number, longitude: number, radius = 10) {
        try {
            const response = await request.GET(`/api/v1/restaurants/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
            return response;
        } catch (error) {
            console.error('Error fetching nearby restaurants:', error);
            throw error;
        }
    }

    async getRestaurantRecommendations(userId: number, accessToken: string, limit = 10) {
        try {
            const response = await request.GET(`/api/v1/restaurants/recommendations?userId=${userId}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCheckInRestaurant(userId: number, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>> {
        try {
            const response = await request.GET(`/wp-json/wp/v2/api/check-in-restaurants/${userId}`, {
                headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching check-in restaurants:', error);
            throw error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createFavoriteListing(data: FavoriteListingData, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST('/wp-json/wp/v2/api/favorite-listings', {
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error creating favorite listing:', error);
            throw error;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createCheckIn(data: CheckInData, accessToken?: string, jsonResponse?: boolean): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST('/wp-json/wp/v2/api/check-ins', {
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error creating check-in:', error);
            throw error;
        }
    }

    async createRestaurantListingAndReview(data: Record<string, unknown>, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST('/wp-json/wp/v2/api/restaurant-listing-and-review', {
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error creating restaurant listing and review:', error);
            throw error;
        }
    }

    async deleteRestaurantListing(id: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.DELETE(`/wp-json/wp/v2/api/restaurant-listing/${id}`, {
                headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error deleting restaurant listing:', error);
            throw error;
        }
    }

    async createListingAndReview(payload: Record<string, unknown>, token: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST('/wp-json/wp/v2/api/listing-and-review', {
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error creating listing and review:', error);
            throw error;
        }
    }

    async updateListing(id: number, listingUpdateData: Record<string, unknown>, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.PUT(`/wp-json/wp/v2/api/listing/${id}`, {
                body: JSON.stringify(listingUpdateData),
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error updating listing:', error);
            throw error;
        }
    }

    async deleteListing(id: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.DELETE(`/wp-json/wp/v2/api/listing/${id}`, {
                headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error deleting listing:', error);
            throw error;
        }
    }

    async getlistingDrafts(token: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.GET('/wp-json/wp/v2/api/listing-drafts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching listing drafts:', error);
            throw error;
        }
    }

    async getRestaurantRatingsCount(restaurantId: number): Promise<number> {
        try {
            const response = await request.GET(`/wp-json/wp/v2/api/restaurant/${restaurantId}/ratings-count`) as { count: number };
            return response.count || 0;
        } catch (error) {
            console.error('Error fetching restaurant ratings count:', error);
            return 0;
        }
    }
}