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
    $statuses: [PostStatusEnum]
    $streetAddress: String
    $ethnicSearch: String
    $palates: String
    $orderBy: [PostObjectsConnectionOrderbyInput]
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
            statusIn: $statuses
            streetAddress: $streetAddress
            palateReviewedBy: $ethnicSearch
            orderby: $orderBy
        }, 
        first: $first
        after: $after
    ) {
        pageInfo {
            endCursor
            hasNextPage
        }
        nodes {
            status
            id
            databaseId
            title
            slug
            status
            date
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
            searchPalateStats(palates: $palates) {
                avg
                count
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
                    streetNumber
                    streetName
                    city
                    state
                    stateShort
                    country
                    countryShort
                    postCode
                    latitude
                    longitude
                    placeId
                    zoom
                }
            }
            isFavorite
            ratingsCount
        }
    }
}
`;

export const GET_RESTAURANT_BY_SLUG = gql`
    query GetRestaurantBySlug($slug: ID!, $palates: String) {
        listing(id: $slug, idType: URI) {
        id
        title
        slug
        content
        priceRange
        averageRating
        ratingsCount
        recognitionCounts {
            bestService
            instaWorthy
            mustRevisit
            valueForMoney
        }
        palateStats {
            name
            avg
            count
        }
        searchPalateStats(palates: $palates) {
            avg
            count
        }
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
                        streetAddress
                        streetNumber
                        streetName
                        city
                        state
                        stateShort
                        country
                        countryShort
                        postCode
                        latitude
                        longitude
                        placeId
                        zoom
                    }
                }
            featuredImage {
                node {
                    sourceUrl
                }
            }
        imageGallery
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
        slug
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
                        streetAddress
                        streetNumber
                        streetName
                        city
                        state
                        stateShort
                        country
                        countryShort
                        postCode
                        latitude
                        longitude
                        placeId
                        zoom
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

export const ADD_RECENTLY_VISITED_RESTAURANT = gql`
  mutation AddRecentlyVisited($postId: Int!) {
    addRecentlyVisited(postId: $postId)
  }
`;

export const GET_RECENTLY_VISITED_RESTAURANTS = gql`
    query {
        currentUser {
        id
        recentlyVisited
        }
    }
`;

export const GET_LISTINGS_NAME = gql`
    query GetListingsName (
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
                title
                slug    
            }
        }
    }`;
