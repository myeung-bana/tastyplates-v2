// tastyplates-frontend/src/app/dashboard/lists/page.tsx
"use client";
import { useParams } from "next/navigation";
import { lists } from "@/data/dummyList";
import { restaurants } from "@/data/dummyRestaurants";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_lists.scss";
import { useEffect, useRef, useState } from "react";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { Listing } from "@/interfaces/restaurant/restaurant";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineNames: string[];
  countries: string;
  priceRange: string;
  databaseId: number;
}

type tParams = { slug: string };


const ListsDetailPage = () => {
  const params = useParams();
  const slug = params?.slug;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const transformNodes = (nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
      rating: 4.5,
      databaseId: item.databaseId || 0, // Default to 0 if not present
      cuisineNames: item.cuisines || [],
      countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
      priceRange: "$$"
    }));
  };

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
    setLoading(true);
    try {
      const data = await RestaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes);

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

      setAfterCursor(data.pageInfo.endCursor);
      setHasMore(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants("", 8, null);
  }, []);


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
