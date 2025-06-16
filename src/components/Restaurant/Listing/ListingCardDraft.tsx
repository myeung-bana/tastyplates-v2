// ListingCardDraft.tsx
import React from 'react';
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { FaStar } from 'react-icons/fa';
// import Photo from "../../public/images/default-image.png";
import Photo from "../../../../public/images/Photos-Review-12.png"; // Adjust the path as necessary
import { useSession } from 'next-auth/react';
import { RestaurantService } from '@/services/restaurant/restaurantService';


// Define the interface for the restaurant data passed to the card
interface FetchedRestaurant {
    id: string;
    databaseId: number;
    title: string;
    slug: string;
    content: string;
    listingStreet: string;
    palates: { nodes: { name: string }[] };
    featuredImage: { node: { sourceUrl: string } };
    listingCategories: { nodes: { id: string; name: string }[] };
    countries: { nodes: { name: string }[] };
}

interface ListingCardProps {
    restaurant: FetchedRestaurant;
    onDeleteSuccess: () => void; // Function to handle deleting the draft
}

const ListingCardDraft: React.FC<ListingCardProps> = ({ restaurant, onDeleteSuccess }) => {
    const imageUrl = restaurant.featuredImage?.node?.sourceUrl || Photo;
    const cuisineNames = restaurant.palates?.nodes?.map(palate => palate.name) || [];
    const countryNames = restaurant.countries?.nodes?.map(country => country.name).join(', ') || restaurant.listingStreet || 'Unknown Location';
    const { data: session } = useSession();
    const accessToken = session?.accessToken || "";
    const addReview = () => {
        console.log(`Adding review for ${restaurant.title}`);
    };

        const handleDelete = async () => {
        if (!accessToken) {
            alert("Authentication token is missing. Please log in.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete "${restaurant.title}"?`)) {
            try {
                await RestaurantService.deleteRestaurantListing(restaurant.databaseId, accessToken);
                alert("Listing deleted successfully!");
                onDeleteSuccess(); // Call the parent's function to re-fetch listings or update UI
            } catch (error: any) {
                console.error("Failed to delete listing:", error);
                alert(error.message || "Failed to delete listing. Please try again.");
            }
        }
    };

    return (
        <div className="restaurant-card border rounded-lg overflow-hidden shadow-md bg-white">
            <div className="restaurant-card__image relative">
                <Image
                src={imageUrl }
                alt="Review Draft"
                width={304}
                height={228}
                className="restaurant-card__img"
                />
                {/* <span className="restaurant-card__price">{restaurant.priceRange}</span> */}
                <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
                <button
                    className="rounded-full p-2 bg-white"
                    onClick={handleDelete} 
                >
                    <IoMdClose />
                </button>
                </div>
            </div>
            {/* Modified Link to point to /add-listing with resId */}
            <a href={`/listing/step-1?resId=${restaurant.databaseId}`}>
                <div className="restaurant-card__content p-4">
                    <div className="restaurant-card__header flex justify-between items-start mb-2">
                        <h2 className="restaurant-card__name text-lg font-semibold line-clamp-1 flex-grow pr-2">{restaurant.title}</h2>
                    </div>

                    <div className="restaurant-card__info text-sm text-gray-600 mb-2">
                        <div className="restaurant-card__location flex items-center">
                            <span className="line-clamp-2 text-xs md:text-sm">{countryNames}</span>
                        </div>
                    </div>

                    <div className="restaurant-card__tags flex flex-wrap gap-1 text-xs text-gray-500">
                        {cuisineNames.map((cuisineName, index) => (
                            <span key={index} className="restaurant-card__tag bg-gray-100 px-2 py-1 rounded-full">
                                &#8226; {cuisineName}
                            </span>
                        ))}
                    </div>

                </div>
            </a>
        </div>
    );
};

export default ListingCardDraft;