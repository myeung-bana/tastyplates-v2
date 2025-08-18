// components/Restaurant/Listing/AddListing.client.tsx
"use client";

import dynamic from "next/dynamic";
import { LoadScript } from '@react-google-maps/api';

// Dynamically import the form component
const AddListingPage = dynamic(() => import("./AddListing"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading form...</div>,
});

const AddListingWrapper = (props: any) => {
  return <LoadScript
    googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
    libraries={['places']}
  >

    <AddListingPage />
  </LoadScript>
};

export default AddListingWrapper;
