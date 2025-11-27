// palateQueries.ts - GraphQL queries for restaurant_palates table

// GET ALL - List all palates with pagination and filtering
export const GET_ALL_PALATES = `
  query GetAllPalates(
    $where: restaurant_palates_bool_exp
    $order_by: [restaurant_palates_order_by!]
    $limit: Int
    $offset: Int
  ) {
    restaurant_palates(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      name
      slug
      parent_id
      created_at
    }
    restaurant_palates_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY ID - Get single palate by ID
export const GET_PALATE_BY_ID = `
  query GetPalateById($id: Int!) {
    restaurant_palates_by_pk(id: $id) {
      id
      name
      slug
      parent_id
      created_at
    }
  }
`;

