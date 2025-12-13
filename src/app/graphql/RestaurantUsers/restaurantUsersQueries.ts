// restaurantUsersQueries.ts - GraphQL queries for restaurant_users table

// GET ALL - List all users with pagination and filtering
export const GET_ALL_RESTAURANT_USERS = `
  query GetAllRestaurantUsers(
    $where: restaurant_users_bool_exp
    $order_by: [restaurant_users_order_by!]
    $limit: Int
    $offset: Int
  ) {
    restaurant_users(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      password_hash
      is_google_user
      google_auth
      google_token
      auth_method
      profile_image
      about_me
      birthdate
      gender
      custom_gender
      pronoun
      address
      zip_code
      latitude
      longitude
      palates
      language_preference
      onboarding_complete
      created_at
      updated_at
      deleted_at
    }
    restaurant_users_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY ID - Get single user by ID
// Note: followers/following relationships are not available in Hasura schema
export const GET_RESTAURANT_USER_BY_ID = `
  query GetRestaurantUserById($id: uuid!) {
    restaurant_users_by_pk(id: $id) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      password_hash
      is_google_user
      google_auth
      google_token
      auth_method
      profile_image
      about_me
      birthdate
      gender
      custom_gender
      pronoun
      address
      zip_code
      latitude
      longitude
      palates
      language_preference
      onboarding_complete
      created_at
      updated_at
      deleted_at
      # Note: followers/following relationships are not available in Hasura schema
    }
  }
`;

// GET BY FIREBASE UUID - Get user by Firebase UUID
export const GET_RESTAURANT_USER_BY_FIREBASE_UUID = `
  query GetRestaurantUserByFirebaseUuid($firebase_uuid: String!) {
    restaurant_users(where: { firebase_uuid: { _eq: $firebase_uuid }, deleted_at: { _is_null: true } }, limit: 1) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      password_hash
      is_google_user
      google_auth
      google_token
      auth_method
      profile_image
      about_me
      birthdate
      gender
      custom_gender
      pronoun
      address
      zip_code
      latitude
      longitude
      palates
      language_preference
      created_at
      updated_at
      deleted_at
    }
  }
`;

// CREATE - Create new user
export const CREATE_RESTAURANT_USER = `
  mutation CreateRestaurantUser($object: restaurant_users_insert_input!) {
    insert_restaurant_users_one(object: $object) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      is_google_user
      google_auth
      auth_method
      profile_image
      about_me
      language_preference
      palates
      onboarding_complete
      created_at
    }
  }
`;

// UPDATE - Update existing user
export const UPDATE_RESTAURANT_USER = `
  mutation UpdateRestaurantUser($id: uuid!, $changes: restaurant_users_set_input!) {
    update_restaurant_users_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      profile_image
      about_me
      birthdate
      gender
      custom_gender
      pronoun
      address
      zip_code
      latitude
      longitude
      palates
      language_preference
      auth_method
      onboarding_complete
      updated_at
    }
  }
`;

// DELETE (Soft Delete) - Set deleted_at timestamp
export const SOFT_DELETE_RESTAURANT_USER = `
  mutation SoftDeleteRestaurantUser($id: uuid!) {
    update_restaurant_users_by_pk(
      pk_columns: { id: $id }
      _set: { deleted_at: "now()" }
    ) {
      id
      deleted_at
    }
  }
`;

// HARD DELETE - Permanently delete user (use with caution)
export const DELETE_RESTAURANT_USER = `
  mutation DeleteRestaurantUser($id: uuid!) {
    delete_restaurant_users_by_pk(id: $id) {
      id
      firebase_uuid
      username
    }
  }
`;

// GET FOLLOWERS LIST - Get list of users following a specific user
// NOTE: This requires a 'followers' relationship in Hasura which is not configured
export const GET_FOLLOWERS_LIST = `
  query GetFollowersList($userId: uuid!) {
    restaurant_users_by_pk(id: $userId) {
      id
      # followers relationship not available - returns empty
    }
  }
`;

// GET FOLLOWING LIST - Get list of users that a specific user is following
// NOTE: This requires a 'following' relationship in Hasura which is not configured
export const GET_FOLLOWING_LIST = `
  query GetFollowingList($userId: uuid!) {
    restaurant_users_by_pk(id: $userId) {
      id
      # following relationship not available - returns empty
    }
  }
`;

