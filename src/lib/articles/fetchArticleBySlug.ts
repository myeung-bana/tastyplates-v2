import { hasuraQuery } from "@/app/graphql/hasura-server-client";
import {
  GET_ARTICLE_BY_SLUG_DETAIL,
  GET_ARTICLE_BY_SLUG_SIMPLE,
  GET_ARTICLE_BY_SLUG_DETAIL_ILIKE,
  GET_ARTICLE_BY_SLUG_SIMPLE_ILIKE,
} from "@/app/graphql/Articles/articleQueries";
import { GET_RESTAURANTS_BY_IDS } from "@/app/graphql/Restaurants/restaurantQueries";

/**
 * Decode and trim slug from URL / query string (handles accidental double-encoding).
 */
export function normalizeArticleSlugParam(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  try {
    let prev = "";
    // Repeat decode until stable (max 3 iterations)
    for (let i = 0; i < 3 && prev !== s; i++) {
      prev = s;
      s = decodeURIComponent(s);
    }
  } catch {
    // keep last good value
  }
  return s.trim();
}

/** `_ilike` treats `_` and `%` as wildcards — skip CI fallback for those slugs */
function isSafeForIlikeExactSlug(slug: string): boolean {
  return slug.length > 0 && !slug.includes("%") && !slug.includes("_");
}

type ArticleRow = Record<string, unknown>;

function parseRestaurantIntId(id: unknown): number | null {
  if (id == null) return null;
  if (typeof id === "number" && Number.isFinite(id)) return Math.trunc(id);
  const n = parseInt(String(id), 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Hasura has no `restaurant` relationship on `article_restaurant_associations`;
 * merge batch-fetched `restaurants` rows onto each association for the transformer.
 */
async function enrichArticleRestaurantAssociations(row: ArticleRow): Promise<ArticleRow> {
  const assocs = row.article_restaurant_associations;
  if (!Array.isArray(assocs) || assocs.length === 0) return row;

  const ids = [
    ...new Set(
      assocs
        .map((a) => parseRestaurantIntId((a as Record<string, unknown>).restaurant_id))
        .filter((n): n is number => n != null)
    ),
  ];
  if (ids.length === 0) return row;

  const result = await hasuraQuery<{ restaurants?: Record<string, unknown>[] }>(
    GET_RESTAURANTS_BY_IDS,
    { ids }
  );

  if (result.errors?.length) {
    console.warn(
      "[fetchArticleBySlug] GET_RESTAURANTS_BY_IDS failed:",
      result.errors[0]?.message
    );
    return row;
  }

  const list = result.data?.restaurants ?? [];
  const byId = new Map<number, Record<string, unknown>>();
  for (const r of list) {
    const pk = parseRestaurantIntId(r.id);
    if (pk != null) byId.set(pk, r);
  }

  const merged = assocs.map((a) => {
    const o = a as Record<string, unknown>;
    const rid = parseRestaurantIntId(o.restaurant_id);
    const restaurant = rid != null ? byId.get(rid) : undefined;
    if (!restaurant) return o;
    return { ...o, restaurant };
  });

  return { ...row, article_restaurant_associations: merged };
}

async function fetchWithDetailThenSimple(
  slug: string,
  useIlike: boolean
): Promise<ArticleRow | null> {
  const detailQuery = useIlike
    ? GET_ARTICLE_BY_SLUG_DETAIL_ILIKE
    : GET_ARTICLE_BY_SLUG_DETAIL;
  const simpleQuery = useIlike
    ? GET_ARTICLE_BY_SLUG_SIMPLE_ILIKE
    : GET_ARTICLE_BY_SLUG_SIMPLE;

  let result = await hasuraQuery<{ articles?: ArticleRow[] }>(detailQuery, {
    slug,
  });

  if (result.errors?.length) {
    console.warn(
      "[fetchArticleBySlug] detail query failed, trying simple:",
      result.errors[0]?.message
    );
    result = await hasuraQuery<{ articles?: ArticleRow[] }>(simpleQuery, {
      slug,
    });
  }

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "Failed to fetch article");
  }

  const rows = result.data?.articles ?? [];
  return rows[0] ?? null;
}

/**
 * Load a single published article by slug for detail pages and API.
 * Order: exact (normalized) → exact (trimmed raw) → case-insensitive (if ILIKE-safe).
 */
export async function fetchArticleBySlug(
  rawInput: string
): Promise<ArticleRow | null> {
  const slug = normalizeArticleSlugParam(rawInput);
  if (!slug) return null;

  let row = await fetchWithDetailThenSimple(slug, false);
  if (row) return enrichArticleRestaurantAssociations(row);

  const trimmedRaw = rawInput.trim();
  if (trimmedRaw && trimmedRaw !== slug) {
    row = await fetchWithDetailThenSimple(trimmedRaw, false);
    if (row) return enrichArticleRestaurantAssociations(row);
  }

  if (isSafeForIlikeExactSlug(slug)) {
    row = await fetchWithDetailThenSimple(slug, true);
    if (row) return enrichArticleRestaurantAssociations(row);
  }

  return null;
}
