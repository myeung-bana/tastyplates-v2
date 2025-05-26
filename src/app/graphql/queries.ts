import { gql } from '@apollo/client';

export const GET_POSTS = gql`
    query GetPosts {
        posts {
            nodes {
                authorId
                content
            }
        }
    }
`;

export const GET_LISTINGS = gql`
query GetListings {
        listings {
        nodes {
            id
            title
            slug
            address
            content
            fieldMultiCheck90
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

export const GET_ALL_CUISINES = gql`
    query GetListings {
        cuisines {
            nodes {
                id
                name
            }
        }
    }`;

export const GET_RESTAURANT_BY_SLUG = gql`
    query GetRestaurantBySlug($slug: ID!) {
        listing(id: $slug, idType: URI) {
        id
        title
        slug
        address
        content
        fieldMultiCheck90
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
    }`;

export const GET_POST_BY_SLUG = gql`
    query PostBySlug($slug: ID!) {
        post(id: $slug, idType: SLUG) {
            title
            content
        }
    }   
`;

export const GetPages = gql`
query AllPages {
    pages {
        nodes {
            id
            title
            slug
            content
        }
    }
}
`;
