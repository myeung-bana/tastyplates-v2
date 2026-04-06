"use client";

import { useEffect, useState } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { DEFAULT_RESTAURANT_IMAGE } from "@/constants/images";

interface FeaturedRestaurantData {
  id: number;
  restaurant_id: number;
  sort_order: number;
  restaurant: {
    id: number;
    uuid: string;
    title: string;
    slug: string;
    featured_image_url: string | null;
    listing_street: string | null;
    address: {
      city?: string;
      country_short?: string;
      street_address?: string;
    } | null;
    average_rating: number | null;
    ratings_count: number | null;
  };
}

const SPLIDE_OPTIONS = {
  type: "slide" as const,
  drag: "free" as const,
  snap: true,
  perPage: 3,
  perMove: 1,
  gap: "1rem",
  padding: { left: "1rem", right: "1rem" },
  pagination: false,
  arrows: false,
  breakpoints: {
    768: {
      perPage: 1,
      gap: "0.75rem",
      padding: { left: "0.75rem", right: "20%" },
    },
    1024: {
      perPage: 2,
      gap: "1rem",
      padding: { left: "1rem", right: "1rem" },
    },
  },
};

function getDisplayAddress(
  listing_street: string | null | undefined,
  address: FeaturedRestaurantData["restaurant"]["address"]
): string | null {
  if (listing_street?.trim()) return listing_street.trim();
  if (address?.street_address?.trim()) return address.street_address.trim();
  if (address?.city) {
    return address.country_short
      ? `${address.city}, ${address.country_short}`
      : address.city;
  }
  return null;
}

function FeaturedCard({
  restaurant,
}: {
  restaurant: FeaturedRestaurantData["restaurant"];
}) {
  const address = getDisplayAddress(
    restaurant.listing_street,
    restaurant.address
  );

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-gray-200"
    >
      <Image
        src={restaurant.featured_image_url || DEFAULT_RESTAURANT_IMAGE}
        alt={restaurant.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 80vw, (max-width: 1024px) 45vw, 30vw"
      />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Text on top of image */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="text-white text-lg md:text-xl font-neusans font-medium leading-snug line-clamp-2">
          {restaurant.title}
        </h3>
        {address && (
          <p className="mt-1.5 flex items-center gap-1 text-white/80 text-sm font-neusans truncate">
            <HiOutlineLocationMarker className="h-3.5 w-3.5 shrink-0" />
            {address}
          </p>
        )}
      </div>
    </Link>
  );
}

function SkeletonSlider() {
  return (
    <div className="flex gap-3 md:gap-4 overflow-hidden px-3 md:px-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="shrink-0 w-[80%] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function FeaturedRestaurants() {
  const [items, setItems] = useState<FeaturedRestaurantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/featured-restaurants")
      .then((r) => r.json())
      .then(({ success, data }) => {
        if (success && Array.isArray(data)) {
          setItems(data.filter((d: FeaturedRestaurantData) => d.restaurant));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full py-6 md:py-10">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-center text-xl md:text-2xl font-neusans font-normal text-[#1b1b1b] mb-4 md:mb-6">
          Featured Restaurants
        </h2>

        {loading ? (
          <SkeletonSlider />
        ) : (
          <Splide options={SPLIDE_OPTIONS} aria-label="Featured Restaurants">
            {items.map((item) => (
              <SplideSlide key={item.id}>
                <FeaturedCard restaurant={item.restaurant} />
              </SplideSlide>
            ))}
          </Splide>
        )}
      </div>
    </section>
  );
}
