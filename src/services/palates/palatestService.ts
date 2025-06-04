import { CategoryRepository } from "@/repositories/category/categoryRepository";

export const CategoryService = {
    async fetchPalates() {
        try {
            return await CategoryRepository.getCategories();
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories');
        }
    }
};
