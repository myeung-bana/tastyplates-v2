import { CategoryRepo } from "@/repositories/interface/user/category";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class CategoryRepository implements CategoryRepo {
    async getCategories() {
        try {
            const response = await request.GET('/api/v1/categories/get-all-categories', {});
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [] as unknown as Record<string, unknown>;
        }
    }
};
