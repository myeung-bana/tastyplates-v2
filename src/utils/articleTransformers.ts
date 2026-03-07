import { Article } from "@/types/article";

export function transformHasuraArticle(raw: any): Article {
  return {
    id: String(raw.id),
    uuid: raw.uuid,
    slug: raw.slug || "",
    title: raw.title || "",
    excerpt: raw.excerpt || "",
    category: raw.category || "",
    cover_image_url: raw.featured_image_url || "",
    featured_image_url: raw.featured_image_url,
    featured_image_alt: raw.featured_image_alt,
    reading_time_minutes: raw.reading_time_minutes || 1,
    published_at: raw.published_at || raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at,
    content: raw.content,
    author_id: raw.author_id,
    author_name: raw.author_name,
    meta_title: raw.meta_title,
    meta_description: raw.meta_description,
    meta_keywords: raw.meta_keywords,
    view_count: raw.view_count || 0,
    gallery_images: raw.gallery_images || [],
  };
}
