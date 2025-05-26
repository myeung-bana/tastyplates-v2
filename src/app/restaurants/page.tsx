"use client";
import React, { useState } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import Footer from "@/components/Footer";
import "@/styles/pages/_restaurants.scss";
import { AllCuisines, GetListingsData } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import Filter from "@/components/Filter/Filter";
import { useQuery } from "@apollo/client";
import{ GET_ALL_CUISINES, GET_LISTINGS} from "@/app/graphql/queries";
import client  from "@/app/graphql/client";
import SkeletonCard from "@/components/SkeletonCard";

const RestaurantPage = () => {
const [searchTerm, setSearchTerm] = useState("");
const [showDropdown, setShowDropdown] = useState(false);


  // Filter restaurants based on the selected cuisine type
// const ITEMS_PER_PAGE = 10;
const { data: listingsData, loading: listingsLoading, error: listingsError } = useQuery<GetListingsData>(GET_LISTINGS);
const { data: cuisinesData, loading: cuisinesLoading, error: cuisinesError } = useQuery<AllCuisines>(GET_ALL_CUISINES);

  
  if (listingsLoading) {
    return (
      <div className="restaurants__grid">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}


const restaurants = listingsData?.listings.nodes.map((item) => ({
  id: item.id,
  slug: item.slug,
  name: item.title,
  image: item.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png", 
  rating: 4.5,
  cuisineNames: item.cuisines?.nodes.map((c) => c.name) || [],
  cuisineIds: item.cuisines?.nodes.map((c) => c.id) || [],
  location: item.locations?.nodes.map((l) => l.name).join(", ") || "Unknown",
  priceRange: "$$", 
  address: item.address || "Not provided",
  phone: "", 
  reviews: 0,
  description: item.content || "",
}));

const filteredRestaurants = searchTerm
  ? restaurants?.filter((restaurant) =>
      restaurant.cuisineNames.some((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  : restaurants;


  const handleFilterChange = (filterType: string, value: string) => {
    // TODO: Implement filter logic
    console.log(`Filter changed: ${filterType} = ${value}`);
  };

const handleCuisineSelect = (cuisineName: string) => {
  setSearchTerm(cuisineName);
  setShowDropdown(false);
};

const clearFilter = () => {
  setSearchTerm("");
};


  return (
    <>
      <div className="restaurants min-h-[70vh] font-inter">
        {/* <h1 className="restaurants__title">Restaurants Near You</h1> */}
        <div className="restaurants__container">
          <div className="flex items-center justify-between">
            <Filter onFilterChange={handleFilterChange} />
            <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by Cuisine"
                  value={searchTerm}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar__input"
                />

            {showDropdown && (
              <div className="cuisine-dropdown absolute bg-white shadow-lg z-10 w-full">
                {cuisinesData?.cuisines.nodes.map((cuisine) => (
                  <div
                    key={cuisine.id}
                    className="cuisine-dropdown__item p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleCuisineSelect(cuisine.name)}
                  >
                    {cuisine.name}
                  </div>
                ))}
              </div>
            )}
            </div>
                  {searchTerm && (
                    <button
                      onClick={clearFilter}
                      className="clear-filter-btn absolute right-2 top-2 text-sm text-gray-500 hover:text-black"
                    >
                      ✕
                    </button>
                  )}
          </div>
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
            {filteredRestaurants?.length ? (
                filteredRestaurants.map((rest) => (
                  <RestaurantCard key={rest.id} restaurant={rest} />
                ))
              ) : (
                <p className="text-gray-500">No restaurants match your filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RestaurantPage;
