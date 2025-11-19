import { gql } from "@apollo/client";

/**
 * CREATE USER MUTATION
 * Creates a new user account
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('createUser', ...)
 */
export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
        databaseId
        name
        email
        username
        nicename
      }
      userId
      token
      success
      message
    }
  }
`;

/**
 * UPDATE USER MUTATION
 * Updates user profile information
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('updateUser', ...)
 */
export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        id
        databaseId
        name
        email
        username
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
      success
      message
    }
  }
`;

/**
 * UPDATE USER PROFILE MUTATION
 * Updates specific user profile fields (image, about me, palates)
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('updateUserProfile', ...)
 */
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      user {
        id
        databaseId
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
      success
      message
    }
  }
`;

/**
 * UPDATE USER PASSWORD MUTATION
 * Updates user password
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('updateUserPassword', ...)
 */
export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword($input: UpdateUserPasswordInput!) {
    updateUserPassword(input: $input) {
      success
      message
    }
  }
`;

/**
 * DELETE USER MUTATION
 * Deletes a user account
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('deleteUser', ...)
 * 
 * WARNING: This is a destructive operation. Use with caution.
 */
export const DELETE_USER = gql`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
      success
      message
      deletedUserId
    }
  }
`;

/**
 * REGISTER USER WITH GOOGLE OAUTH MUTATION
 * Creates a new user account via Google OAuth
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('registerUserWithGoogle', ...)
 */
export const REGISTER_USER_WITH_GOOGLE = gql`
  mutation RegisterUserWithGoogle($input: RegisterGoogleUserInput!) {
    registerUserWithGoogle(input: $input) {
      user {
        id
        databaseId
        name
        email
        username
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
      userId
      token
      success
      message
    }
  }
`;

/**
 * UPDATE USER META MUTATION
 * Updates WordPress user meta fields (custom fields)
 * 
 * Note: This mutation requires backend implementation in WordPress
 * Expected backend: register_graphql_mutation('updateUserMeta', ...)
 */
export const UPDATE_USER_META = gql`
  mutation UpdateUserMeta($input: UpdateUserMetaInput!) {
    updateUserMeta(input: $input) {
      success
      message
      meta {
        key
        value
      }
    }
  }
`;

