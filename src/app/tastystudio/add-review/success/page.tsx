'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiArrowLeft, FiHome } from 'react-icons/fi';
import { TASTYSTUDIO_DASHBOARD, TASTYSTUDIO_ADD_REVIEW, TASTYSTUDIO_REVIEW_LISTING } from '@/constants/pages';

export default function ReviewSubmissionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantName = searchParams?.get('restaurant') || 'Restaurant';

  return (
    <div className="min-h-screen bg-white font-neusans">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-gray-200 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl md:text-3xl font-medium text-[#31343F] mb-4">
            Review Posted Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Your review for <span className="font-medium text-[#31343F]">{restaurantName}</span> has been successfully posted.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={TASTYSTUDIO_ADD_REVIEW}
              className="px-6 py-3 bg-[#ff7c0a] text-white rounded-xl hover:bg-[#ff7c0a]/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-5 h-5" />
              Post Another Review
            </Link>
            <Link
              href={TASTYSTUDIO_REVIEW_LISTING}
              className="px-6 py-3 bg-white text-[#494D5D] border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              View My Reviews
            </Link>
            <Link
              href={TASTYSTUDIO_DASHBOARD}
              className="px-6 py-3 bg-white text-[#494D5D] border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <FiHome className="w-5 h-5" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

