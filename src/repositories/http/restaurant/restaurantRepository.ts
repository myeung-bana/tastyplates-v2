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
        orderBy?: any[]
    ) {
        const variables = {
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
            palates: palates || "",
            orderBy: orderBy || null,
        };

        console.log('🔍 GraphQL query variables:', variables);

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

    async createListingAndReview(payload: Record<string, unknown>, token: string): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const res = await request.POST('/wp-json/custom/v1/listing', { body: JSON.stringify(payload), headers: headers });
        
        // Check if the response indicates an error
        if (res.error || Number(res.status) >= 400) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            throw new Error((res as any).error || "Failed to submit listing and review");
        }

        return res;
    }


    async getFavoriteListing(
        userId: number,
        accessToken?: string
    ): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        };

        return request.GET(`/wp-json/restaurant/v1/favorites/?user_id=${userId}`,
            {
                headers: headers,
                credentials: "include",
            }
        );
    }

    async updateListing(
        id: number,
        listingUpdateData: Record<string, unknown>, // Changed to accept a plain object
        accessToken?: string
    ): Promise<Record<string, unknown>> {
        try {
            const response = await request.PUT(`/wp-json/custom/v1/listing/${id}`, {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
                body: JSON.stringify(listingUpdateData),
            });

            // Check if the response indicates an error
            if (response.error || Number(response.status) >= 400) {
                console.error('Backend error during update:', response);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error((response as any).message || "Failed to update restaurant listing");
            }
            return response;

        } catch (error) {
            console.error('Error updating restaurant listing in repository:', error);
            throw new Error('Failed to update restaurant listing');
        }
    }

    async deleteListing(id: number, accessToken?: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.DELETE(`/wp-json/custom/v1/listing/${id}`, {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            });

            // Check if the response indicates an error
            if (response.error || Number(response.status) >= 400) {
                console.error('Backend error during delete:', response);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error((response as any).message || "Failed to delete restaurant listing");
            }

            // If response is ok, return the response or a success object
            if (response && Object.keys(response).length > 0) {
                return response;
            } else {
                // If the response is empty, assume success without JSON content
                return { success: true, deleted: id }; // Return a custom success object
            }

        } catch (error) {
            console.error('Error deleting restaurant listing in repository:', error);
            throw new Error('Failed to delete restaurant listing');
        }
    }

    async getlistingDrafts(token: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.GET('/wp-json/wp/v2/listings?status=pending', {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            return response;
        } catch (error) {
            console.error("Failed to fetch listing pending", error);
            throw new Error('Failed to fetch listing pending');
        }
    }

    async createFavoriteListing(data: FavoriteListingData, accessToken?: string): Promise<Record<string, unknown>> {
        const response = await request.POST('/wp-json/restaurant/v1/favorite/', {
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
            credentials: "include",
        });

        return response;
    }

    async getCheckInRestaurant(userId: number, accessToken?: string): Promise<Record<string, unknown>> {
        const response = await request.GET(`/wp-json/restaurant/v1/checkins/?user_id=${userId}`, {
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            credentials: "include",
        });

        return response;
    }

    async createCheckIn(data: CheckInData, accessToken?: string): Promise<Record<string, unknown>> {
        const response = await request.POST('/wp-json/restaurant/v1/checkin/', {
            headers: {
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
            credentials: "include",
        });

        return response;
    }

    async getRestaurantRatingsCount(restaurantId: number): Promise<number> {
        try {
            const data = await request.GET(`/wp-json/restaurant/v1/reviews/?restaurantId=${restaurantId}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (data && Array.isArray((data as any).reviews)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (data as any).reviews.length;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching restaurant ratings count:', error);
            return 0;
        }
    }

    async addRecentlyVisitedRestaurant(postId: number, accessToken?: string) {
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

    async getRecentlyVisitedRestaurants(accessToken?: string,) {
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
