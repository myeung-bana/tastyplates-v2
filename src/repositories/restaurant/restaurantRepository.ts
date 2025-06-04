import { gql } from "@apollo/client";
import client from "@/app/graphql/client";
import { GET_LISTINGS, GET_RESTAURANT_BY_SLUG, GET_RESTAURANT_BY_ID } from "@/app/graphql/queries/restaurantQueries";

export const RestaurantRepository = {
    async getRestaurantBySlug(slug: string) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_SLUG,
            variables: { slug },
        });

        return data.listing;
    },


    async getAllRestaurants(searchTerm: string, first = 8, after: string | null = null) {
        const { data } = await client.query({
            query: GET_LISTINGS,
            variables: { searchTerm, first, after },
        });

        return {
            nodes: data.listings.nodes,
            pageInfo: data.listings.pageInfo,
        };
    },

    async getRestaurantById(id: string, idType: string = "DATABASE_ID", accessToken?: string) {
        const { data } = await client.query({
            query: GET_RESTAURANT_BY_ID,
            variables: { id, idType },
            context: {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            },
            fetchPolicy: "no-cache", // optional: avoids stale cache
        });

        return data.listing;
    },

};
