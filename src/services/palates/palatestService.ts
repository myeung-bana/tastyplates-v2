import { PalatesRepository } from "@/repositories/http/palates/palatesRepository";
import { PalateRepo } from "@/repositories/interface/user/palate";

const palateRepo: PalateRepo = new PalatesRepository()

export class PalatesService {
    async fetchPalates() {
        try {
            return await palateRepo.getPalates();
        } catch (error) {
            console.error('Error fetching Palates:', error);
            throw new Error('Failed to fetch Palates');
        }
    }
};
