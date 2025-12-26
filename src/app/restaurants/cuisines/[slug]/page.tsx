"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RestaurantPage from "@/components/Restaurant/Restaurant";

export default function CuisineRestaurantsPage() {
  const params = useParams();
  const cuisineSlug = params.slug as string;
  const [cuisineName, setCuisineName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCuisineName = async () => {
      try {
        // Fetch cuisine by slug using search parameter
        const response = await fetch(`/api/v1/cuisines/get-cuisines?search=${encodeURIComponent(cuisineSlug)}&limit=1`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Find exact match by slug (search does partial matching)
          const cuisine = data.data.find((c: { slug: string }) => c.slug === cuisineSlug);
          if (cuisine) {
            setCuisineName(cuisine.name);
          } else {
            // Fallback: use the first result or format the slug
            setCuisineName(data.data[0]?.name || cuisineSlug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
          }
        } else {
          // Fallback: format slug as name
          setCuisineName(cuisineSlug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
        }
      } catch (error) {
        console.error('Failed to fetch cuisine name:', error);
        // Fallback: format slug as name
        setCuisineName(cuisineSlug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
      }
    };

    if (cuisineSlug) {
      fetchCuisineName();
    }
  }, [cuisineSlug]);

  return <RestaurantPage cuisineSlug={cuisineSlug} cuisineName={cuisineName} hideCuisineFilter={true} />;
}

