"use client";
import { useEffect, useState } from "react";
import { Article } from "@/types/article";
import { transformHasuraArticle } from "@/utils/articleTransformers";
import ArticleCard from "./ArticleCard";
import ArticleCardSkeleton from "@/components/ui/Skeleton/ArticleCardSkeleton";
import { useLocation } from "@/contexts/LocationContext";
import "@/styles/components/_articles.scss";
import SeeAllButton from "@/components/ui/SeeAllButton";

const Articles = () => {
  const { selectedLocation, isLoading: locationLoading } = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locationLoading) return;

    setLoading(true);
    const params = new URLSearchParams({
      limit: "8",
      location_slug: selectedLocation.key,
    });
    fetch(`/api/v1/articles/get-articles?${params.toString()}`)
      .then((res) => res.json())
      .then(({ success, data }) => {
        if (success && Array.isArray(data)) {
          setArticles(data.map(transformHasuraArticle));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locationLoading, selectedLocation.key]);

  if (!locationLoading && !loading && articles.length === 0) return null;

  return (
    <section className="articles !w-full">
      <div className="articles__container mx-auto">
        <div className="articles__header">
          <h2 className="articles__title font-neusans">Articles</h2>
          <SeeAllButton
            href="/articles"
            variant="inline"
            className="articles__see-all hidden md:inline-flex"
          >
            See all
          </SeeAllButton>
        </div>
        <div className="articles__grid grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {locationLoading || loading
            ? Array.from({ length: 8 }, (_, i) => (
                <ArticleCardSkeleton key={`article-skeleton-${i}`} large />
              ))
            : articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  size="large"
                />
              ))}
        </div>
        <div className="mt-5 md:hidden">
          <SeeAllButton href="/articles" variant="block">
            See all
          </SeeAllButton>
        </div>
      </div>
    </section>
  );
};

export default Articles;
