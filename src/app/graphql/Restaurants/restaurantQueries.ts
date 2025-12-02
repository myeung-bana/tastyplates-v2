// restaurantQueries.ts - GraphQL queries for restaurants table (Hasura)

// GET ALL RESTAURANTS - List all restaurants with pagination and filtering
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
      price
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
    restaurants_by_pk(uuid: $uuid) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      price
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
    restaurants_by_pk(uuid: $uuid) {
      id
      uuid
      title
      slug
      status
      content
      price_range_id
      price
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
      price
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
      price
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

