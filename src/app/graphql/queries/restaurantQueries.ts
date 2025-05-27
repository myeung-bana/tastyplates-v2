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
                address
                content
                fieldMultiCheck90
                listingStreet
                listingDetails {
                    phone
                    openingHours
                    menuUrl
                    longitude
                    latitude
                    googleMapUrl
                }
                featuredImage {
                    node {
                        sourceUrl
                    }
                }
                cuisines {
                    nodes {
                        id
                        name
                    }
                }
                locations {
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
        address
        content
        fieldMultiCheck90
        listingStreet
                listingDetails {
                    phone
                    openingHours
                    menuUrl
                    longitude
                    latitude
                    googleMapUrl
                }
            featuredImage {
                node {
                    sourceUrl
                }
            }
        cuisines {
            nodes {
                name
            }
        }
        comments {
            nodes {
                content
                listingCommentReview {
                    rate
                    recommendations
                }
            }
        }
        locations {
                nodes {
                    name
                }
            }
        }
    }`
;
