// cuisineQueries.ts - GraphQL queries for restaurant_cuisines table

// GET ALL - List all cuisines with pagination and filtering
export const GET_ALL_CUISINES = `
  query GetAllCuisines(
    $where: restaurant_cuisines_bool_exp
    $order_by: [restaurant_cuisines_order_by!]
    $limit: Int
    $offset: Int
  ) {
    restaurant_cuisines(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      name
      slug
      description
      parent_id
      flag_url
      created_at
    }
    restaurant_cuisines_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY ID - Get single cuisine by ID
export const GET_CUISINE_BY_ID = `
  query GetCuisineById($id: Int!) {
    restaurant_cuisines_by_pk(id: $id) {
      id
      name
      slug
      description
      parent_id
      flag_url
      created_at
    }
  }
`;

