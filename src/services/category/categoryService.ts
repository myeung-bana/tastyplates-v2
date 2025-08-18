import { CategoryRepository } from "@/repositories/http/category/categoryRepository";
import { CategoryRepo } from "@/repositories/interface/user/category";

const categoryRepo: CategoryRepo = new CategoryRepository()

export class CategoryService {
    async fetchCategories() {
        try {
            return await categoryRepo.getCategories();
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories');
        }
    }
};
