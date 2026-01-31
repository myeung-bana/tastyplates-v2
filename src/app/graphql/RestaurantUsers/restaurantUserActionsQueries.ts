// restaurantUserActionsQueries.ts - GraphQL queries for user favorites and check-ins

// Helper query to get restaurant UUID by slug
export const GET_RESTAURANT_UUID_BY_SLUG = `
  query GetRestaurantUuidBySlug($slug: String!) {
    restaurants(where: { slug: { _eq: $slug }, status: { _eq: "publish" } }, limit: 1) {
      uuid
      title
      slug
    }
  }
`;

// ============================================
// FAVORITES (WISHLIST) QUERIES
// ============================================

// Check if user has favorited a restaurant
export const CHECK_USER_FAVORITE = `
  query CheckUserFavorite($user_id: uuid!, $restaurant_uuid: uuid!) {
    user_favorites(
      where: {
        user_id: { _eq: $user_id }
        restaurant_uuid: { _eq: $restaurant_uuid }
      }
      limit: 1
    ) {
      id
      created_at
    }
  }
`;

// Get all favorites for a user (without relationship - fetch restaurant_uuid only)
export const GET_USER_FAVORITES = `
  query GetUserFavorites($user_id: uuid!, $limit: Int, $offset: Int) {
    user_favorites(
      where: { user_id: { _eq: $user_id } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      created_at
      restaurant_uuid
    }
    user_favorites_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
  }
`;

// Get restaurants by UUIDs (batch query)
export const GET_RESTAURANTS_BY_UUIDS = `
  query GetRestaurantsByUuids($uuids: [uuid!]!) {
    restaurants(where: { uuid: { _in: $uuids } }) {
      id
      uuid
      title
      slug
      status
      average_rating
      ratings_count
      price_range
      price_range_id
      featured_image_url
      listing_street
      address
      cuisines
      palates
      categories
    }
  }
`;

// Get all users who favorited a restaurant (cross-viewing)
export const GET_RESTAURANT_FAVORITED_BY = `
  query GetRestaurantFavoritedBy($restaurant_uuid: uuid!, $limit: Int, $offset: Int) {
    user_favorites(
      where: { restaurant_uuid: { _eq: $restaurant_uuid } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      created_at
      user {
        id
        username
        display_name
        profile_image
        palates
      }
    }
    user_favorites_aggregate(where: { restaurant_uuid: { _eq: $restaurant_uuid } }) {
      aggregate {
        count
      }
    }
  }
`;

// Add restaurant to favorites
export const ADD_TO_FAVORITES = `
  mutation AddToFavorites($user_id: uuid!, $restaurant_uuid: uuid!) {
    insert_user_favorites_one(
      object: {
        user_id: $user_id
        restaurant_uuid: $restaurant_uuid
      }
    ) {
      id
      created_at
    }
  }
`;

// Remove restaurant from favorites
export const REMOVE_FROM_FAVORITES = `
  mutation RemoveFromFavorites($user_id: uuid!, $restaurant_uuid: uuid!) {
    delete_user_favorites(
      where: {
        user_id: { _eq: $user_id }
        restaurant_uuid: { _eq: $restaurant_uuid }
      }
    ) {
      affected_rows
    }
  }
`;

// ============================================
// CHECK-INS QUERIES
// ============================================

// Check if user has checked in to a restaurant
export const CHECK_USER_CHECKIN = `
  query CheckUserCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
    user_checkins(
      where: {
        user_id: { _eq: $user_id }
        restaurant_uuid: { _eq: $restaurant_uuid }
      }
      limit: 1
    ) {
      id
      checked_in_at
    }
  }
`;

// Get all check-ins for a user (without relationship - fetch restaurant_uuid only)
export const GET_USER_CHECKINS = `
  query GetUserCheckins($user_id: uuid!, $limit: Int, $offset: Int) {
    user_checkins(
      where: { user_id: { _eq: $user_id } }
      limit: $limit
      offset: $offset
      order_by: { checked_in_at: desc }
    ) {
      id
      checked_in_at
      restaurant_uuid
    }
    user_checkins_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
  }
`;

// Get all users who checked in to a restaurant (cross-viewing)
export const GET_RESTAURANT_CHECKED_IN_BY = `
  query GetRestaurantCheckedInBy($restaurant_uuid: uuid!, $limit: Int, $offset: Int) {
    user_checkins(
      where: { restaurant_uuid: { _eq: $restaurant_uuid } }
      limit: $limit
      offset: $offset
      order_by: { checked_in_at: desc }
    ) {
      id
      checked_in_at
      user {
        id
        username
        display_name
        profile_image
        palates
      }
    }
    user_checkins_aggregate(where: { restaurant_uuid: { _eq: $restaurant_uuid } }) {
      aggregate {
        count
      }
    }
  }
`;

// Add check-in
export const ADD_CHECKIN = `
  mutation AddCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
    insert_user_checkins_one(
      object: {
        user_id: $user_id
        restaurant_uuid: $restaurant_uuid
      }
    ) {
      id
      checked_in_at
    }
  }
`;

// Remove check-in
export const REMOVE_CHECKIN = `
  mutation RemoveCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
    delete_user_checkins(
      where: {
        user_id: { _eq: $user_id }
        restaurant_uuid: { _eq: $restaurant_uuid }
      }
    ) {
      affected_rows
    }
  }
`;

