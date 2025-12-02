// GraphQL queries for restaurant_reviews table (Hasura)

// GET REVIEW BY ID
export const GET_REVIEW_BY_ID = `
  query GetReviewById($id: uuid!) {
    restaurant_reviews_by_pk(id: $id) {
      id
      restaurant_uuid
      author_id
      parent_review_id
      title
      content
      rating
      images
      palates
      hashtags
      mentions
      recognitions
      likes_count
      replies_count
      status
      is_pinned
      is_featured
      created_at
      updated_at
      published_at
      deleted_at
      author {
        id
        username
        display_name
        profile_image
      }
      restaurant {
        uuid
        title
        slug
      }
    }
  }
`;

// GET REVIEWS BY RESTAURANT UUID
export const GET_REVIEWS_BY_RESTAURANT = `
  query GetReviewsByRestaurant(
    $restaurantUuid: uuid!
    $limit: Int
    $offset: Int
  ) {
    restaurant_reviews(
      where: {
        restaurant_uuid: { _eq: $restaurantUuid }
        deleted_at: { _is_null: true }
        parent_review_id: { _is_null: true }
      }
      order_by: [{ is_pinned: desc }, { created_at: desc }]
      limit: $limit
      offset: $offset
    ) {
      id
      title
      content
      rating
      images
      palates
      hashtags
      mentions
      recognitions
      likes_count
      replies_count
      status
      created_at
      published_at
      author_id
      restaurant_uuid
    }
    restaurant_reviews_aggregate(
      where: {
        restaurant_uuid: { _eq: $restaurantUuid }
        deleted_at: { _is_null: true }
        parent_review_id: { _is_null: true }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// GET USER'S REVIEWS
export const GET_USER_REVIEWS = `
  query GetUserReviews(
    $authorId: uuid!
    $limit: Int
    $offset: Int
  ) {
    restaurant_reviews(
      where: {
        author_id: { _eq: $authorId }
        deleted_at: { _is_null: true }
        parent_review_id: { _is_null: true }
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      title
      content
      rating
      images
      palates
      hashtags
      likes_count
      status
      created_at
      published_at
      author_id
      restaurant_uuid
    }
    restaurant_reviews_aggregate(
      where: {
        author_id: { _eq: $authorId }
        deleted_at: { _is_null: true }
        parent_review_id: { _is_null: true }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// CREATE REVIEW MUTATION
export const CREATE_REVIEW = `
  mutation CreateReview($object: restaurant_reviews_insert_input!) {
    insert_restaurant_reviews_one(object: $object) {
      id
      title
      content
      rating
      status
      created_at
      restaurant_uuid
      author_id
    }
  }
`;

// UPDATE REVIEW MUTATION
export const UPDATE_REVIEW = `
  mutation UpdateReview(
    $id: uuid!
    $changes: restaurant_reviews_set_input!
  ) {
    update_restaurant_reviews_by_pk(
      pk_columns: { id: $id }
      _set: $changes
    ) {
      id
      title
      content
      rating
      images
      palates
      hashtags
      status
      updated_at
    }
  }
`;

// SOFT DELETE REVIEW MUTATION
export const DELETE_REVIEW = `
  mutation DeleteReview($id: uuid!) {
    update_restaurant_reviews_by_pk(
      pk_columns: { id: $id }
      _set: { deleted_at: "now()" }
    ) {
      id
      deleted_at
    }
  }
`;

// TOGGLE LIKE MUTATION (Check first, then insert or delete)
export const INSERT_REVIEW_LIKE = `
  mutation InsertReviewLike($reviewId: uuid!, $userId: uuid!) {
    insert_restaurant_review_likes_one(
      object: {
        review_id: $reviewId
        user_id: $userId
      }
      on_conflict: {
        constraint: restaurant_review_likes_unique
        update_columns: []
      }
    ) {
      id
      created_at
    }
  }
`;

// DELETE REVIEW LIKE
export const DELETE_REVIEW_LIKE = `
  mutation DeleteReviewLike($reviewId: uuid!, $userId: uuid!) {
    delete_restaurant_review_likes(
      where: {
        review_id: { _eq: $reviewId }
        user_id: { _eq: $userId }
      }
    ) {
      affected_rows
    }
  }
`;

// CHECK IF USER LIKED REVIEW
export const CHECK_REVIEW_LIKE = `
  query CheckReviewLike($reviewId: uuid!, $userId: uuid!) {
    restaurant_review_likes(
      where: {
        review_id: { _eq: $reviewId }
        user_id: { _eq: $userId }
      }
      limit: 1
    ) {
      id
    }
  }
`;

// GET REVIEW WITH LIKE STATUS
export const GET_REVIEW_WITH_LIKE_STATUS = `
  query GetReviewWithLikeStatus($reviewId: uuid!, $userId: uuid!) {
    restaurant_reviews_by_pk(id: $reviewId) {
      id
      title
      content
      rating
      images
      hashtags
      likes_count
      created_at
      author {
        id
        username
        display_name
        profile_image
      }
      restaurant_review_likes(
        where: { user_id: { _eq: $userId } }
        limit: 1
      ) {
        id
        created_at
      }
    }
  }
`;

// GET REVIEW REPLIES (comments/replies to a review)
export const GET_REVIEW_REPLIES = `
  query GetReviewReplies($parentReviewId: uuid!) {
    restaurant_reviews(
      where: {
        parent_review_id: { _eq: $parentReviewId }
        deleted_at: { _is_null: true }
        status: { _eq: "approved" }
      }
      order_by: { created_at: asc }
    ) {
      id
      content
      likes_count
      created_at
      updated_at
      author_id
    }
  }
`;

// CHECK IF USER LIKED MULTIPLE REVIEWS (batch check)
export const CHECK_REVIEW_LIKES_BATCH = `
  query CheckReviewLikesBatch($reviewIds: [uuid!]!, $userId: uuid!) {
    restaurant_review_likes(
      where: {
        review_id: { _in: $reviewIds }
        user_id: { _eq: $userId }
      }
    ) {
      review_id
      id
    }
  }
`;

