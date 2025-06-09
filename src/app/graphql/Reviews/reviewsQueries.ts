import { gql } from "@apollo/client";

export const GET_ALL_RECENT_REVIEWS = gql`
  query GetReviews($first: Int = 16, $after: String) {
    comments(
      where: { commentType: "listing", orderby: COMMENT_DATE, order: DESC }
      first: $first
      after: $after
    ) {
      nodes {
        databaseId
        id
        uri
        reviewMainTitle
        commentLikes
        reviewStars
        date
        content(format: RENDERED)
        reviewImages {
          databaseId
          id
          sourceUrl
        }
        author {
          name
            node {
              ... on User {
              id
              databaseId
        		  name
              palates
              avatar {
            	  url
          	  }  
            }
          }
        }
        commentedOn {
          node {
            ... on Listing {
              databaseId
              title
              slug
              featuredImage {
                node {
                  databaseId
                  altText
                  mediaItemUrl
                  mimeType
                  mediaType
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_COMMENT_REPLIES = gql`
query GetCommentWithReplies($id: ID!) {
  comment(id: $id) {
    replies {
      nodes {
        content(format: RENDERED)
        author {
          node {
            id
            databaseId
            name
            avatar {
              url
            }
            ... on User {
              palates
            }
          }
        }
      }
    }
  }
}
`;

export const GET_USER_REVIEWS = gql`
  query GetUserReviews($userId: ID!, $first: Int = 16, $after: String) {
    comments(
      where: { 
        commentType: "listing",
        userId: $userId,
        orderby: COMMENT_DATE,
        order: DESC 
      }
      first: $first
      after: $after
    ) {
      nodes {
        databaseId
        id
        uri
        reviewMainTitle
        reviewStars
        date
        content(format: RENDERED)
        reviewImages {
          databaseId
          id
          sourceUrl
        }
        author {
          name
            node {
              ... on User {
              id
              databaseId
              name
              palates
              avatar {
                url
              }  
            }
          }
        }
        commentedOn {
          node {
            ... on Listing {
              databaseId
              title
              slug
              fieldMultiCheck90
              featuredImage {
                node {
                  databaseId
                  altText
                  mediaItemUrl
                  mimeType
                  mediaType
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
