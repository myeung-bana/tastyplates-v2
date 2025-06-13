// repositories/restaurant/restaurantRepository.ts
import { gql } from "@apollo/client";
import client from "@/app/graphql/client";
import {
    GET_LISTINGS,
    GET_RESTAURANT_BY_SLUG,
    GET_RESTAURANT_BY_ID,
} from "@/app/graphql/Restaurant/restaurantQueries";

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

    static async getAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        taxQuery: any = {},
        priceRange?: string | null,
        status: string | null = null,
        recognition: string | null = null,
        sortOption?: string | null,
        rating: number | null = null
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
                recognition,
                recognitionSort: sortOption,
                minAverageRating: rating,
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
        accessToken?: string
    ) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_ID,
            variables: { id, idType },
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
}
