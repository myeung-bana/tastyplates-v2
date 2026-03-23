import { hasuraQuery } from "@/app/graphql/hasura-server-client";
import { GET_ARTICLE_BY_ID } from "@/app/graphql/Articles/articleQueries";

/**
 * Returns canonical slug for redirect from legacy /article/[id] URLs.
 */
export async function fetchArticleSlugByNumericId(
  id: number
): Promise<string | null> {
  if (!Number.isFinite(id) || id < 1) return null;

  const result = await hasuraQuery<{
    articles_by_pk: { slug?: string | null } | null;
  }>(GET_ARTICLE_BY_ID, { id });

  if (result.errors?.length || !result.data?.articles_by_pk) {
    return null;
  }

  const slug = result.data.articles_by_pk.slug;
  if (slug == null || !String(slug).trim()) return null;
  return String(slug).trim();
}
