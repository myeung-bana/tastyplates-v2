"use client";

import {
    GoogleMap,
    Marker,
    useLoadScript,
} from "@react-google-maps/api";
import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FiX, FiMapPin } from "react-icons/fi";
import { GOOGLE_MAPS } from "@/constants/pages";
import { GoogleMapUrl } from "@/utils/addressUtils";

type Props = {
    lat?: number | null | undefined;
    lng?: number | null | undefined;
    googleMapUrl?: GoogleMapUrl | null;
    address?: string | null;
    onClick?: () => void;
    small?: boolean;
};

const mapContainerStyle = {
    width: "100%",
    height: "300px",
};

const RestaurantMap = ({ lat, lng, googleMapUrl, address, small = false }: Props) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places', 'geocoding'],
    });

    const [isOpen, setIsOpen] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [geocodingError, setGeocodingError] = useState<string | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Geocoding function to convert address to coordinates
    const geocodeAddress = async (addressString: string): Promise<{ lat: number; lng: number } | null> => {
        if (!window.google || !window.google.maps) return null;
        
        const geocoder = new window.google.maps.Geocoder();
        
        return new Promise((resolve) => {
            geocoder.geocode({ address: addressString }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    console.error('Geocoding failed:', status);
                    resolve(null);
                }
            });
        });
    };

    // Build address string from googleMapUrl components
    const buildAddressString = (mapUrl: GoogleMapUrl): string => {
        const parts = [
            mapUrl.streetAddress,
            [mapUrl.streetNumber, mapUrl.streetName].filter(Boolean).join(' '),
            mapUrl.city,
            mapUrl.stateShort || mapUrl.state,
            mapUrl.countryShort || mapUrl.country,
            mapUrl.postCode
        ].filter(Boolean);
        
        return parts.join(', ');
    };

    // Effect to handle geocoding
    useEffect(() => {
        const getCoordinates = async () => {
            // Priority 1: Use provided lat/lng if valid
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                setCoordinates({ lat, lng });
                return;
            }

            // Priority 2: Use address string if provided
            if (address && address.trim() && address !== 'No address available') {
                setIsGeocoding(true);
                setGeocodingError(null);
                
                const coords = await geocodeAddress(address);
                if (coords) {
                    setCoordinates(coords);
                } else {
                    setGeocodingError('Could not find location for this address');
                }
                setIsGeocoding(false);
                return;
            }

            // Priority 3: Build address from googleMapUrl components
            if (googleMapUrl) {
                const addressString = buildAddressString(googleMapUrl);
                if (addressString.trim()) {
                    setIsGeocoding(true);
                    setGeocodingError(null);
                    
                    const coords = await geocodeAddress(addressString);
                    if (coords) {
                        setCoordinates(coords);
                    } else {
                        setGeocodingError('Could not find location for this address');
                    }
                    setIsGeocoding(false);
                    return;
                }
            }

            // No valid location data available
            setCoordinates(null);
            setGeocodingError('No location data available');
        };

        if (isLoaded) {
            getCoordinates();
        }
    }, [isLoaded, lat, lng, address, googleMapUrl]);

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;
    if (isGeocoding) return <div>Finding location...</div>;

    if (!coordinates || geocodingError) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500 bg-gray-100 rounded-xl">
                <FiMapPin className="w-5 h-5 mr-2" />
                <span>{geocodingError || 'Map location not available'}</span>
            </div>
        );
    }

    return (
        <>
            <div
                onClick={() => small && setIsOpen(true)}
                className={`font-neusans ${small ? "cursor-pointer" : ""}`}
            >
                <GoogleMap
                    mapContainerStyle={{
                        ...mapContainerStyle,
                        height: small ? "203px" : "400px",
                    }}
                    zoom={15}
                    center={coordinates}
                    options={{ disableDefaultUI: small }}
                >
                    <Marker position={coordinates} />
                </GoogleMap>
            </div>

            {/* Fullscreen Modal */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-[1010]">
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
                                center={coordinates}
                                zoom={15}
                            >
                                <Marker position={coordinates} />
                            </GoogleMap>
                        </div>

                        <div className="p-4 text-right">
                            <a
                                href={GOOGLE_MAPS(coordinates.lat, coordinates.lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-[#E36B00] no-underline text-decoration-line: none; text-white font-medium py-2 px-4 rounded-xl"
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
