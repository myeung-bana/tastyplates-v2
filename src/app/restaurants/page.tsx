"use client";
import React, { useState } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import Footer from "@/components/Footer";
import "@/styles/pages/_restaurants.scss";
import { restaurants } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import Filter from "@/components/Filter/Filter";

const RestaurantPage = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Filter restaurants based on the selected cuisine type
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.cuisineIds.some((cuisineId) =>
      cuisines
        .find((cuisine) => cuisine.id === cuisineId)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const handleFilterChange = (filterType: string, value: string) => {
    // TODO: Implement filter logic
    console.log(`Filter changed: ${filterType} = ${value}`);
  };

  const handleCuisineSelect = (cuisineName: string) => {
    setSearchTerm(cuisineName); // Set the search term to the selected cuisine
    setShowDropdown(false); // Hide the dropdown after selection
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
                  placeholder="Search by Listing Name..."
                  value={searchTerm}
                  onFocus={() => setShowDropdown(true)} // Show dropdown on focus
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar__input"
                />
                {showDropdown && (
                  <div className="cuisine-dropdown">
                    {cuisines.map((cuisine) => (
                      <div
                        key={cuisine.id}
                        className="cuisine-dropdown__item"
                        onClick={() => handleCuisineSelect(cuisine.name)} // Handle cuisine selection
                      >
                        {cuisine.name}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          <div className="restaurants__content">
            {/* <h2> I'm a Japanese Palate searching for ...</h2> */}
            <div className="restaurants__grid">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RestaurantPage;
