import { gql } from '@apollo/client';

// With taxQuery
export const GET_ADDRESS_BY_PALATE_WITH_TAX = gql`
    query GetAddressByPalateWithTax(
        $searchTerm: String!, 
        $taxQuery: TaxQuery,
        $first: Int,
        $after: String
    ) {
        listings(
            where: {
                search: $searchTerm
                taxQuery: $taxQuery
            }
            first: $first
            after: $after
        ) {
            pageInfo {
                endCursor
                hasNextPage
            }
            nodes {
                id
                databaseId
                listingDetails {
                    googleMapUrl {
                        streetAddress
                        city
                        state
                        country
                    }
                }
            }
        }
    }`;

// Without taxQuery
export const GET_ADDRESS_BY_PALATE_NO_TAX = gql`
    query GetAddressByPalateNoTax(
        $searchTerm: String!,
        $first: Int,
        $after: String
    ) {
        listings(
            where: {
                search: $searchTerm
            }
            first: $first
            after: $after
        ) {
            pageInfo {
                endCursor
                hasNextPage
            }
            nodes {
                id
                databaseId
                listingDetails {
                    googleMapUrl {
                        streetAddress
                        city
                        state
                        country
                    }
                }
            }
        }
    }`;
