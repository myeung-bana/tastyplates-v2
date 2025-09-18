// app/listing/step-1/page.tsx
import { Suspense } from "react";
import AddListingWrapper from "@/components/Restaurant/Listing/AddListingClient";

const AddReviewPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <AddListingWrapper />
    </Suspense>
  );
};

export default AddReviewPage;
