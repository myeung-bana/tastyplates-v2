'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import Link from 'next/link';
import { FiEdit3, FiList, FiTrendingUp, FiClock } from 'react-icons/fi';
import { TASTYSTUDIO_ADD_REVIEW, TASTYSTUDIO_REVIEW_LISTING } from '@/constants/pages';

const TastyStudioDashboard = () => {
  const { user, loading } = useFirebaseSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReviews: 0,
    publishedReviews: 0,
    draftReviews: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center font-neusans">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-neusans">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl text-[#31343F] mb-2 font-neusans">
            Dashboard
          </h1>
          <p className="text-gray-600 text-base md:text-lg font-neusans">
            Overview of your reviews and activity
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          <Link
            href={TASTYSTUDIO_ADD_REVIEW}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#ff7c0a] transition-colors group font-neusans"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center group-hover:bg-[#ff7c0a]/20 transition-colors">
                <FiEdit3 className="w-6 h-6 text-[#ff7c0a]" />
              </div>
              <div>
                <h3 className="text-lg text-[#31343F] mb-1 font-neusans">
                  Upload a Review
                </h3>
                <p className="text-sm text-gray-600">
                  Create and share your dining experience
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={TASTYSTUDIO_REVIEW_LISTING}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#ff7c0a] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center group-hover:bg-[#ff7c0a]/20 transition-colors">
                <FiList className="w-6 h-6 text-[#ff7c0a]" />
              </div>
              <div>
                <h3 className="text-lg font-neusans text-[#31343F] mb-1">
                  Edit Reviews
                </h3>
                <p className="text-sm text-gray-600 font-neusans">
                  View and manage your reviews
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl md:text-2xl text-[#31343F] mb-6 font-neusans">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-[#ff7c0a]" />
              </div>
              <div>
                <p className="text-2xl text-[#31343F]">
                  {stats.totalReviews}
                </p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiEdit3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl text-[#31343F]">
                  {stats.publishedReviews}
                </p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl text-[#31343F]">
                  {stats.draftReviews}
                </p>
                <p className="text-sm text-gray-600">Drafts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TastyStudioDashboard;
