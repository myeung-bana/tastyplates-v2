import { gql } from "@apollo/client";


export const GET_ALL_PALATES = gql`
    query GetAllPalates {
        palates(first: 100) {
            nodes {
            name
            databaseId
                children {
                    nodes {
                        databaseId
                        name
                    }
                }
            }
        }
    }
`;