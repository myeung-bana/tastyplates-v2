import { gql } from '@apollo/client';

export const GET_LISTINGS = gql`
  query GetAllRestaurants(
    $searchTerm: String!
    $priceRange: String
    $first: Int
    $after: String
    $taxQuery: TaxQuery
    $status: PostStatusEnum
    $userId: Int
    $recognition: String
    $recognitionSort: String 
    $minAverageRating: Float
  ) {
    listings(
        where: {
            search: $searchTerm 
            priceRange: $priceRange
            taxQuery: $taxQuery
            status: $status
            recognition: $recognition
            recognitionSort: $recognitionSort
            minAverageRating: $minAverageRating
            author: $userId
        }, 
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
            title
            slug
            content
            priceRange
            averageRating
            listingStreet
            palates {
                nodes {
                    name
                    slug 
                }
            }
            featuredImage {
                node {
                    sourceUrl
                }
            }
            listingCategories {
                nodes {
                    id
                    name
                    slug
                }
            }
            listingDetails {
                googleMapUrl {
                    streetAddress
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
        priceRange
        palates {
            nodes {
                name
            }
        }
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
        title
        content
        palates {
            nodes {
                name
                databaseId
            }
        }
        databaseId
        listingStreet
                listingDetails {
                    phone
                    openingHours
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
}
`;
