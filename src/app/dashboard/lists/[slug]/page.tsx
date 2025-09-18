// tastyplates-frontend/src/app/dashboard/lists/page.tsx
"use client";
import { useParams } from "next/navigation";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_lists.scss";
import { useEffect, useState, useCallback } from "react";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { DEFAULT_IMAGE } from "@/constants/images";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
}

// Removed unused type

const restaurantService = new RestaurantService()

const ListsDetailPage = () => {
  const params = useParams();
  const slug = params?.slug;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || DEFAULT_IMAGE,
      rating: 4.5,
      databaseId: item.databaseId || 0, // Default to 0 if not present
      cuisineNames: item.palates || [],
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: "$$"
    }));
  };

  const fetchRestaurants = useCallback(async (search: string, first = 8, after: string | null = null) => {
    try {
      const data = await restaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes as unknown as Listing[]);

      setRestaurants(prev => {
        if (!after) {
          // New search: replace list
          return transformed;
        }
        // Pagination: append unique restaurants only
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map(r => [r.id, r]));
        return Array.from(uniqueMap.values());
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, [fetchRestaurants]);


  // const currentList = lists.find((list) => list.id === slug);

  // const listRestaurants = currentList
  //   ? restaurants.filter((restaurant) =>
  //       currentList.restaurants.includes(restaurant.id)
  //     )
  //   : [];

  return (
    <div className="dashboard-content">
      <div className="lists-header">
        <h1>List: {slug} </h1>
      </div>
      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default ListsDetailPage;
