'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TASTYSTUDIO_ADD_REVIEW_CREATE, TASTYSTUDIO_ADD_REVIEW } from '@/constants/pages';

export default function AddReviewSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      // Redirect to new create route with query parameter
      router.replace(`${TASTYSTUDIO_ADD_REVIEW_CREATE}?slug=${encodeURIComponent(slug)}`);
    } else {
      // Fallback to search page
      router.replace(TASTYSTUDIO_ADD_REVIEW);
    }
  }, [slug, router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center font-neusans">Loading...</div>
    </div>
  );
}
