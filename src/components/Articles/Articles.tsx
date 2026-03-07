"use client";
import { useEffect, useState } from "react";
import { Article } from "@/types/article";
import { transformHasuraArticle } from "@/utils/articleTransformers";
import ArticleCard from "./ArticleCard";
import ArticleCardSkeleton from "@/components/ui/Skeleton/ArticleCardSkeleton";
import "@/styles/components/_articles.scss";

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isBlogDev = process.env.NEXT_PUBLIC_BLOG_DEV === "true";

    if (isBlogDev) {
      import("@/data/mockArticles")
        .then(({ MOCK_ARTICLES }) => {
          setArticles(MOCK_ARTICLES.slice(0, 8));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetch("/api/v1/articles/get-articles?limit=8")
        .then((res) => res.json())
        .then(({ success, data }) => {
          if (success && Array.isArray(data)) {
            setArticles(data.map(transformHasuraArticle));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="articles !w-full">
      <div className="articles__container mx-auto">
        <div className="articles__header">
          <h2 className="articles__title font-neusans">Articles</h2>
          <a href="/articles" className="articles__see-all font-neusans">
            See all
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <ArticleCardSkeleton key={`article-skeleton-${i}`} />
              ))
            : articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default Articles;
