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
      author_name
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
      author_id
      author_name
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;

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
      author_id
      author_name
      meta_title
      meta_description
      meta_keywords
      view_count
      gallery_images
    }
  }
`;
