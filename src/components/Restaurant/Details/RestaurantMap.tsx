"use client";

import {
    GoogleMap,
    Marker,
    useLoadScript,
} from "@react-google-maps/api";
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FiX, FiMapPin } from "react-icons/fi";
import { GOOGLE_MAPS } from "@/constants/pages";

type Props = {
    lat: number | null | undefined;
    lng: number | null | undefined;
    onClick?: () => void;
    small?: boolean;
};

const mapContainerStyle = {
    width: "100%",
    height: "300px",
};

const RestaurantMap = ({ lat, lng, small = false }: Props) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    const [isOpen, setIsOpen] = useState(false);

    const isValidCoords =
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng);

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    if (!isValidCoords) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500 bg-gray-100 rounded-xl">
                <FiMapPin className="w-5 h-5 mr-2" />
                <span>Map location not available</span>
            </div>
        );
    }

    const center = { lat, lng };

    return (
        <>
            <div
                onClick={() => small && setIsOpen(true)}
                className={small ? "cursor-pointer" : ""}
            >
                <GoogleMap
                    mapContainerStyle={{
                        ...mapContainerStyle,
                        height: small ? "200px" : "400px",
                    }}
                    zoom={15}
                    center={center}
                    options={{ disableDefaultUI: small }}
                >
                    <Marker position={center} />
                </GoogleMap>
            </div>

            {/* Fullscreen Modal */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-4xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold">Map View</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div style={{ height: "500px", width: "100%" }}>
                            <GoogleMap
                                mapContainerStyle={{ width: "100%", height: "100%" }}
                                center={center}
                                zoom={15}
                            >
                                <Marker position={center} />
                            </GoogleMap>
                        </div>

                        <div className="p-4 text-right">
                            <a
                                href={GOOGLE_MAPS(lat, lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-[#E36B00] !rounded-[1vw] no-underline text-decoration-line: none; text-white font-medium py-2 px-4 rounded-lg"
                            >
                                Get Directions
                            </a>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
};

export default RestaurantMap;
