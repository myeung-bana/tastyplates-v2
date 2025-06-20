import ListingDraftPage from "@/components/Restaurant/Listing/ListingDraft";
import { Suspense } from "react";

const AddReviewPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <section>
        <ListingDraftPage />
      </section>
    </Suspense>
  );
};

export default AddReviewPage;
