import { gql } from '@apollo/client';

// With taxQuery
export const GET_ADDRESS_BY_PALATE_WITH_TAX = gql`
    query GetAddressByPalateWithTax($searchTerm: String!, $taxQuery: TaxQuery) {
        listings(
        where: {
            search: $searchTerm
            taxQuery: $taxQuery
        }
        first: 16
        after: null
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
    query GetAddressByPalateNoTax($searchTerm: String!) {
        listings(
        where: {
            search: $searchTerm
        }
        first: 16
        after: null
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
