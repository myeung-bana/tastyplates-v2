"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { MOCK_ARTICLES } from "@/data/mockArticles";
import ArticleDetail from "@/components/Articles/ArticleDetail";

/** Blog dev: serve mock articles by slug (no API). */
export default function ArticleBySlugDevClient({ slug }: { slug: string }) {
  const article = useMemo(() => {
    const trimmed = slug.trim();
    return MOCK_ARTICLES.find((a) => a.slug === trimmed) ?? null;
  }, [slug]);

  if (!article) return notFound();

  return <ArticleDetail article={article} />;
}
