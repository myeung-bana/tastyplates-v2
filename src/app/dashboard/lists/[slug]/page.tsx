// tastyplates-frontend/src/app/dashboard/lists/page.tsx
"use client";
import { useParams } from "next/navigation";
import { lists } from "@/data/dummyList";
import { restaurants } from "@/data/dummyRestaurants";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_lists.scss";

type tParams = { slug: string };

const ListsDetailPage = () => {
  const params = useParams();
  const slug = params.slug;

  const currentList = lists.find((list) => list.id === slug);

  const listRestaurants = currentList
    ? restaurants.filter((restaurant) =>
        currentList.restaurants.includes(restaurant.id)
      )
    : [];

  return (
    <div className="dashboard-content">
      <div className="lists-header">
        <h1>List: {slug} </h1>
      </div>
      <div className="restaurant-grid">
        {listRestaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default ListsDetailPage;
