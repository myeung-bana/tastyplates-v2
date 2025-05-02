'use client'
import { Restaurant, restaurants } from "@/data/dummyRestaurants"
import Link from "next/link"

// styles
import "@/styles/pages/_restaurants.scss";
import ListingCard from "./ListingCard";
import CustomModal from "@/components/ui/Modal/Modal";
import { useState } from "react";

const ListingDraftPage = () => {
      const [isShowDelete, setIsShowDelete] = useState<boolean>(false)
    const removeListing = (item: Restaurant, index: number) => {
        setIsShowDelete(true)
        console.log(item, 'item to remove')
        restaurants.splice(index, 1)
    }

    return (
        <div className="mt-20 mb-10 pt-10 lg:px-16">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-black">My Listing Draft</h1>
                <Link href="/listing/add" className="px-6 py-3 text-center text-[#FCFCFC] cursor-pointer bg-[#E36B00] font-semibold rounded-[50px]">Add New Listing</Link>
            </div>
            <div className="restaurants__grid mt-8">
                {restaurants.map((restaurant: Restaurant, index: number) => (
                    <ListingCard key={index} restaurant={restaurant} onDelete={() => removeListing(restaurant, index)} />
                ))}
            </div>
            <CustomModal
                header="Delete this Draft?"
                content="Your draft will be removed."
                isOpen={isShowDelete}
                setIsOpen={() => setIsShowDelete(!isShowDelete)}
            />
        </div>
    )
}

export default ListingDraftPage