import client from "@/app/graphql/client";
import { GET_ALL_CATEGORIES } from "@/app/graphql/Category/categoryQueries";


export const CategoryRepository = {
    async getCategories() {
        const { data } = await client.query({
            query: GET_ALL_CATEGORIES
        });

        // Optional: format the response
        return data.listingCategories.nodes;
    }
};
