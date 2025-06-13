import { gql } from "@apollo/client";


export const GET_ALL_PALATES = gql`
    query GetAllPalates {
        palates(first: 100) {
            nodes {
            slug
            name
            databaseId
                children(first: 15) {
                    nodes {
                        slug
                        databaseId
                        name
                    }
                }
            }
        }
    }
`;