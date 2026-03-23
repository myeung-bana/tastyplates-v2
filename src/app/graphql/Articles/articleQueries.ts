/** Resolve `restaurant_locations` row by slug for article filtering */
export const GET_RESTAURANT_LOCATION_BY_SLUG = `
  query GetRestaurantLocationBySlug($slug: String!) {
    restaurant_locations(
      where: { slug: { _eq: $slug }, is_active: { _eq: true } }
      limit: 1
    ) {
      id
      type
      slug
    }
  }
`;

/** Cities (or any child rows) under a country location */
export const GET_CHILD_RESTAURANT_LOCATION_IDS = `
  query GetChildRestaurantLocationIds($parentId: Int!) {
    restaurant_locations(
      where: { parent_id: { _eq: $parentId }, is_active: { _eq: true } }
    ) {
      id
    }
  }
`;

/** List: published, not deleted, linked to at least one of the given location ids */
export const GET_ARTICLES_FOR_LOCATIONS = `
  query GetArticlesForLocations($limit: Int, $offset: Int, $locationIds: [Int!]!) {
    articles(
      where: {
        _and: [
          { status: { _eq: "published" } }
          { deleted_at: { _is_null: true } }
          {
            article_restaurant_location_associations: {
              location_id: { _in: $locationIds }
            }
          }
        ]
      }
      order_by: { published_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      uuid
      slug
      title
      excerpt
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      view_count
      author_profile {
        id
        displayName
        avatarUrl
        email
      }
    }
  }
`;

export const GET_ARTICLES_FOR_LOCATIONS_FALLBACK = `
  query GetArticlesForLocationsFallback($limit: Int, $offset: Int, $locationIds: [Int!]!) {
    articles(
      where: {
        _and: [
          { status: { _eq: "published" } }
          { deleted_at: { _is_null: true } }
          {
            article_restaurant_location_associations: {
              location_id: { _in: $locationIds }
            }
          }
        ]
      }
      order_by: { published_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      uuid
      slug
      title
      excerpt
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      view_count
    }
  }
`;

/** List: published, not deleted; includes author_profile when relationship exists in Hasura */
export const GET_ARTICLES = `
  query GetArticles($limit: Int, $offset: Int) {
    articles(
      where: {
        status: { _eq: "published" }
        deleted_at: { _is_null: true }
      }
      order_by: { published_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      uuid
      slug
      title
      excerpt
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      view_count
      author_profile {
        id
        displayName
        avatarUrl
        email
      }
    }
  }
`;

/** Same list query without archived_at / author_profile — fallback if schema lacks columns or relationships */
export const GET_ARTICLES_FALLBACK = `
  query GetArticlesFallback($limit: Int, $offset: Int) {
    articles(
      where: {
        status: { _eq: "published" }
        deleted_at: { _is_null: true }
      }
      order_by: { published_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      uuid
      slug
      title
      excerpt
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      view_count
    }
  }
`;

export const GET_ARTICLE_BY_ID = `
  query GetArticleById($id: Int!) {
    articles_by_pk(id: $id) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;

/** Detail by slug — full article + author + restaurant associations */
export const GET_ARTICLE_BY_SLUG_DETAIL = `
  query GetArticleBySlugDetail($slug: String!) {
    articles(
      where: {
        slug: { _eq: $slug }
        deleted_at: { _is_null: true }
        status: { _eq: "published" }
      }
      limit: 1
    ) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
      author_profile {
        id
        displayName
        avatarUrl
        email
        createdAt
      }
      article_restaurant_location_associations(order_by: { display_order: asc }) {
        id
        display_order
        location_id
        restaurant_location {
          id
          name
          slug
          short_label
          flag_url
          type
        }
      }
      article_restaurant_associations(order_by: { display_order: asc }) {
        id
        article_id
        created_at
        display_order
        restaurant_id
      }
    }
  }
`;

/** Slug detail without author_profile / associations — fallback if relationships not in schema yet */
export const GET_ARTICLE_BY_SLUG_SIMPLE = `
  query GetArticleBySlugSimple($slug: String!) {
    articles(
      where: {
        slug: { _eq: $slug }
        deleted_at: { _is_null: true }
        status: { _eq: "published" }
      }
      limit: 1
    ) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;

/** Case-insensitive slug (PostgreSQL ILIKE). Only safe when slug has no `_` or `%` (LIKE wildcards). */
export const GET_ARTICLE_BY_SLUG_DETAIL_ILIKE = `
  query GetArticleBySlugDetailIlike($slug: String!) {
    articles(
      where: {
        slug: { _ilike: $slug }
        deleted_at: { _is_null: true }
        status: { _eq: "published" }
      }
      limit: 1
    ) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
      author_profile {
        id
        displayName
        avatarUrl
        email
        createdAt
      }
      article_restaurant_location_associations(order_by: { display_order: asc }) {
        id
        display_order
        location_id
        restaurant_location {
          id
          name
          slug
          short_label
          flag_url
          type
        }
      }
      article_restaurant_associations(order_by: { display_order: asc }) {
        id
        article_id
        created_at
        display_order
        restaurant_id
      }
    }
  }
`;

export const GET_ARTICLE_BY_SLUG_SIMPLE_ILIKE = `
  query GetArticleBySlugSimpleIlike($slug: String!) {
    articles(
      where: {
        slug: { _ilike: $slug }
        deleted_at: { _is_null: true }
        status: { _eq: "published" }
      }
      limit: 1
    ) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;

/** Legacy minimal slug query (kept for reference) */
export const GET_ARTICLE_BY_SLUG = `
  query GetArticleBySlug($slug: String!) {
    articles(
      where: {
        slug: { _eq: $slug }
        deleted_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      uuid
      slug
      title
      excerpt
      content
      category
      featured_image_url
      featured_image_alt
      reading_time_minutes
      published_at
      updated_at
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;
