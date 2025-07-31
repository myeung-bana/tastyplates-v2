// repositories/restaurant/restaurantRepository.ts
import { gql } from "@apollo/client";
import client from "@/app/graphql/client";
import {
    GET_LISTINGS,
    GET_RESTAURANT_BY_SLUG,
    GET_RESTAURANT_BY_ID,
    ADD_RECENTLY_VISITED_RESTAURANT,
    GET_RECENTLY_VISITED_RESTAURANTS,
    GET_LISTINGS_NAME,
} from "@/app/graphql/Restaurant/restaurantQueries";
import { user } from "@heroui/theme";
import { GET_ADDRESS_BY_PALATE_NO_TAX, GET_ADDRESS_BY_PALATE_WITH_TAX } from "@/app/graphql/Restaurant/addressQueries";
import { CheckInData, FavoriteListingData } from "@/interfaces/restaurant/restaurant";

const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

export class RestaurantRepository {
    private static async request(endpoint: string, options: RequestInit, jsonResponse = false): Promise<any> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (jsonResponse) {
            return response.json();
        }

        return response;
    }

    static async getRestaurantBySlug(slug: string, palates: string) {
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

    static async getAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        taxQuery: any = {},
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
        const { data } = await client.query({
            query: GET_LISTINGS,
            variables: {
                searchTerm,
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
                streetAddress: address || "",
                ethnicSearch: ethnicSearch || "",
            },
        });
        return {
            nodes: data.listings.nodes,
            pageInfo: data.listings.pageInfo,
        };
    }

    static async getRestaurantById(
        id: string,
        idType: string = "DATABASE_ID",
        accessToken?: string,
        userId?: number | null
    ) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_ID,
            variables: { id, idType, userId },
            context: {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            },
            fetchPolicy: "no-cache",
        });

        return data.listing;
    }

    static async createListing(formData: FormData, token: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/wp-json/custom/v1/listing`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to submit listing");
        }

        return res.json();
    }

    static async getFavoriteListing(
        userId: number,
        accessToken?: string
    ): Promise<any> {
        return this.request(
            `/wp-json/restaurant/v1/favorites/?user_id=${userId}`,
            {
                method: 'GET',
                headers: accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {},
                credentials: "include",
            },
            true
        );
    }

    static async updateListing(
        id: number,
        listingUpdateData: Record<string, any>, // Changed to accept a plain object
        accessToken?: string
    ): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/wp-json/custom/v1/listing/${id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
                body: JSON.stringify(listingUpdateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Backend error during update:', errorData);
                throw new Error(errorData.message || "Failed to update restaurant listing");
            }
            return await response.json();

        } catch (error) {
            console.error('Error updating restaurant listing in repository:', error);
            throw new Error('Failed to update restaurant listing');
        }
    }

    static async deleteListing(id: number, accessToken?: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/wp-json/custom/v1/listing/${id}`, {
                method: "DELETE",
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            });

            if (!response.ok) {
                // If response is not ok, still try to get text to see error details
                const errorText = await response.text();
                console.error('Raw server error response on delete (not ok):', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || "Failed to delete restaurant listing");
                } catch (jsonError) {
                    throw new Error(`Failed to delete restaurant listing: Server responded with non-JSON content or error. Response: ${errorText}`);
                }
            }

            // If response is ok, attempt to parse JSON, but catch if it's not JSON
            try {
                // Check if the response actually has content before trying to parse as JSON
                const text = await response.text();
                if (!text) {
                    // If the response is empty, assume success without JSON content
                    return { success: true, deleted: id }; // Return a custom success object
                }
                // Try parsing as JSON
                return JSON.parse(text);
            } catch (jsonParseError) {
                // If parsing fails, it means even a successful response contained non-JSON
                const rawResponseText = await response.text(); // Re-read if needed, or use the `text` from above
                console.error('Raw server response on delete (ok but not JSON):', rawResponseText);
                throw new Error(`Delete successful but server response was not valid JSON. Please check server logs for warnings/notices. Raw response: ${rawResponseText}`);
            }

        } catch (error) {
            console.error('Error deleting restaurant listing in repository:', error);
            throw new Error('Failed to delete restaurant listing');
        }
    }

    static async getlistingDrafts(token: string): Promise<any> {
        try {
            const response = await this.request('/wp-json/wp/v2/listings?status=pending', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            }, true);
            return response;
        } catch (error) {
            console.error("Failed to fetch listing pending", error);
            throw new Error('Failed to fetch listing pending');
        }
    }

    static async createFavoriteListing(data: FavoriteListingData, accessToken?: string, jsonResponse?: boolean): Promise<any> {
        const response = await this.request('/wp-json/restaurant/v1/favorite/', {
            method: 'POST',
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
            credentials: "include",
        }, jsonResponse);

        return response;
    }

    static async getCheckInRestaurant(userId: number, accessToken?: string, jsonResponse?: boolean): Promise<any> {
        const response = await this.request(`/wp-json/restaurant/v1/checkins/?user_id=${userId}`, {
            method: 'GET',
            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
            credentials: "include",
        }, jsonResponse);

        return response;
    }

    static async createCheckIn(data: CheckInData, accessToken?: string, jsonResponse?: boolean): Promise<any> {
        const response = await this.request('/wp-json/restaurant/v1/checkin/', {
            method: "POST",
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
            credentials: "include",
        }, jsonResponse);
        
        return response;
    }

    static async getRestaurantRatingsCount(restaurantId: number): Promise<number> {
        try {
            const res = await fetch(`${API_BASE_URL}/wp-json/restaurant/v1/reviews/?restaurantId=${restaurantId}`);
            const data = await res.json();
            if (data && Array.isArray(data.reviews)) {
                return data.reviews.length;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching restaurant ratings count:', error);
            return 0;
        }
    }

    static async addRecentlyVisitedRestaurant(postId: number, accessToken?: string) {
        try {
            const { data } = await client.mutate({
                mutation: ADD_RECENTLY_VISITED_RESTAURANT,
                variables: { postId },
                context: {
                    headers: {
                        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                    },
                },
            });

            return data?.addRecentlyVisited ?? false;
        } catch (error) {
            console.error("Failed to add recently visited restaurant:", error);
            return false;
        }
    }

    static async getRecentlyVisitedRestaurants(accessToken?: string,) {
        const { data } = await client.query({
            query: GET_RECENTLY_VISITED_RESTAURANTS,
            context: {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            },
            fetchPolicy: "no-cache",
        });

        // Return the array of IDs or an empty array if undefined
        return data?.currentUser?.recentlyVisited || [];
    }
    
    static async getAddressByPalate(
        searchTerm: string,
        taxQuery: any,
        first = 32,
        after: string | null = null,
    ) {
        const hasTaxQuery = taxQuery && Object.keys(taxQuery).length > 0;
        let variables: any = { searchTerm, first, after };

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

    static async getListingsName(
        searchTerm: string,
        first = 32,
        after: string | null = null,
    ) {
        const { data } = await client.query({
            query: GET_LISTINGS_NAME,
            variables: {
                searchTerm,
                first,
                after,
            },
            fetchPolicy: 'network-only',
        });
        return {
            nodes: data.listings.nodes,
            pageInfo: data.listings.pageInfo,
            hasNextPage: data.listings.pageInfo.hasNextPage,
            endCursor: data.listings.pageInfo.endCursor,
        };
    }
}
