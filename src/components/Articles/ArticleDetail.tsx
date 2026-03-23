"use client";

import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiClock, FiEye, FiMapPin } from "react-icons/fi";
import { Article } from "@/types/article";
import { DEFAULT_ARTICLE_COVER_IMAGE } from "@/constants/images";
import { ArticleRelatedRestaurantsSection } from "@/components/Articles/ArticleRelatedRestaurantsSection";

export function ArticleDetailSkeleton() {
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

interface ArticleDetailProps {
  article: Article;
  backHref?: string;
  backLabel?: string;
}

export default function ArticleDetail({
  article,
  backHref = "/",
  backLabel = "Back",
}: ArticleDetailProps) {
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const authorLabel =
    article.author_profile?.displayName || article.author_name;

  const heroSrc =
    article.cover_image_url?.trim() || DEFAULT_ARTICLE_COVER_IMAGE;

  const linkedLocs = article.article_linked_locations ?? [];
  const linkedRestaurants = article.article_linked_restaurants ?? [];
  const cityLocation = linkedLocs.find((loc) => loc.type === "city") ?? linkedLocs[0];
  const associationCount = article.article_restaurant_associations?.length ?? 0;
  const hasAssociationIdsOnly = linkedRestaurants.length === 0 && associationCount > 0;

  return (
    <>
    <div className="max-w-2xl mx-auto px-4 pt-16 md:pt-24 pb-10 font-neusans">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#ff7c0a] transition-colors mb-6"
      >
        <FiArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      {article.category && (
        <span className="block text-[11px] text-[#ff7c0a] font-semibold uppercase tracking-wider mb-1">
          {article.category}
        </span>
      )}

      <h1 className="text-2xl md:text-3xl font-semibold text-[#1b1b1b] leading-snug mb-3">
        {article.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-6">
        {cityLocation?.name && (
          <>
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3" />
              {cityLocation.name}
            </span>
            <span>·</span>
          </>
        )}
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
        {authorLabel && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              {article.author_profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.author_profile.avatarUrl}
                  alt={authorLabel || "Author"}
                  width={16}
                  height={16}
                  className="rounded-full object-cover w-4 h-4"
                />
              ) : null}
              <span>{authorLabel}</span>
            </span>
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

      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8">
        <Image
          src={heroSrc}
          alt={article.featured_image_alt || article.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 767px) 100vw, 672px"
        />
      </div>

      {article.excerpt && (
        <p className="text-base text-gray-500 leading-relaxed mb-6 italic border-l-2 border-[#ff7c0a] pl-4">
          {article.excerpt}
        </p>
      )}

      {article.content && (
        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed text-gray-700">
          {article.content}
        </div>
      )}

      {linkedRestaurants.length > 0 && (
        <ArticleRelatedRestaurantsSection restaurants={linkedRestaurants} />
      )}

      {hasAssociationIdsOnly && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Restaurants in this story
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              This article covers {associationCount}{" "}
              {associationCount === 1 ? "place" : "places"} on TastyPlates.
            </p>
            <Link
              href="/restaurants"
              className="inline-flex text-sm font-medium text-[#ff7c0a] hover:underline"
            >
              Explore restaurants →
            </Link>
          </div>
        )}
    </div>
    </>
  );
}
