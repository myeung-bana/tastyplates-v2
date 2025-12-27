import { PalateRepo } from "@/repositories/interface/user/palate";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class PalatesRepository implements PalateRepo {
    async getPalates() {
        try {
            const response = await request.GET('/api/v1/palates/get-all-palates', {});
            return response as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching palates:', error);
            return [] as unknown as Record<string, unknown>;
        }
    }
};
