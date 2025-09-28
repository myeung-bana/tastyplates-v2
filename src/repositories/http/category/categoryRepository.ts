import client from "@/app/graphql/client";
import { GET_ALL_CATEGORIES } from "@/app/graphql/Category/categoryQueries";
import { CategoryRepo } from "@/repositories/interface/user/category";


export class CategoryRepository implements CategoryRepo {
    async getCategories() {
        const { data } = await client.query<{
            listingCategories: {
                nodes: Array<{
                    id: string;
                    name: string;
                    slug: string;
                }>;
            };
        }>({
            query: GET_ALL_CATEGORIES
        });

        // Optional: format the response with proper null checking
        return (data?.listingCategories?.nodes ?? []) as unknown as Record<string, unknown>;
    }
};
