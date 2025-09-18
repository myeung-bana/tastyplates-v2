export interface CategoryRepo {
    getCategories(): Promise<Record<string, unknown>>;
}