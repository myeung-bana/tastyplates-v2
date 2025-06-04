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
                databaseId
                title
                slug
                content
                listingStreet
                cuisines
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
        cuisines
        databaseId
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

export const GET_RESTAURANT_BY_ID = gql`
  query GetRestaurantByDatabaseId($id: ID!, $idType: ListingIdType!) {
  listing(id: $id, idType: $idType) {
    id
    databaseId
    title
  }
}
`;
