import { redirect } from 'next/navigation';

const AddReviewSlugRedirect = ({ params }: { params: { slug: string } }) => {
  redirect(`/tastystudio/add-review/${params.slug}`);
};

export default AddReviewSlugRedirect;
