// userProfilesQueries.ts - GraphQL queries for user_profiles table (Nhost)
// This table extends auth.users with custom application-specific fields

// GET USER PROFILE BY ID - Get user profile with auth.users data
export const GET_USER_PROFILE_BY_ID = `
  query GetUserProfileById($user_id: uuid!) {
    user_profiles_by_pk(user_id: $user_id) {
      user_id
      username
      about_me
      birthdate
      gender
      pronoun
      palates
      onboarding_complete
      created_at
      updated_at
      # Relationship to auth.users
      user {
        id
        email
        displayName
        avatarUrl
        emailVerified
        phoneNumber
        phoneNumberVerified
        defaultRole
        isAnonymous
        createdAt
        locale
        metadata
      }
    }
  }
`;

// GET USER PROFILE BY USERNAME
export const GET_USER_PROFILE_BY_USERNAME = `
  query GetUserProfileByUsername($username: String!) {
    user_profiles(where: { username: { _eq: $username } }, limit: 1) {
      user_id
      username
      about_me
      birthdate
      gender
      pronoun
      palates
      onboarding_complete
      created_at
      updated_at
      # Relationship to auth.users
      user {
        id
        email
        displayName
        avatarUrl
        emailVerified
        phoneNumber
        phoneNumberVerified
        defaultRole
        isAnonymous
        createdAt
        locale
        metadata
      }
    }
  }
`;

// GET ALL USER PROFILES - List all profiles with pagination
export const GET_ALL_USER_PROFILES = `
  query GetAllUserProfiles(
    $where: user_profiles_bool_exp
    $order_by: [user_profiles_order_by!]
    $limit: Int
    $offset: Int
  ) {
    user_profiles(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      user_id
      username
      about_me
      birthdate
      gender
      pronoun
      palates
      onboarding_complete
      created_at
      updated_at
      # Relationship to auth.users
      user {
        id
        email
        displayName
        avatarUrl
        emailVerified
        createdAt
      }
    }
    user_profiles_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// CREATE USER PROFILE
export const CREATE_USER_PROFILE = `
  mutation CreateUserProfile($object: user_profiles_insert_input!) {
    insert_user_profiles_one(
      object: $object
      on_conflict: {
        constraint: user_profiles_pkey
        update_columns: [username, about_me, birthdate, gender, pronoun, palates, onboarding_complete, updated_at]
      }
    ) {
      user_id
      username
      about_me
      birthdate
      gender
      pronoun
      palates
      onboarding_complete
      created_at
      updated_at
    }
  }
`;

// UPDATE USER PROFILE
export const UPDATE_USER_PROFILE = `
  mutation UpdateUserProfile($user_id: uuid!, $changes: user_profiles_set_input!) {
    update_user_profiles_by_pk(pk_columns: { user_id: $user_id }, _set: $changes) {
      user_id
      username
      about_me
      birthdate
      gender
      pronoun
      palates
      onboarding_complete
      updated_at
    }
  }
`;

// DELETE USER PROFILE
export const DELETE_USER_PROFILE = `
  mutation DeleteUserProfile($user_id: uuid!) {
    delete_user_profiles_by_pk(user_id: $user_id) {
      user_id
      username
    }
  }
`;

// CHECK USERNAME EXISTS
export const CHECK_USERNAME_EXISTS = `
  query CheckUsernameExists($username: String!) {
    user_profiles(where: { username: { _eq: $username } }, limit: 1) {
      user_id
      username
    }
  }
`;


// GET USER PROFILES BY IDS - Get multiple profiles by their IDs
export const GET_USER_PROFILES_BY_IDS = `
  query GetUserProfilesByIds($user_ids: [uuid!]!, $limit: Int = 100) {
    user_profiles(
      where: { user_id: { _in: $user_ids } }
      limit: $limit
    ) {
      user_id
      username
      palates
      # Relationship to auth.users
      user {
        displayName
        avatarUrl
      }
    }
  }
`;
