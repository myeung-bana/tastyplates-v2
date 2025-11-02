import { redirect } from "next/navigation";

// Redirect old /listing path to new /review-listing path for backwards compatibility
const ListingPageRedirect = () => {
  redirect("/review-listing");
};

export default ListingPageRedirect;
