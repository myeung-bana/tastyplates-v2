import ListingPage from "@/components/Restaurant/Listing/Listing";
import { Suspense } from "react";

const AddReviewPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <section>
        <ListingPage />
      </section>
    </Suspense>
  );
};

export default AddReviewPage;
