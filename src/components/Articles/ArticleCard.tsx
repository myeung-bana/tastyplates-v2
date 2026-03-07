"use client";
import Image from "next/image";
import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = ({ article }: ArticleCardProps) => (
  <Link href={`/article/${article.id}`} className="block overflow-hidden font-neusans group">
    {/* Cover image — 4:3 */}
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-2">
      {article.cover_image_url ? (
        <Image
          src={article.cover_image_url}
          alt={article.featured_image_alt || article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 767px) 50vw, 25vw"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" />
      )}
      {/* Category pill */}
      <span className="absolute bottom-2 left-2 bg-white/90 text-[#ff7c0a] text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {article.category}
      </span>
    </div>

    {/* Text */}
    <div className="px-0">
      <h3 className="text-[12px] md:text-sm font-semibold text-[#31343F] line-clamp-2 mb-1 leading-snug">
        {article.title}
      </h3>
      <div className="flex items-center gap-1 text-[11px] text-gray-400">
        <FiClock className="w-3 h-3 flex-shrink-0" />
        <span>{article.reading_time_minutes} min read</span>
      </div>
    </div>
  </Link>
);

export default ArticleCard;
