import { gql } from "@apollo/client";
import client  from "@/app/graphql/client";
import {
    GET_LISTINGS,
    GET_RESTAURANT_BY_SLUG,
    GET_RESTAURANT_BY_ID,
} from "@/app/graphql/Restaurant/restaurantQueries";
import { user } from "@heroui/theme";

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

    static async getRestaurantBySlug(slug: string) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_SLUG,
            variables: { slug },
        });

        return data.listing;
    }

    static async getAllRestaurants(searchTerm: string, first = 8, after: string | null = null, status: string | null = null, userId?: number | null) {
        const { data } = await client.query({
            query: GET_LISTINGS,
            variables: { searchTerm, first, after, status, userId },
        });
        console.log("Fetched restaurants:", data);
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
            variables: { id, idType, userId},
            context: {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            },
            fetchPolicy: "no-cache",
        });

        console.log("Raw GraphQL response data in getRestaurantById:", data); // Add this line
        console.log("data.listing.nodes in getRestaurantById:", data.listing.nodes); // Add this line

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
    static async updateListing(
        id: string,
        formData: FormData,
        accessToken?: string
    ): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/wp-json/custom/v1/listing/${id}`, {
                method: "PUT", // Use POST for updates if the endpoint expects it (common in WP REST API)
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                    // 'Content-Type' is usually set automatically by the browser for FormData
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update restaurant listing");
            }
            return await response.json();

        } catch (error) {
            console.error('Error updating restaurant listing in repository:', error);
            throw new Error('Failed to update restaurant listing');
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
            console.log("Fetched listing pending:", response);
            return response;
        } catch (error) {
            console.error("Failed to fetch listing pending", error);
            throw new Error('Failed to fetch listing pending');
        }
    }
}
