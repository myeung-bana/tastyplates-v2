import client from "@/app/graphql/client";
import { GET_ALL_CATEGORIES } from "@/app/graphql/Category/categoryQueries";
import { CategoryRepo } from "@/repositories/interface/user/category";


export class CategoryRepository implements CategoryRepo {
    async getCategories() {
        const { data } = await client.query({
            query: GET_ALL_CATEGORIES
        });

        // Optional: format the response
        return data.listingCategories.nodes;
    }
};
