"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiClock, FiEye } from "react-icons/fi";
import { Article } from "@/types/article";
import { MOCK_ARTICLES } from "@/data/mockArticles";
import { transformHasuraArticle } from "@/utils/articleTransformers";

function ArticleDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24 pb-10 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-16 mb-6" />
      <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-300 rounded w-full mb-1" />
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-4" />
        <div className="h-3 bg-gray-200 rounded w-28" />
      </div>
      <div className="w-full aspect-[16/9] rounded-2xl bg-gray-300 mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!id) return;

    const isBlogDev = process.env.NEXT_PUBLIC_BLOG_DEV === "true";

    if (isBlogDev) {
      const found = MOCK_ARTICLES.find((a) => a.id === id) ?? null;
      if (!found) setNotFoundState(true);
      setArticle(found);
      setLoading(false);
    } else {
      fetch(`/api/v1/articles/get-article-by-id?id=${id}`)
        .then((res) => {
          if (res.status === 404) {
            setNotFoundState(true);
            return null;
          }
          return res.json();
        })
        .then((json) => {
          if (json?.success && json.data) {
            setArticle(transformHasuraArticle(json.data));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <ArticleDetailSkeleton />;
  if (notFoundState || !article) return notFound();

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24 pb-10 font-neusans">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#ff7c0a] transition-colors mb-6"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Category */}
      {article.category && (
        <span className="block text-[11px] text-[#ff7c0a] font-semibold uppercase tracking-wider mb-1">
          {article.category}
        </span>
      )}

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-semibold text-[#1b1b1b] leading-snug mb-3">
        {article.title}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-6">
        <span className="flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          {article.reading_time_minutes} min read
        </span>
        {formattedDate && (
          <>
            <span>·</span>
            <span>{formattedDate}</span>
          </>
        )}
        {article.author_name && (
          <>
            <span>·</span>
            <span>{article.author_name}</span>
          </>
        )}
        {typeof article.view_count === "number" && article.view_count > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FiEye className="w-3 h-3" />
              {article.view_count.toLocaleString()}
            </span>
          </>
        )}
      </div>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <Image
            src={article.cover_image_url}
            alt={article.featured_image_alt || article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 767px) 100vw, 672px"
          />
        </div>
      )}

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-base text-gray-500 leading-relaxed mb-6 italic border-l-2 border-[#ff7c0a] pl-4">
          {article.excerpt}
        </p>
      )}

      {/* Full content */}
      {article.content && (
        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed text-gray-700">
          {article.content}
        </div>
      )}
    </div>
  );
}
