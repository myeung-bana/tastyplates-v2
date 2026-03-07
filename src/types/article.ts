export interface Article {
  id: string;
  uuid?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image_url: string;
  featured_image_url?: string;
  featured_image_alt?: string;
  reading_time_minutes: number;
  published_at: string;
  updated_at?: string;
  content?: string;
  author_id?: string;
  author_name?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  view_count?: number;
  gallery_images?: any[];
}
