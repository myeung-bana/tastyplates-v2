'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { TASTYSTUDIO_ADD_REVIEW, TASTYSTUDIO_REVIEW_LISTING } from '@/constants/pages';
import { useNhostSession } from '@/hooks/useNhostSession';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/components/auth/AuthModalWrapper';
import toast from 'react-hot-toast';

function ReviewSubmissionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { nhostUser, loading } = useNhostSession();
  const { showSignin } = useAuthModal();
  const restaurantName = searchParams?.get('restaurant') || 'Restaurant';

  useEffect(() => {
    if (loading) return;
    if (!nhostUser) {
      toast.error('You must be logged in to access this page');
      router.replace('/');
      setTimeout(() => {
        showSignin();
      }, 100);
    }
  }, [loading, nhostUser, router, showSignin]);

  if (loading || !nhostUser) {
    return (
      <div className="min-h-screen bg-white font-neusans flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[#494D5D] font-neusans">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-neusans">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl md:text-3xl font-medium text-[#31343F] mb-4 font-neusans">
            Review Posted Successfully!
          </h1>
          <p className="text-base text-[#494D5D] mb-8 font-neusans">
            Your review for <span className="font-medium text-[#31343F]">{restaurantName}</span> has been successfully posted.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="primary"
              size="default"
            >
              <Link href={TASTYSTUDIO_ADD_REVIEW} className="flex items-center gap-2">
                Post Another Review
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="default"
            >
              <Link href={TASTYSTUDIO_REVIEW_LISTING}>
                View My Reviews
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewSubmissionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white font-neusans flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[#494D5D] font-neusans">Loading...</div>
        </div>
      </div>
    }>
      <ReviewSubmissionSuccessContent />
    </Suspense>
  );
}
