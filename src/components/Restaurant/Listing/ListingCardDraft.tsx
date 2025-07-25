// ListingCardDraft.tsx
import React, { useState } from 'react';
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import Photo from "../../../../public/images/default-image.png";
import { useSession } from 'next-auth/react';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import ReviewModal from "@/components/ui/Modal/ReviewModal"; 
import toast from 'react-hot-toast';
import { deleteDraftError, deleteDraftSuccess } from "@/constants/messages";
import { formatDateT } from '@/lib/utils';

interface FetchedRestaurant {
    id: string;
    databaseId: number;
    title: string;
    slug: string;
    date: string;
    content: string;
    listingStreet: string;
    listingDetails: { googleMapUrl: { streetAddress: string} } | null;
    palates: { nodes: { name: string }[] };
    featuredImage: { node: { sourceUrl: string } };
    listingCategories: { nodes: { id: string; name: string }[] };
    countries: { nodes: { name: string }[] };
}

interface ListingCardProps {
    restaurant: FetchedRestaurant;
    onDeleteSuccess: () => void;
}

const ListingCardDraft: React.FC<ListingCardProps> = ({ restaurant, onDeleteSuccess }) => {
    const imageUrl = restaurant.featuredImage?.node?.sourceUrl || Photo;
    const cuisineNames = restaurant.palates?.nodes?.map(palate => palate.name) || [];
    const countryNames = restaurant.listingDetails?.googleMapUrl.streetAddress || restaurant.listingStreet || 'Unknown Location';
    const { data: session } = useSession();
    const accessToken = session?.accessToken || "";

    const [isShowDelete, setIsShowDelete] = useState<boolean>(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);

    const handleDeleteClick = () => {
        setIsShowDelete(true);
    };

    const confirmDelete = async () => {
        if (!accessToken) {
            toast.error("Authentication token is missing. Please log in.");
            return;
        }

        setIsLoadingDelete(true);
        try {
            await RestaurantService.deleteRestaurantListing(restaurant.databaseId, accessToken);
            toast.success(deleteDraftSuccess);
            onDeleteSuccess();
            setIsShowDelete(false);
        } catch (error: any) {
            console.error("Failed to delete listing:", error);
            toast.error(error.message || deleteDraftError);
        } finally {
            setIsLoadingDelete(false);
        }
    };

    return (
        <div className="restaurant-card border rounded-lg overflow-hidden shadow-md bg-white">
            <div className="restaurant-card__image relative">
                <Image
                    src={imageUrl}
                    alt="Review Draft"
                    width={304}
                    height={228}
                    className="restaurant-card__img"
                />
                <div className="flex flex-col gap-2 absolute top-2 right-2 md:top-4 md:right-4 text-[#31343F]">
                    <button
                        className="rounded-full p-2 bg-white"
                        onClick={handleDeleteClick}
                    >
                        <IoMdClose />
                    </button>
                </div>
            </div>
            <a href="#">
                 {/* {`/listing/step-1?resId=${restaurant.databaseId}`}> */}
                <div className="restaurant-card__content p-5">
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
                    <span className="restaurant-card__tags flex flex-wrap gap-1 text-xs text-gray-500 mt-3 p-2">{formatDateT(restaurant.date)}</span>
                </div>
            </a>

            <ReviewModal
                header="Delete this Draft?"
                content="Your draft will be removed."
                isOpen={isShowDelete}
                setIsOpen={(open: boolean) => {
                    if (!isLoadingDelete) setIsShowDelete(open);
                }}
                onConfirm={confirmDelete}
                loading={isLoadingDelete}
            />
        </div>
    );
};

export default ListingCardDraft;