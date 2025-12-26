'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';
import Link from 'next/link';
import { FiEdit3, FiList, FiTrendingUp, FiClock } from 'react-icons/fi';
import { TASTYSTUDIO_ADD_REVIEW, TASTYSTUDIO_REVIEW_LISTING } from '@/constants/pages';
import ProfileSummary from '@/components/tastystudio/ProfileSummary';
import { GridLoader } from 'react-spinners';

const TastyStudioDashboard = () => {
  const { user, loading } = useFirebaseSession();
  const router = useRouter();
  
  // Get user identifier for useProfileData
  const userIdentifier = user?.username || user?.id || '';
  const { userData, loading: profileLoading } = useProfileData(userIdentifier);
  
  const [stats, setStats] = useState({
    totalReviews: 0,
    publishedReviews: 0,
    draftReviews: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch review statistics
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!userData?.id) {
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        const userId = userData.id as string;

        // Fetch all three counts in parallel
        const [totalResponse, approvedResponse, draftResponse] = await Promise.allSettled([
          restaurantUserService.getReviews({
            user_id: userId,
            limit: 1, // Only need meta.total
            offset: 0,
            // No status filter = all reviews
          }),
          restaurantUserService.getReviews({
            user_id: userId,
            limit: 1,
            offset: 0,
            status: 'approved', // Published/approved reviews
          }),
          restaurantUserService.getReviews({
            user_id: userId,
            limit: 1,
            offset: 0,
            status: 'draft', // Draft reviews
          }),
        ]);

        // Process total reviews
        if (totalResponse.status === 'fulfilled' && totalResponse.value.success) {
          setStats(prev => ({
            ...prev,
            totalReviews: totalResponse.value.meta?.total || 0,
          }));
        }

        // Process approved reviews
        if (approvedResponse.status === 'fulfilled' && approvedResponse.value.success) {
          setStats(prev => ({
            ...prev,
            publishedReviews: approvedResponse.value.meta?.total || 0,
          }));
        }

        // Process draft reviews
        if (draftResponse.status === 'fulfilled' && draftResponse.value.success) {
          setStats(prev => ({
            ...prev,
            draftReviews: draftResponse.value.meta?.total || 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (userData?.id && !profileLoading) {
      fetchReviewStats();
    }
  }, [userData?.id, profileLoading]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <GridLoader color="#ff7c0a" size={15} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-neusans">
      <div className="max-w-7xl mx-auto px-8 py-8 md:py-12">
        {/* Header - Reduced sizes */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl text-[#31343F] mb-1 font-neusans">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-neusans">
            Overview of your reviews and activity
          </p>
        </div>

        {/* Profile Summary */}
        <ProfileSummary />

        {/* Quick Actions - Reduced sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link
            href={TASTYSTUDIO_ADD_REVIEW}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 hover:border-[#ff7c0a] transition-colors group font-neusans"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center group-hover:bg-[#ff7c0a]/20 transition-colors">
                <FiEdit3 className="w-5 h-5 md:w-6 md:h-6 text-[#ff7c0a]" />
              </div>
              <div>
                <h3 className="text-base text-[#31343F] mb-1 font-neusans">
                  Upload a Review
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Create and share your dining experience
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={TASTYSTUDIO_REVIEW_LISTING}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 hover:border-[#ff7c0a] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center group-hover:bg-[#ff7c0a]/20 transition-colors">
                <FiList className="w-5 h-5 md:w-6 md:h-6 text-[#ff7c0a]" />
              </div>
              <div>
                <h3 className="text-base font-neusans text-[#31343F] mb-1">
                  Edit Reviews
                </h3>
                <p className="text-xs md:text-sm text-gray-600 font-neusans">
                  View and manage your reviews
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Section - Reduced sizes and real data */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg md:text-xl text-[#31343F] mb-4 md:mb-6 font-neusans">
            Overview
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#ff7c0a]/10 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-[#ff7c0a]" />
                </div>
                <div>
                  <p className="text-xl text-[#31343F] font-medium">
                    {stats.totalReviews}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Total Reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl text-[#31343F] font-medium">
                    {stats.publishedReviews}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Published</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl text-[#31343F] font-medium">
                    {stats.draftReviews}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">Drafts</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TastyStudioDashboard;
