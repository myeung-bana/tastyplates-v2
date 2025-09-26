import { gql } from "@apollo/client";

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      name
      display_name
      nicename
      userProfile {
        palates
        aboutMe
        profileImage {
          node {
            mediaItemUrl
          }
        }
      }
    }
  }
`;