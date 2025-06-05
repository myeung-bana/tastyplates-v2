import { PalatesRepository } from "@/repositories/palates/palatesRepository";

export const PalatesService = {
    async fetchPalates() {
        try {
            return await PalatesRepository.getPalates();
        } catch (error) {
            console.error('Error fetching Palates:', error);
            throw new Error('Failed to fetch Palates');
        }
    }
};
