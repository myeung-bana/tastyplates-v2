// components/Restaurant/Listing/AddListing.client.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import the form component
const AddListingPage = dynamic(() => import("./AddListing"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading form...</div>,
});

const AddListingWrapper = (props: any) => {
  return <AddListingPage />;
};

export default AddListingWrapper;
