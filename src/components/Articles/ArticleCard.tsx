"use client";
import Image from "next/image";
import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { Article } from "@/types/article";
import { DEFAULT_ARTICLE_COVER_IMAGE } from "@/constants/images";

interface ArticleCardProps {
  article: Article;
  /** Larger layout for homepage section */
  size?: "default" | "large";
}

function articleHref(article: Article): string {
  if (article.slug?.trim()) {
    return `/articles/${encodeURIComponent(article.slug.trim())}`;
  }
  return `/article/${article.id}`;
}

const ArticleCard = ({ article, size = "default" }: ArticleCardProps) => {
  const isLarge = size === "large";
  const coverSrc =
    article.cover_image_url?.trim() || DEFAULT_ARTICLE_COVER_IMAGE;

  return (
    <Link
      href={articleHref(article)}
      className="block overflow-hidden font-neusans group"
    >
      {/* Cover — landscape-friendly; larger cards use 16:9 */}
      <div
        className={`relative overflow-hidden rounded-2xl mb-2 ${
          isLarge ? "aspect-video" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={coverSrc}
          alt={article.featured_image_alt || article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes={
            isLarge
              ? "(max-width: 767px) 100vw, 25vw"
              : "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 25vw"
          }
        />
        {/* Category pill */}
        <span className="absolute bottom-2 left-2 bg-white/90 text-[#ff7c0a] text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
          {article.category}
        </span>
      </div>

      {/* Text */}
      <div className="px-0">
        <h3
          className={`font-semibold text-[#31343F] line-clamp-2 mb-1 leading-snug ${
            isLarge
              ? "text-sm md:text-base"
              : "text-[12px] md:text-sm"
          }`}
        >
          {article.title}
        </h3>
        <div
          className={`flex items-center gap-1 text-gray-400 ${
            isLarge ? "text-xs md:text-sm" : "text-[11px]"
          }`}
        >
          <FiClock className="w-3 h-3 flex-shrink-0" />
          <span>{article.reading_time_minutes} min read</span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
