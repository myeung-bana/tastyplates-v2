import { notFound } from "next/navigation";
import { transformHasuraArticle } from "@/utils/articleTransformers";
import ArticleDetail from "@/components/Articles/ArticleDetail";
import ArticleBySlugDevClient from "./ArticleBySlugDevClient";
import {
  fetchArticleBySlug,
  normalizeArticleSlugParam,
} from "@/lib/articles/fetchArticleBySlug";

type PageParams = { slug: string };

export default async function ArticleBySlugPage({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}) {
  const { slug: rawSlug } = await Promise.resolve(params);
  const slug = normalizeArticleSlugParam(rawSlug);

  if (!slug) {
    notFound();
  }

  if (process.env.NEXT_PUBLIC_BLOG_DEV === "true") {
    return <ArticleBySlugDevClient slug={slug} />;
  }

  const row = await fetchArticleBySlug(rawSlug);
  if (!row) {
    notFound();
  }

  const article = transformHasuraArticle(row as Record<string, unknown>);

  return <ArticleDetail article={article} />;
}
