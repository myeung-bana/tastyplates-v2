"use client";
import React, { FormEvent, useState } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import Footer from "@/components/Footer";
import "@/styles/pages/_restaurants.scss";
import { Restaurant, restaurants } from "@/data/dummyRestaurants";
import { cuisines } from "@/data/dummyCuisines"; // Import cuisines for filtering
import Filter from "@/components/Filter/Filter";
import { FiSearch } from "react-icons/fi";
import ListingCard from "./ListingCard";
import CustomModal from "@/components/ui/Modal/Modal";

const ListingPage = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [listing, setListing] = useState<string>("");
  const [isShowDelete, setIsShowDelete] = useState<boolean>(false)

  // Filter restaurants based on the selected cuisine type
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.cuisineIds.some((cuisineId) =>
      cuisines
        .find((cuisine) => cuisine.id === cuisineId)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    console.log('here')
  }

  const removeListing = (item: Restaurant, index: number) => {
    setIsShowDelete(true)
    console.log(item, 'item to remove')
    restaurants.splice(index, 1)
  }

  return (
    <>
      <div className="font-inter max-w-[80rem] mx-auto mt-10">
        <div className="mt-8 flex flex-col justify-center items-center">
            <h1 className="text-2xl text-[#31343F] text font-medium">Find a listing to review</h1>
            <form onSubmit={handleSearch} className="my-10  max-w-[525px] w-full">
                <div className="hero__search-wrapper !p-3.5 !rounded-[50px] gap-6 border border-[#E5E5E5]">
                    <div className="hero__search-restaurant !bg-transparent">
                        <FiSearch className="hero__search-icon" />
                        <input
                        type="text"
                        placeholder="Search by Listing Name"
                        className="hero__search-input"
                        value={listing}
                        onChange={(e) => setListing(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-full text-[#FCFCFC] h-[44px] font-semibold w-fit px-6 py-3 text-center bg-[#E36B00]"
                    >
                        Search
                    </button>
                </div>
            </form>
          <div className="restaurants__content mt-10">
            <h1 className="text-2xl text-[#31343F] text-center text font-medium">My Review Drafts</h1>
            <div className="restaurants__grid mt-8">
                {restaurants.map((restaurant: Restaurant, index: number) => (
                  <ListingCard key={index} restaurant={restaurant} onDelete={() => removeListing(restaurant, index)} />
                ))}
            </div>
          </div>
          <div className="restaurants__content mt-10">
            <h1 className="text-2xl text-[#31343F] text-center text font-medium">Recently Visited</h1>
            <div className="restaurants__grid mt-8">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <CustomModal
          header="Delete this Draft?"
          content="Your draft will be removed."
          isOpen={isShowDelete}
          setIsOpen={() => setIsShowDelete(!isShowDelete)}
      />
    </>
  );
};

export default ListingPage;
