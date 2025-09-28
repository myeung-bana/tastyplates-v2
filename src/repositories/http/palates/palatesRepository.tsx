import client from "@/app/graphql/client";
import { GET_ALL_PALATES } from "@/app/graphql/Palates/palatesQueries";
import { PalateRepo } from "@/repositories/interface/user/palate";


export class PalatesRepository implements PalateRepo {
    async getPalates() {
        const { data } = await client.query<{
            palates: {
                nodes: Array<{
                    id: string;
                    name: string;
                    slug: string;
                }>;
            };
        }>({
            query: GET_ALL_PALATES
        });

        return (data?.palates?.nodes ?? []) as unknown as Record<string, unknown>;
    }
};
