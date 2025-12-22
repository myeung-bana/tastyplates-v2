// restaurantQueries.ts - GraphQL queries for restaurants table (Hasura)

// GET ALL RESTAURANTS - List all restaurants with pagination and filtering
// Enhanced with all fields from documentation including categories, branches, and relationships
export const GET_ALL_RESTAURANTS = `
  query GetAllRestaurants(
    $limit: Int
    $offset: Int
    $where: restaurants_bool_exp
    $order_by: [restaurants_order_by!]
  ) {
    restaurants(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      average_rating
      ratings_count
      listing_street
      phone
      menu_url
      longitude
      latitude
      google_zoom
      featured_image_url
      uploaded_images
      opening_hours
      address
      created_at
      updated_at
      published_at
      cuisines
      palates
      categories
      is_main_location
      branch_group_id
      # Note: branches, parent_restaurant, and restaurant_price_range relationships not available in Hasura schema
      # Use branch_group_id to query related restaurants separately if needed
      # Use price_range_id field directly instead of relationship
    }
    restaurants_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY UUID - Get single restaurant by UUID
export const GET_RESTAURANT_BY_UUID = `
  query GetRestaurantByUuid($uuid: uuid!) {
    restaurants(where: { uuid: { _eq: $uuid } }, limit: 1) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      average_rating
      ratings_count
      listing_street
      phone
      menu_url
      longitude
      latitude
      google_zoom
      featured_image_url
      uploaded_images
      opening_hours
      address
      created_at
      updated_at
      published_at
      cuisines
      palates
    }
  }
`;

// GET BY UUID WITH PRICE RANGE - Includes price_range_id and relationship (if configured)
export const GET_RESTAURANT_BY_UUID_WITH_PRICE_RANGE = `
  query GetRestaurantByUuid($uuid: uuid!) {
    restaurants(where: { uuid: { _eq: $uuid } }, limit: 1) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      average_rating
      ratings_count
      listing_street
      phone
      menu_url
      longitude
      latitude
      google_zoom
      featured_image_url
      uploaded_images
      opening_hours
      address
      created_at
      updated_at
      published_at
      cuisines
      palates
      restaurant_price_range {
        id
        display_name
        name
        symbol
        slug
      }
    }
  }
`;

// GET BY SLUG - Get single restaurant by slug (for backward compatibility)
export const GET_RESTAURANT_BY_SLUG_HASURA = `
  query GetRestaurantBySlug($slug: String!) {
    restaurants(where: { slug: { _eq: $slug } }, limit: 1) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      average_rating
      ratings_count
      listing_street
      phone
      menu_url
      longitude
      latitude
      google_zoom
      featured_image_url
      uploaded_images
      opening_hours
      address
      created_at
      updated_at
      published_at
      cuisines
      palates
    }
  }
`;

// GET BY SLUG WITH PRICE RANGE - Includes price_range_id and relationship (if configured)
export const GET_RESTAURANT_BY_SLUG_HASURA_WITH_PRICE_RANGE = `
  query GetRestaurantBySlug($slug: String!) {
    restaurants(where: { slug: { _eq: $slug } }, limit: 1) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      average_rating
      ratings_count
      listing_street
      phone
      menu_url
      longitude
      latitude
      google_zoom
      featured_image_url
      uploaded_images
      opening_hours
      address
      created_at
      updated_at
      published_at
      cuisines
      palates
      restaurant_price_range {
        id
        display_name
        name
        symbol
        slug
      }
    }
  }
`;

// MATCH RESTAURANT BY PLACE ID - Check if restaurant exists by Google Place ID
export const MATCH_RESTAURANT_BY_PLACE_ID = `
  query MatchRestaurantByPlaceId($placeId: String!) {
    restaurants(
      where: { 
        address: { _contains: { place_id: $placeId } }
      }
      limit: 1
    ) {
      id
      uuid
      title
      slug
      status
      listing_street
      phone
      menu_url
      longitude
      latitude
      featured_image_url
      average_rating
      ratings_count
      address
    }
  }
`;

// MATCH RESTAURANT BY NAME AND ADDRESS - Fuzzy matching
export const MATCH_RESTAURANT_BY_NAME_ADDRESS = `
  query MatchRestaurantByNameAndAddress($name: String!, $address: String!) {
    restaurants(
      where: {
        _and: [
          { title: { _ilike: $name } }
          { listing_street: { _ilike: $address } }
        ]
      }
      limit: 5
    ) {
      id
      uuid
      title
      slug
      status
      listing_street
      phone
      menu_url
      longitude
      latitude
      featured_image_url
      average_rating
      ratings_count
      address
    }
  }
`;

// CREATE RESTAURANT - Create new restaurant from Google Places data
export const CREATE_RESTAURANT = `
  mutation CreateRestaurant($object: restaurants_insert_input!) {
    insert_restaurants_one(object: $object) {
      id
      uuid
      title
      slug
      status
      listing_street
      phone
      menu_url
      longitude
      latitude
      featured_image_url
      address
      created_at
      updated_at
    }
  }
`;
