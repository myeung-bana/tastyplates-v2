import { gql } from '@apollo/client';

export const GET_LISTINGS = gql`
    query GetAllRestaurants($searchTerm: String!, $first: Int, $after: String) {
        listings(where: { search: $searchTerm }, first: $first, after: $after) {
            pageInfo {
                endCursor
                hasNextPage
            }
            nodes {
                id
                title
                slug
                content
                listingStreet
                palates
                featuredImage {
                    node {
                        sourceUrl
                    }
                }
                listingCategories {
                    nodes {
                        id
                        name
                    }
                }
                countries {
                    nodes {
                        name
                    }
                }
            }
        }
    }
`;

export const GET_RESTAURANT_BY_SLUG = gql`
    query GetRestaurantBySlug($slug: ID!) {
        listing(id: $slug, idType: URI) {
        id
        title
        slug
        content
        palates
        listingStreet
                listingDetails {
                    phone
                    openingHours
                    menuUrl
                    longitude
                    latitude
                    googleMapUrl {
                        latitude
                        longitude
                        streetAddress
                    }
                }
            featuredImage {
                node {
                    sourceUrl
                }
            }
        listingCategories {
            nodes {
                name
            }
        }
        countries {
                nodes {
                    name
                }
            }
        }
    }`
    ;
