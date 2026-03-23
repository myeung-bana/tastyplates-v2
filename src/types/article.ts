export interface ArticleAuthorProfile {
  id?: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
}

export interface ArticleRestaurantAssociation {
  id: string;
  article_id?: string;
  created_at?: string;
  display_order?: number;
  restaurant_id?: string;
}

/** Resolved from `article_restaurant_location_associations` + `restaurant_location` */
export interface ArticleLinkedLocation {
  id: string;
  display_order?: number;
  location_id?: string;
  name: string;
  slug?: string;
  short_label?: string;
  flag_url?: string;
  type?: string;
}

/** Resolved from `article_restaurant_associations` + nested `restaurant`, ordered by `display_order` */
export interface ArticleLinkedRestaurant {
  associationId: string;
  display_order?: number;
  restaurant_id?: string;
  title: string;
  slug?: string;
  uuid?: string;
  imageUrl?: string;
  addressLine?: string;
  description?: string;
}

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
  author_profile?: ArticleAuthorProfile | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  view_count?: number;
  gallery_images?: unknown[];
  article_restaurant_associations?: ArticleRestaurantAssociation[];
  article_linked_locations?: ArticleLinkedLocation[];
  article_linked_restaurants?: ArticleLinkedRestaurant[];
}
