import ListingExplanation from "@/components/Restaurant/Listing/ListingExplanation";
import { Suspense } from "react";

const ListingExplanationPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <section>
        <ListingExplanation />
      </section>
    </Suspense>
  );
};

export default ListingExplanationPage;
