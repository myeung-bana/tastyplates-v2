"use client";

import Image from "next/image";
import Link from "next/link";
import { RESTAURANTS } from "@/constants/pages";
import { QUICK_FINDS } from "./quickFindsConfig";
import { cn } from "@/lib/utils";

function buildHref(slug: string): string {
  const params = new URLSearchParams();
  params.set("palate", slug);
  return `${RESTAURANTS}?${params.toString()}`;
}

export default function QuickFinds() {
  return (
    <section
      className="w-full max-w-6xl mx-auto px-4 md:px-6"
      aria-labelledby="quick-finds-heading"
    >
      <div className="pt-8 md:pt-10 pb-10 md:pb-14 bg-white rounded-2xl p-4">
        <h2
          id="quick-finds-heading"
          className="text-xl md:text-2xl font-medium text-gray-900 font-neusans tracking-tight mb-4"
        >
          Quick Finds
        </h2>
        <ul
          className={cn(
            "mt-5 grid grid-cols-5 gap-2.5 gap-y-4 sm:gap-3 sm:gap-y-5 md:gap-4 md:gap-y-6",
            "list-none p-0 m-0 w-full pb-2 md:pb-4"
          )}
        >
          {QUICK_FINDS.map((item) => (
            <li key={item.slug} className="min-w-0">
              <Link
                href={buildHref(item.slug)}
                className={cn(
                  "group flex flex-col items-stretch gap-1.5 md:gap-2 rounded-2xl",
                  "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7c0a] focus-visible:ring-offset-2"
                )}
              >
                <span
                  className={cn(
                    "relative mx-auto block aspect-square w-full overflow-hidden rounded-2xl bg-white",
                    "md:h-[100px] md:w-[100px] md:max-h-[100px] md:max-w-[100px]",
                    "shadow-sm",
                    "group-hover:shadow-md group-hover:ring-[#ff7c0a]/30"
                  )}
                >
                  <Image
                    src={`/icons/cuisines/${item.iconFile}`}
                    alt=""
                    fill
                    className="object-contain p-1 sm:p-1.5 md:p-2"
                    sizes="(max-width: 768px) 18vw, 100px"
                  />
                </span>
                <span
                  className={cn(
                    "text-center text-[0.6875rem] leading-tight min-[400px]:text-xs md:text-sm",
                    "font-medium text-gray-700 font-neusans line-clamp-2"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
