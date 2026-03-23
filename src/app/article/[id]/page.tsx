import { notFound, permanentRedirect } from "next/navigation";
import { fetchArticleSlugByNumericId } from "@/lib/articles/fetchArticleSlugByNumericId";

type PageParams = { id: string };

/**
 * Legacy numeric URLs → canonical /articles/[slug].
 */
export default async function LegacyArticleByIdPage({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}) {
  const { id: idParam } = await Promise.resolve(params);
  const id = parseInt(idParam, 10);

  if (Number.isNaN(id) || id < 1) {
    notFound();
  }

  const slug = await fetchArticleSlugByNumericId(id);
  if (!slug) {
    notFound();
  }

  permanentRedirect(`/articles/${encodeURIComponent(slug)}`);
}
