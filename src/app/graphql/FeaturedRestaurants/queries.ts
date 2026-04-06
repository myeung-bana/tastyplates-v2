/** Active featured restaurants for homepage (global list, no per-city column). */
export const GET_FEATURED_RESTAURANTS = `
  query GetFeaturedRestaurants {
    featured_restaurants(
      where: { is_active: { _eq: true } }
      order_by: { sort_order: asc }
    ) {
      id
      restaurant_id
      sort_order
      restaurant {
        id
        uuid
        title
        slug
        featured_image_url
        listing_street
        address
        average_rating
        ratings_count
      }
    }
  }
`;

/** Fallback without nested restaurant fields (if relationship not tracked yet). */
export const GET_FEATURED_RESTAURANTS_FALLBACK = `
  query GetFeaturedRestaurantsFallback {
    featured_restaurants(
      where: { is_active: { _eq: true } }
      order_by: { sort_order: asc }
    ) {
      id
      restaurant_id
      sort_order
    }
  }
`;
