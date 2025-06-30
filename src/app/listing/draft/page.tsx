import ListingDraftPage from "@/components/Restaurant/Listing/ListingDraft";
import { Suspense } from "react";

const AddReviewPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <section className="min-h-[calc(100vh-670px)] md:min-h-[calc(100vh-580px)] lg:min-h-[calc(100vh-620px)] xl:min-h-[calc(100vh-360px)]">
        <ListingDraftPage />
      </section>
    </Suspense>
  );
};

export default AddReviewPage;
