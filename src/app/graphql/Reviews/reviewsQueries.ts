import { gql } from "@apollo/client";

export const GET_ALL_RECENT_REVIEWS = gql`
  query GetReviews($first: Int = 16, $after: String) {
    comments(
      where: { commentType: "listing", orderby: COMMENT_DATE, order: DESC, commentApproved: 1 }
      first: $first
      after: $after
    ) {
      nodes {
        databaseId
        id
        uri
        reviewMainTitle
        commentLikes
        userLiked
        reviewStars
        date
        content(format: RENDERED)
        reviewImages {
          databaseId
          id
          sourceUrl
        }
        palates
        userAvatar
        userId
        author {
          name
            node {
              ... on User {
              id
              databaseId
              name
              nicename
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
    id
    databaseId
    author {
      node {
        id
        databaseId
        name
          ... on User {
            nicename
          }
        avatar {
          url
        }
      }
    }
    replies {
      nodes {
        id
        databaseId
        content(format: RENDERED)
        commentLikes
        userLiked
        palates
        userAvatar
        author {
          node {
            id
            databaseId
            name
            ... on User {
              nicename
            }
            avatar {
              url
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
    userCommentCount(userId: $userId)
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
        palates
        userAvatar
        author {
          name
            node {
              ... on User {
              id
              databaseId
              name  
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

export const GET_REVIEWS_BY_RESTAURANT_ID = gql`
  query GetReviewsByRestaurantId($restaurantId: ID!) {
    reviews(where: { restaurant: $restaurantId }) {
      nodes {
        id
        rating
        date
        title
        comment
        likes
        reviewMainTitle
        reviewStars
        author {
          node {
            id
            name
            image
            palates {
              nodes {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_RESTAURANT_REVIEWS = gql`
query GetRestaurantComments($restaurantId: ID!, $first: Int!, $after: String) {
comments(
    where: {
    commentType: "listing", 
    orderby: COMMENT_DATE, 
    order: DESC, 
    contentId: $restaurantId,
    commentApproved: 1
    }
    first: $first
    after: $after
  ) {
    nodes {
        id
        databaseId
        uri
        reviewMainTitle
        commentLikes
        userLiked
        reviewStars
        date
        content(format: RENDERED)
        palates
        userAvatar
        recognitions
        userId
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