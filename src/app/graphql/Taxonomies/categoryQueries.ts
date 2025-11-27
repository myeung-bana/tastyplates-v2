// categoryQueries.ts - GraphQL queries for restaurant_categories table

// GET ALL - List all categories with pagination and filtering
export const GET_ALL_CATEGORIES = `
  query GetAllCategories(
    $where: restaurant_categories_bool_exp
    $order_by: [restaurant_categories_order_by!]
    $limit: Int
    $offset: Int
  ) {
    restaurant_categories(
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
      created_at
    }
    restaurant_categories_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// GET BY ID - Get single category by ID
export const GET_CATEGORY_BY_ID = `
  query GetCategoryById($id: Int!) {
    restaurant_categories_by_pk(id: $id) {
      id
      name
      slug
      description
      parent_id
      created_at
    }
  }
`;

