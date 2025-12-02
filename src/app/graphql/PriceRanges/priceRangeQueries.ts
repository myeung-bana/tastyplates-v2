// priceRangeQueries.ts - GraphQL queries for restaurant_price_ranges table

// GET ALL - List all price ranges
export const GET_ALL_PRICE_RANGES = `
  query GetAllPriceRanges(
    $where: restaurant_price_ranges_bool_exp
    $order_by: [restaurant_price_ranges_order_by!]
    $limit: Int
    $offset: Int
  ) {
    restaurant_price_ranges(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      name
      display_name
      slug
      symbol
      description
      parent_id
      created_at
      updated_at
    }
    restaurant_price_ranges_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY ID - Get single price range by ID
export const GET_PRICE_RANGE_BY_ID = `
  query GetPriceRangeById($id: Int!) {
    restaurant_price_ranges_by_pk(id: $id) {
      id
      name
      display_name
      slug
      symbol
      description
      parent_id
      created_at
      updated_at
    }
  }
`;

