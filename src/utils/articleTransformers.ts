import {
  Article,
  ArticleAuthorProfile,
  ArticleLinkedLocation,
  ArticleLinkedRestaurant,
  ArticleRestaurantAssociation,
} from "@/types/article";
import { stripHtmlServer, truncatePlainText } from "@/lib/stripHtmlServer";

function mapAuthorProfile(raw: unknown): ArticleAuthorProfile | null | undefined {
  if (raw === null || raw === undefined) return raw as null | undefined;
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return {
    id: o.id != null ? String(o.id) : undefined,
    displayName: typeof o.displayName === "string" ? o.displayName : undefined,
    avatarUrl: typeof o.avatarUrl === "string" ? o.avatarUrl : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
  };
}

function mapRestaurantNested(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

function mapAssociations(raw: unknown): ArticleRestaurantAssociation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      id: o.id != null ? String(o.id) : "",
      article_id: o.article_id != null ? String(o.article_id) : undefined,
      created_at: typeof o.created_at === "string" ? o.created_at : undefined,
      display_order: typeof o.display_order === "number" ? o.display_order : undefined,
      restaurant_id: o.restaurant_id != null ? String(o.restaurant_id) : undefined,
    };
  });
}

function mapLinkedRestaurants(raw: unknown): ArticleLinkedRestaurant[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ArticleLinkedRestaurant[] = [];
  for (const row of raw) {
    const o = row as Record<string, unknown>;
    const rest = mapRestaurantNested(o.restaurant);
    if (!rest) continue;
    const title = (rest.title as string | undefined)?.trim() || "Restaurant";

    const slug = typeof rest?.slug === "string" ? rest.slug : undefined;
    const contentHtml = typeof rest?.content === "string" ? rest.content : "";
    const plain = contentHtml ? truncatePlainText(stripHtmlServer(contentHtml), 220) : "";

    const address =
      (typeof rest?.address === "string" && rest.address.trim()) ||
      (typeof rest?.listing_street === "string" && rest.listing_street.trim()) ||
      "";

    out.push({
      associationId: o.id != null ? String(o.id) : "",
      display_order: typeof o.display_order === "number" ? o.display_order : undefined,
      restaurant_id: o.restaurant_id != null ? String(o.restaurant_id) : undefined,
      title,
      slug,
      uuid: rest?.uuid != null ? String(rest.uuid) : undefined,
      imageUrl:
        typeof rest?.featured_image_url === "string" ? rest.featured_image_url : undefined,
      addressLine: address || undefined,
      description: plain || undefined,
    });
  }
  return out.length ? out : undefined;
}

function mapLinkedLocations(raw: unknown): ArticleLinkedLocation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ArticleLinkedLocation[] = [];
  for (const row of raw) {
    const o = row as Record<string, unknown>;
    const loc = o.restaurant_location;
    if (loc == null || typeof loc !== "object") continue;
    const l = loc as Record<string, unknown>;
    const name = typeof l.name === "string" ? l.name.trim() : "";
    if (!name) continue;
    out.push({
      id: o.id != null ? String(o.id) : "",
      display_order: typeof o.display_order === "number" ? o.display_order : undefined,
      location_id: o.location_id != null ? String(o.location_id) : undefined,
      name,
      slug: typeof l.slug === "string" ? l.slug : undefined,
      short_label: typeof l.short_label === "string" ? l.short_label : undefined,
      flag_url: typeof l.flag_url === "string" ? l.flag_url : undefined,
      type: typeof l.type === "string" ? l.type : undefined,
    });
  }
  return out.length ? out : undefined;
}

export function transformHasuraArticle(raw: Record<string, unknown>): Article {
  const authorProfile = mapAuthorProfile(raw.author_profile);
  const displayName = authorProfile?.displayName;

  return {
    id: String(raw.id),
    uuid: raw.uuid != null ? String(raw.uuid) : undefined,
    slug: (raw.slug as string) || "",
    title: (raw.title as string) || "",
    excerpt: (raw.excerpt as string) || "",
    category: (raw.category as string) || "",
    cover_image_url: (raw.featured_image_url as string) || "",
    featured_image_url: raw.featured_image_url as string | undefined,
    featured_image_alt: raw.featured_image_alt as string | undefined,
    reading_time_minutes: (raw.reading_time_minutes as number) || 1,
    published_at: (raw.published_at as string) || (raw.created_at as string) || new Date().toISOString(),
    updated_at: raw.updated_at as string | undefined,
    content: raw.content as string | undefined,
    author_id:
      raw.author_uuid != null
        ? String(raw.author_uuid)
        : raw.author_id != null
          ? String(raw.author_id)
          : undefined,
    author_name:
      displayName ??
      (typeof raw.author_name === "string" ? raw.author_name : undefined),
    author_profile: authorProfile ?? null,
    meta_title: raw.meta_title as string | undefined,
    meta_description: raw.meta_description as string | undefined,
    meta_keywords: raw.meta_keywords as string | undefined,
    view_count: (raw.view_count as number) || 0,
    gallery_images: (raw.gallery_images as unknown[]) || [],
    article_restaurant_associations: mapAssociations(raw.article_restaurant_associations),
    article_linked_locations: mapLinkedLocations(raw.article_restaurant_location_associations),
    article_linked_restaurants: mapLinkedRestaurants(raw.article_restaurant_associations),
  };
}
