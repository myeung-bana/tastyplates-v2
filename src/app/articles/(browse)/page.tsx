"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Article } from "@/types/article";
import { transformHasuraArticle } from "@/utils/articleTransformers";
import ArticleCard from "@/components/Articles/ArticleCard";
import ArticleCardSkeleton from "@/components/ui/Skeleton/ArticleCardSkeleton";
import { useLocation } from "@/contexts/LocationContext";

const PAGE_SIZE = 12;

export default function ArticlesListingPage() {
  const { selectedLocation } = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (nextOffset: number, append: boolean) => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(nextOffset),
      location_slug: selectedLocation.key,
    });
    const res = await fetch(`/api/v1/articles/get-articles?${params.toString()}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      setHasMore(false);
      return;
    }
    const mapped = json.data.map((row: Record<string, unknown>) =>
      transformHasuraArticle(row)
    );
    setArticles((prev) => (append ? [...prev, ...mapped] : mapped));
    setHasMore(!!json.meta?.hasMore && mapped.length > 0);
  }, [selectedLocation.key]);

  useEffect(() => {
    setLoading(true);
    load(0, false)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [load]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await load(articles.length, true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="py-8 md:pt-[88px] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-neusans">
            Articles
          </h1>
          <p className="text-gray-600 font-neusans">
            Stories, guides, and food inspiration from the TastyPlates community
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ArticleCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-gray-500 font-neusans text-center py-12">
            No articles yet.{" "}
            <Link href="/" className="text-[#ff7c0a] hover:underline">
              Back home
            </Link>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full bg-[#ff7c0a] text-white font-semibold hover:bg-[#e66d08] disabled:opacity-50 font-neusans"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
