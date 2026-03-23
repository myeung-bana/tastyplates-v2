"use client";

import Image from "next/image";
import Link from "next/link";
import type { ArticleLinkedRestaurant } from "@/types/article";
import { DEFAULT_RESTAURANT_IMAGE } from "@/constants/images";

function sortedRestaurants(list: ArticleLinkedRestaurant[]): ArticleLinkedRestaurant[] {
  return [...list].sort((a, b) => {
    const ao = a.display_order ?? 0;
    const bo = b.display_order ?? 0;
    return ao - bo;
  });
}

export function ArticleRelatedRestaurantsSection({
  restaurants,
}: {
  restaurants: ArticleLinkedRestaurant[];
}) {
  if (!restaurants.length) return null;

  const rows = sortedRestaurants(restaurants);

  return (
    <section
      className="mt-10 pt-8 border-t border-gray-100 font-neusans"
      aria-labelledby="article-related-restaurants-heading"
    >
      <div className="max-w-none mx-auto">
        <h2
          id="article-related-restaurants-heading"
          className="text-lg md:text-xl font-semibold text-gray-900 mb-2 text-center"
        >
          Restaurants in this article
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Places we mention in this story — tap through for full listings, photos, and reviews.
        </p>
        <ul className="flex flex-col gap-4 md:gap-5">
          {rows.map((r) => {
            const href = r.slug ? `/restaurants/${encodeURIComponent(r.slug)}` : null;
            const img = r.imageUrl?.trim() || DEFAULT_RESTAURANT_IMAGE;

            const inner = (
              <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#ff7c0a]/30 transition-colors">
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={img}
                    alt={r.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 672px"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{r.title}</h3>
                  {r.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-3">
                      {r.description}
                    </p>
                  )}
                  {r.addressLine && (
                    <p className="text-xs text-gray-500 mt-auto">{r.addressLine}</p>
                  )}
                  {href && (
                    <span className="inline-flex mt-3 text-sm font-medium text-[#ff7c0a]">
                      View restaurant →
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <li key={r.associationId}>
                {href ? (
                  <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7c0a] rounded-2xl">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
