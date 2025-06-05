import { gql } from "@apollo/client";


export const GET_ALL_PALATES = gql`
    query GetAllPalates {
        palates {
            nodes {
                databaseId
                name
            }
        }
    }
`;