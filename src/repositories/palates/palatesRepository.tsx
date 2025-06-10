import client from "@/app/graphql/client";
import { GET_ALL_PALATES } from "@/app/graphql/Palates/palatesQueries";


export const PalatesRepository = {
    async getPalates() {
        const { data } = await client.query({
            query: GET_ALL_PALATES
        });
        console.log("Palates data:", data);
        return data.palates.nodes;
    }
};
